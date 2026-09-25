-- =====================================================================
-- Wreckfest Race Log — Supabase schema
-- Run this in the Supabase SQL editor on a fresh project.
-- =====================================================================

-- All tables/functions below live in wf1, not public — `public` gets its
-- schema-level and table-level grants for anon/authenticated automatically
-- from Supabase's project defaults; a custom schema doesn't, so the grants
-- block at the bottom of this file spells them out explicitly.
create schema if not exists wf1;

-- Tracks: shared catalogue (no user_id — same set for everyone).
create table if not exists wf1.tracks (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    slug text not null unique,
    created_at timestamptz not null default now()
);

-- Track variations: routes/configurations of a track.
create table if not exists wf1.track_variations (
    id uuid primary key default gen_random_uuid(),
    track_id uuid not null references wf1.tracks(id) on delete cascade,
    name text not null,
    slug text not null,
    created_at timestamptz not null default now(),
    unique (track_id, slug)
);

-- Vehicles: shared catalogue.
create table if not exists wf1.vehicles (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    class text,
    image_url text,
    created_at timestamptz not null default now()
);

-- For projects upgrading from an earlier schema version: add the columns
-- if they're missing. Safe to leave in even on a fresh install.
alter table wf1.vehicles add column if not exists image_url text;

-- Goals: per-user lap-time goal and notes for a track variation.
create table if not exists wf1.goals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    track_variation_id uuid not null references wf1.track_variations(id) on delete cascade,
    goal_lap_time_ms integer check (goal_lap_time_ms is null or goal_lap_time_ms > 0),
    notes text,
    updated_at timestamptz not null default now(),
    unique (user_id, track_variation_id)
);

-- For existing installs: migrate goals table to new shape.
alter table wf1.goals alter column goal_lap_time_ms drop not null;
alter table wf1.goals add column if not exists notes text;
drop table if exists wf1.track_variation_notes;

-- Races: the core record.
-- Times stored as integer milliseconds for precise comparisons.
create table if not exists wf1.races (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    datetime timestamptz not null default now(),
    track_variation_id uuid not null references wf1.track_variations(id) on delete cascade,
    vehicle_id uuid references wf1.vehicles(id) on delete set null,
    tuning integer,
    place text,
    lap_time_ms integer,
    total_time_ms integer,
    notes text,
    created_at timestamptz not null default now()
);

alter table wf1.races add column if not exists performance_index integer;

-- Number of laps in the race, and the individual lap times in milliseconds
-- stored as a JSON array ordered by lap (first entry = lap 1).
alter table wf1.races add column if not exists lap_count integer;
alter table wf1.races add column if not exists lap_times_ms jsonb;
alter table wf1.races add column if not exists results_roster jsonb;

-- Driving-assist difficulty settings in effect for the race, e.g.
-- {"shifting": "manual", "abs": "half", "traction_control": "off",
-- "stability_control": "half"}. null for races logged before this existed,
-- or where the companion tool couldn't resolve them.
alter table wf1.races add column if not exists assists jsonb;

-- Vehicle weight in kg at race time (computed from equipped performance
-- parts). null for races logged before this existed, or where the
-- companion tool couldn't resolve it.
alter table wf1.races add column if not exists vehicle_weight_kg integer;

-- Where the race was logged from: the web UI, or the external API (see
-- api_key_id below, added once the api_keys table exists further down).
alter table wf1.races add column if not exists source text not null default 'web';
alter table wf1.races drop constraint if exists races_source_check;
alter table wf1.races add constraint races_source_check check (source in ('web', 'api'));

create index if not exists races_user_track_idx
    on wf1.races (user_id, track_variation_id, datetime desc);

create index if not exists races_user_datetime_idx
    on wf1.races (user_id, datetime desc);

-- Variation annotations: per-user turn notes pinned to a map image position.
create table if not exists wf1.variation_annotations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    track_variation_id uuid not null references wf1.track_variations(id) on delete cascade,
    x numeric(6,3) not null,
    y numeric(6,3) not null,
    number integer not null default 1,
    note text,
    created_at timestamptz not null default now()
);

create index if not exists variation_annotations_user_track_idx
    on wf1.variation_annotations (user_id, track_variation_id);

-- User details: extensible per-user data that doesn't belong on auth.users
-- (which Supabase owns and manages via GoTrue) — account status (used for
-- bans) and a display name today, room for more later without ever
-- touching the auth schema. No row is required for every user: a missing
-- row just means the defaults apply (status 'active', no display name),
-- the same pattern get_all_users_with_roles() already uses for role
-- resolution below. Defined here (ahead of user_roles/roles) since the
-- RLS policies right below need is_banned() to already exist.
create table if not exists wf1.user_details (
    user_id           uuid primary key references auth.users(id) on delete cascade,
    display_name      text,
    status            text not null default 'active',
    status_updated_at timestamptz,
    status_updated_by uuid references auth.users(id) on delete set null,
    created_at        timestamptz not null default now()
);

-- Extend this list in a future migration if a new status is ever added.
alter table wf1.user_details drop constraint if exists user_details_status_check;
alter table wf1.user_details add constraint user_details_status_check
    check (status in ('active', 'banned'));

alter table wf1.user_details enable row level security;

-- Each user can read their own details — the client uses the status to
-- force a sign-out when a banned account is (still) sitting on a session.
drop policy if exists "user_details select own" on wf1.user_details;
create policy "user_details select own"
    on wf1.user_details for select
    to authenticated
    using (auth.uid() = user_id);

-- One-time migration from the earlier ban-only table, if it was ever
-- applied — preserves who was banned, and by whom, before dropping it.
do $$
begin
    if to_regclass('wf1.user_bans') is not null then
        insert into wf1.user_details (user_id, status, status_updated_at, status_updated_by)
        select user_id, 'banned', banned_at, banned_by
        from wf1.user_bans
        on conflict (user_id) do update set
            status            = excluded.status,
            status_updated_at = excluded.status_updated_at,
            status_updated_by = excluded.status_updated_by;

        drop table wf1.user_bans;
    end if;
end
$$;

create or replace function wf1.is_banned(uid uuid)
returns boolean
language sql
security definer stable set search_path = wf1
as $$
    select coalesce(
        (select status = 'banned' from wf1.user_details where user_id = uid),
        false
    )
$$;

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table wf1.tracks enable row level security;
alter table wf1.track_variations enable row level security;
alter table wf1.vehicles enable row level security;
alter table wf1.races enable row level security;
alter table wf1.goals enable row level security;

-- Catalogue tables: anyone signed in can read.
-- Postgres 15 has no `create policy if not exists`, so we drop-then-create
-- to keep this script safe to re-run.
drop policy if exists "tracks readable by authenticated" on wf1.tracks;
create policy "tracks readable by authenticated"
    on wf1.tracks for select
    to authenticated
    using (true);

drop policy if exists "track_variations readable by authenticated" on wf1.track_variations;
create policy "track_variations readable by authenticated"
    on wf1.track_variations for select
    to authenticated
    using (true);

drop policy if exists "vehicles readable by authenticated" on wf1.vehicles;
create policy "vehicles readable by authenticated"
    on wf1.vehicles for select
    to authenticated
    using (true);

-- Races: users only see/touch their own.
drop policy if exists "races select own" on wf1.races;
create policy "races select own"
    on wf1.races for select
    to authenticated
    using (auth.uid() = user_id);

drop policy if exists "races insert own" on wf1.races;
create policy "races insert own"
    on wf1.races for insert
    to authenticated
    with check (auth.uid() = user_id and not wf1.is_banned(auth.uid()));

drop policy if exists "races update own" on wf1.races;
create policy "races update own"
    on wf1.races for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id and not wf1.is_banned(auth.uid()));

drop policy if exists "races delete own" on wf1.races;
create policy "races delete own"
    on wf1.races for delete
    to authenticated
    using (auth.uid() = user_id and not wf1.is_banned(auth.uid()));

-- Goals: same pattern.
drop policy if exists "goals select own" on wf1.goals;
create policy "goals select own"
    on wf1.goals for select
    to authenticated
    using (auth.uid() = user_id);

drop policy if exists "goals insert own" on wf1.goals;
create policy "goals insert own"
    on wf1.goals for insert
    to authenticated
    with check (auth.uid() = user_id and not wf1.is_banned(auth.uid()));

drop policy if exists "goals update own" on wf1.goals;
create policy "goals update own"
    on wf1.goals for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id and not wf1.is_banned(auth.uid()));

drop policy if exists "goals delete own" on wf1.goals;
create policy "goals delete own"
    on wf1.goals for delete
    to authenticated
    using (auth.uid() = user_id and not wf1.is_banned(auth.uid()));

-- Variation annotations: same pattern as races/goals.
alter table wf1.variation_annotations enable row level security;

drop policy if exists "variation_annotations select own" on wf1.variation_annotations;
create policy "variation_annotations select own"
    on wf1.variation_annotations for select
    to authenticated
    using (auth.uid() = user_id);

drop policy if exists "variation_annotations insert own" on wf1.variation_annotations;
create policy "variation_annotations insert own"
    on wf1.variation_annotations for insert
    to authenticated
    with check (auth.uid() = user_id and not wf1.is_banned(auth.uid()));

drop policy if exists "variation_annotations delete own" on wf1.variation_annotations;
create policy "variation_annotations delete own"
    on wf1.variation_annotations for delete
    to authenticated
    using (auth.uid() = user_id and not wf1.is_banned(auth.uid()));

-- =====================================================================
-- Catalogue seed (tracks, variations, vehicles) lives in supabase/seed.sql.
-- Run that file separately after this one. It is idempotent.
-- =====================================================================

-- =====================================================================
-- Admin: roles catalogue and user_roles joining table
-- (No user_profiles table — email is read directly from auth.users
--  inside security definer RPCs.)
-- =====================================================================

-- Clean up previous schema versions that had user_profiles.
drop table if exists wf1.user_roles cascade;
drop table if exists wf1.user_profiles cascade;

-- Roles catalogue: the set of valid roles.
create table if not exists wf1.roles (
    id          uuid primary key default gen_random_uuid(),
    name        text not null unique,
    description text,
    created_at  timestamptz not null default now()
);

-- Seed the two built-in roles (idempotent).
insert into wf1.roles (name, description) values
    ('user',  'Standard user'),
    ('admin', 'Administrator with access to admin pages')
on conflict (name) do nothing;

alter table wf1.roles enable row level security;

drop policy if exists "roles readable by authenticated" on wf1.roles;
create policy "roles readable by authenticated"
    on wf1.roles for select
    to authenticated
    using (true);

-- User roles: links auth.users directly to roles.
create table if not exists wf1.user_roles (
    user_id    uuid not null references auth.users(id) on delete cascade,
    role_id    uuid not null references wf1.roles(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, role_id)
);

alter table wf1.user_roles enable row level security;

-- Each user can read their own role assignments.
drop policy if exists "user_roles select own" on wf1.user_roles;
create policy "user_roles select own"
    on wf1.user_roles for select
    to authenticated
    using (auth.uid() = user_id);

-- Assign the 'user' role to new sign-ups automatically.
create or replace function wf1.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = wf1
as $$
begin
    insert into wf1.user_roles (user_id, role_id)
    select new.id, r.id from wf1.roles r where r.name = 'user'
    on conflict (user_id, role_id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure wf1.handle_new_user();

-- Backfill: assign 'user' role to any existing users without a role assignment.
insert into wf1.user_roles (user_id, role_id)
select u.id, r.id
from auth.users u
cross join wf1.roles r
where r.name = 'user'
  and not exists (
      select 1 from wf1.user_roles ur where ur.user_id = u.id
  )
on conflict (user_id, role_id) do nothing;

-- =====================================================================
-- Admin RPC functions (security definer — bypass RLS with role check)
-- =====================================================================

-- Internal helper: true if the given user holds the admin role.
create or replace function wf1.is_admin(uid uuid)
returns boolean
language sql
security definer stable set search_path = wf1
as $$
    select exists (
        select 1
        from wf1.user_roles ur
        join wf1.roles r on r.id = ur.role_id
        where ur.user_id = uid and r.name = 'admin'
    )
$$;

-- Returns all users with their current role name and activity counts,
-- sorted by total activity descending — admin only.
-- `create or replace` can't change an OUT-parameter function's return row
-- type — drop first.
drop function if exists wf1.get_all_users_with_roles();

create or replace function wf1.get_all_users_with_roles()
returns table(
    id                uuid,
    email             text,
    role              text,
    created_at        timestamptz,
    banned            boolean,
    race_count        bigint,
    goal_count        bigint,
    annotation_count  bigint,
    total_activity    bigint,
    last_race_at      timestamptz
)
language plpgsql
security definer set search_path = wf1
as $$
begin
    if not wf1.is_admin(auth.uid()) then
        raise exception 'Unauthorized: admin access required';
    end if;

    return query
    select
        u.id::uuid,
        u.email::text,
        coalesce(
            (select r.name
             from wf1.user_roles ur
             join wf1.roles r on r.id = ur.role_id
             where ur.user_id = u.id
             limit 1),
            'user'
        )::text as role,
        u.created_at::timestamptz,
        wf1.is_banned(u.id) as banned,
        count(distinct rc.id)  as race_count,
        count(distinct g.id)   as goal_count,
        count(distinct a.id)   as annotation_count,
        count(distinct rc.id) + count(distinct g.id) + count(distinct a.id) as total_activity,
        max(rc.datetime)      as last_race_at
    from auth.users u
    left join wf1.races                 rc on rc.user_id = u.id
    left join wf1.goals                 g  on g.user_id  = u.id
    left join wf1.variation_annotations a  on a.user_id  = u.id
    group by u.id, u.email, u.created_at
    order by total_activity desc;
end;
$$;

-- Resolves a range keyword ('1d', '7d', '30d', '90d', '1y', 'all') to the
-- first day of the window. Only get_race_log_times() needs it now, but the
-- keywords keep one definition here rather than drifting between callers.
create or replace function wf1.resolve_growth_range_start(p_range text, p_earliest date)
returns date
language plpgsql
set search_path = wf1
as $$
declare
    start_day date;
begin
    start_day := case p_range
        when '1d'  then (current_date - interval '1 day')::date
        when '7d'  then (current_date - interval '6 days')::date
        when '90d' then (current_date - interval '89 days')::date
        when '1y'  then (current_date - interval '1 year')::date
        when 'all' then p_earliest
        else (current_date - interval '29 days')::date -- '30d' and unrecognized values
    end;

    return coalesce(start_day, current_date);
end;
$$;

-- The growth charts used to be aggregated here, one row per day. They no
-- longer are: this session runs in UTC, so a database-side `::date` files a
-- race logged at 8pm Central under the next day, and the chart disagrees with
-- the timestamps in the users table right above it. Only the browser knows
-- where the viewer's midnight falls, so it now does the bucketing — user
-- growth from the created_at values get_all_users_with_roles() already
-- returns, and races from the raw instants below.
drop function if exists wf1.get_user_growth();
drop function if exists wf1.get_user_growth(text);
drop function if exists wf1.get_race_log_growth(text);

-- Returns when each race in the range was logged — admin only. Unaggregated
-- on purpose (see above). The extra day on the start covers viewers east of
-- UTC, whose first local day opens before the UTC day the range resolves to;
-- the browser trims the window back to the days it actually plots.
create or replace function wf1.get_race_log_times(p_range text default '30d')
returns table(logged_at timestamptz)
language plpgsql
security definer set search_path = wf1
as $$
declare
    start_day date;
begin
    if not wf1.is_admin(auth.uid()) then
        raise exception 'Unauthorized: admin access required';
    end if;

    start_day := wf1.resolve_growth_range_start(
        p_range,
        (select min(r.created_at)::date from wf1.races r)
    ) - 1;

    return query
    select r.created_at
    from wf1.races r
    where r.created_at >= start_day::timestamptz
    order by r.created_at;
end;
$$;

-- Sets the role of a target user — admin only.
-- Replaces all current role assignments with the single new role.
create or replace function wf1.set_user_role(target_user_id uuid, new_role text)
returns void
language plpgsql
security definer set search_path = wf1
as $$
declare
    v_role_id uuid;
begin
    if not wf1.is_admin(auth.uid()) then
        raise exception 'Unauthorized: admin access required';
    end if;

    select id into v_role_id from wf1.roles where name = new_role;
    if v_role_id is null then
        raise exception 'Unknown role: %', new_role;
    end if;

    -- Prevent demoting the last admin.
    if new_role <> 'admin' then
        if (
            select count(*)
            from wf1.user_roles ur
            join wf1.roles r on r.id = ur.role_id
            where r.name = 'admin' and ur.user_id = target_user_id
        ) > 0 and (
            select count(*)
            from wf1.user_roles ur
            join wf1.roles r on r.id = ur.role_id
            where r.name = 'admin'
        ) = 1 then
            raise exception 'Cannot remove the last admin';
        end if;
    end if;

    delete from wf1.user_roles where user_id = target_user_id;
    insert into wf1.user_roles (user_id, role_id) values (target_user_id, v_role_id);
end;
$$;

-- Bans or unbans a target user — admin only. A banned user is blocked at
-- the RLS/RPC level from posting races, submitting feedback, issuing new
-- API keys, or using an existing API key to log races (see the policies
-- and insert_race_with_api_key_wf1 below) — effectively suspending
-- everything that requires being logged in.
create or replace function wf1.set_user_banned(target_user_id uuid, banned boolean)
returns void
language plpgsql
security definer set search_path = wf1
as $$
begin
    if not wf1.is_admin(auth.uid()) then
        raise exception 'Unauthorized: admin access required';
    end if;

    if target_user_id = auth.uid() then
        raise exception 'Cannot ban your own account';
    end if;

    insert into wf1.user_details (user_id, status, status_updated_at, status_updated_by)
    values (target_user_id, case when banned then 'banned' else 'active' end, now(), auth.uid())
    on conflict (user_id) do update set
        status            = excluded.status,
        status_updated_at = excluded.status_updated_at,
        status_updated_by = excluded.status_updated_by;
end;
$$;

-- =====================================================================
-- Feedback: user-submitted feedback, bugs, and suggestions.
-- Defined after is_admin so the admin select policy can reference it.
-- =====================================================================

create table if not exists wf1.feedback (
    id            uuid primary key default gen_random_uuid(),
    user_id       uuid not null references auth.users(id) on delete cascade,
    url           text not null,
    feedback_text text not null,
    created_at    timestamptz not null default now()
);

alter table wf1.feedback enable row level security;

-- Users can insert their own feedback.
drop policy if exists "feedback insert own" on wf1.feedback;
create policy "feedback insert own"
    on wf1.feedback for insert
    to authenticated
    with check (auth.uid() = user_id and not wf1.is_banned(auth.uid()));

-- Admins can read all feedback.
drop policy if exists "feedback select admin" on wf1.feedback;
create policy "feedback select admin"
    on wf1.feedback for select
    to authenticated
    using (wf1.is_admin(auth.uid()));

-- =====================================================================
-- API keys: per-user tokens for the external companion tool.
-- Raw keys are never stored — only a SHA-256 hex digest.
-- =====================================================================

create table if not exists wf1.api_keys (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references auth.users(id) on delete cascade,
    key_hash     text not null unique,
    name         text not null,
    created_at   timestamptz not null default now(),
    last_used_at timestamptz
);

-- Soft-revocation: "deleting" a key from the UI sets this instead of
-- removing the row, so races.api_key_id (below) keeps resolving to the
-- real key/owner forever, even after the key stops working.
alter table wf1.api_keys add column if not exists revoked_at timestamptz;

-- Now that api_keys exists, link races to the key that logged them (for
-- source = 'api' rows). "on delete set null" mirrors vehicle_id on races
-- above — revoking/removing a key never deletes or orphans its races.
alter table wf1.races add column if not exists api_key_id uuid references wf1.api_keys(id) on delete set null;

alter table wf1.api_keys enable row level security;

drop policy if exists "api_keys select own" on wf1.api_keys;
create policy "api_keys select own"
    on wf1.api_keys for select
    to authenticated
    using (auth.uid() = user_id);

drop policy if exists "api_keys insert own" on wf1.api_keys;
create policy "api_keys insert own"
    on wf1.api_keys for insert
    to authenticated
    with check (auth.uid() = user_id and not wf1.is_banned(auth.uid()));

drop policy if exists "api_keys delete own" on wf1.api_keys;
create policy "api_keys delete own"
    on wf1.api_keys for delete
    to authenticated
    using (auth.uid() = user_id and not wf1.is_banned(auth.uid()));

-- Needed so a user can soft-revoke (set revoked_at) their own key instead
-- of hard-deleting it.
drop policy if exists "api_keys update own" on wf1.api_keys;
create policy "api_keys update own"
    on wf1.api_keys for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id and not wf1.is_banned(auth.uid()));

-- RPC called by the external companion tool: validates the raw API key,
-- resolves track/variation by exact display-name match and vehicle by
-- name (case-insensitive), reconstructs the tuning code from the four
-- dial positions, and inserts a race for the key's owning user.
-- SECURITY DEFINER bypasses RLS so it can write on behalf of any user
-- without exposing the service role key.
-- Named "_wf1" since a sibling project (Wreckfest 2 Race Log) exposes
-- the equivalent RPC for Wreckfest 2 as insert_race_with_api_key_wf2.
--
-- Adding parameters changes the signature, so old overloads have to be
-- dropped explicitly — `create or replace` would leave them in place and
-- PostgREST could no longer resolve which to call.
-- Drop the pre-lap_count/lap_times_ms version (13 params).
drop function if exists wf1.insert_race_with_api_key_wf1(
    text, text, text, text, integer, integer, integer, integer,
    integer, integer, integer, integer, text
);
-- Drop the pre-results_roster version (15 params).
drop function if exists wf1.insert_race_with_api_key_wf1(
    text, text, text, text, integer, integer, integer, integer,
    integer, integer, integer, integer, text, integer, jsonb
);
-- Drop the pre-vehicle_weight_kg version (16 params).
drop function if exists wf1.insert_race_with_api_key_wf1(
    text, text, text, text, integer, integer, integer, integer,
    integer, integer, integer, integer, text, integer, jsonb, jsonb
);

create or replace function wf1.insert_race_with_api_key_wf1(
    api_key            text,
    track              text,
    variant            text,
    vehicle            text,
    performance_index  integer,
    place              integer,
    lap_time_ms        integer,
    total_time_ms      integer,
    suspension         integer default null,
    gear_ratio         integer default null,
    differential       integer default null,
    brake_balance      integer default null,
    notes              text default null,
    lap_count          integer default null,
    lap_times_ms       jsonb default null,
    results_roster     jsonb default null,
    assists            jsonb default null,
    vehicle_weight_kg  integer default null
)
returns json
language plpgsql
security definer set search_path = wf1
as $$
declare
    v_user_id            uuid;
    v_key_id             uuid;
    v_key_hash           text;
    v_track_id           uuid;
    v_track_variation_id uuid;
    v_vehicle_id         uuid;
    v_tuning             integer;
    v_race_id            uuid;
    v_lap_count          integer;
begin
    v_key_hash := encode(sha256(api_key::bytea), 'hex');

    -- Validate key by hash. A revoked key resolves to no user, same as an
    -- unrecognized one, but the row itself is left in place (see
    -- api_keys.revoked_at) so past races still resolve back to it.
    select id, user_id into v_key_id, v_user_id
    from wf1.api_keys
    where key_hash = v_key_hash and revoked_at is null;

    if v_user_id is null then
        return json_build_object('success', false, 'error', 'Invalid API key');
    end if;

    -- A banned user can't log races through the companion tool either —
    -- this RPC is security definer and bypasses the "races insert own" RLS
    -- check above, so the ban has to be enforced here too.
    if wf1.is_banned(v_user_id) then
        return json_build_object('success', false, 'error', 'Account suspended');
    end if;

    if performance_index is not null and performance_index < 0 then
        return json_build_object('success', false, 'error', 'performance_index must be >= 0');
    end if;

    if lap_times_ms is not null and jsonb_typeof(lap_times_ms) <> 'array' then
        return json_build_object('success', false, 'error', 'lap_times_ms must be a JSON array');
    end if;

    if results_roster is not null and jsonb_typeof(results_roster) <> 'array' then
        return json_build_object('success', false, 'error', 'results_roster must be a JSON array');
    end if;

    if assists is not null and jsonb_typeof(assists) <> 'object' then
        return json_build_object('success', false, 'error', 'assists must be a JSON object');
    end if;

    if lap_count is not null and lap_count < 0 then
        return json_build_object('success', false, 'error', 'lap_count must be >= 0');
    end if;

    if vehicle_weight_kg is not null and vehicle_weight_kg < 0 then
        return json_build_object('success', false, 'error', 'vehicle_weight_kg must be >= 0');
    end if;

    -- Fall back to the length of the lap array when lap_count isn't sent.
    v_lap_count := coalesce(lap_count, jsonb_array_length(lap_times_ms));

    -- Stamp last-used.
    update wf1.api_keys
    set last_used_at = now()
    where key_hash = v_key_hash;

    -- Resolve track, then variation scoped to that track — both by exact
    -- case-insensitive name match.
    select t.id into v_track_id
    from wf1.tracks t
    where lower(t.name) = lower(track);

    if v_track_id is not null then
        select tv.id into v_track_variation_id
        from wf1.track_variations tv
        where tv.track_id = v_track_id and lower(tv.name) = lower(variant);
    end if;

    if v_track_variation_id is null then
        return json_build_object(
            'success', false,
            'error', 'Track/variant not found: ' || track || '/' || variant
        );
    end if;

    -- Resolve vehicle (optional — null is fine).
    if vehicle is not null and vehicle <> '' then
        select id into v_vehicle_id
        from wf1.vehicles
        where lower(name) = lower(vehicle);
    end if;

    -- Reconstruct the combined tuning code from the four dial positions.
    if suspension is not null and gear_ratio is not null
       and differential is not null and brake_balance is not null then
        v_tuning := suspension * 1000 + gear_ratio * 100 + differential * 10 + brake_balance;
    end if;

    -- Insert race bypassing RLS (security definer).
    insert into wf1.races (
        user_id, track_variation_id, vehicle_id,
        place, lap_time_ms, total_time_ms, datetime,
        performance_index, tuning, notes, lap_count, lap_times_ms, results_roster,
        assists, vehicle_weight_kg, source, api_key_id
    ) values (
        v_user_id, v_track_variation_id, v_vehicle_id,
        place::text, lap_time_ms, total_time_ms, now(),
        performance_index, v_tuning, notes, v_lap_count, lap_times_ms, results_roster,
        assists, vehicle_weight_kg, 'api', v_key_id
    )
    returning id into v_race_id;

    return json_build_object('success', true, 'race_id', v_race_id);
end;
$$;

-- Allow the anon key (used by the external tool) to call this function.
-- Identity is verified inside via the API key hash — no session needed.
grant execute on function wf1.insert_race_with_api_key_wf1 to anon, authenticated;

-- Returns the current user's own active (non-revoked) API keys along with
-- how many races each has logged. A plain select() from the client can't
-- do the count/join, so this RPC does it — security definer so it can
-- read races by api_key_id without a "races select by api_key" RLS policy,
-- but scoped to auth.uid() so it never exposes another user's keys.
create or replace function wf1.get_api_keys_with_counts()
returns table(
    id           uuid,
    name         text,
    created_at   timestamptz,
    last_used_at timestamptz,
    race_count   bigint
)
language plpgsql
security definer set search_path = wf1
as $$
begin
    return query
    select
        k.id,
        k.name,
        k.created_at,
        k.last_used_at,
        count(r.id) as race_count
    from wf1.api_keys k
    left join wf1.races r on r.api_key_id = k.id
    where k.user_id = auth.uid() and k.revoked_at is null
    group by k.id, k.name, k.created_at, k.last_used_at
    order by k.created_at desc;
end;
$$;

grant execute on function wf1.get_api_keys_with_counts to authenticated;

-- =====================================================================
-- Admin RPCs: API keys and feedback overview.
-- Raw key values are never stored (see api_keys above), so the admin
-- listing exposes id/name/timestamps/issuer only — never a key value.
-- =====================================================================

-- Returns every issued API key with its issuing user's email and the
-- number of races logged with it — admin only. Adding revoked_at/race_count
-- changes the returned row type, which `create or replace` can't do for
-- OUT-parameter functions — drop first.
drop function if exists wf1.get_all_api_keys();

create or replace function wf1.get_all_api_keys()
returns table(
    id           uuid,
    name         text,
    created_at   timestamptz,
    last_used_at timestamptz,
    revoked_at   timestamptz,
    user_id      uuid,
    user_email   text,
    race_count   bigint
)
language plpgsql
security definer set search_path = wf1
as $$
begin
    if not wf1.is_admin(auth.uid()) then
        raise exception 'Unauthorized: admin access required';
    end if;

    return query
    select
        k.id,
        k.name,
        k.created_at,
        k.last_used_at,
        k.revoked_at,
        k.user_id,
        u.email::text as user_email,
        count(r.id) as race_count
    from wf1.api_keys k
    join auth.users u on u.id = k.user_id
    left join wf1.races r on r.api_key_id = k.id
    group by k.id, k.name, k.created_at, k.last_used_at, k.revoked_at, k.user_id, u.email
    order by k.created_at desc;
end;
$$;

-- Revokes any user's API key by id — admin only. The regular
-- "api_keys update own" RLS policy only lets a user revoke their own
-- key, so admin revocation needs a security-definer RPC. This sets
-- revoked_at rather than deleting the row, so races logged with the key
-- keep resolving back to it (see races.api_key_id).
create or replace function wf1.admin_delete_api_key(key_id uuid)
returns void
language plpgsql
security definer set search_path = wf1
as $$
begin
    if not wf1.is_admin(auth.uid()) then
        raise exception 'Unauthorized: admin access required';
    end if;

    update wf1.api_keys set revoked_at = now()
    where id = key_id and revoked_at is null;
end;
$$;

-- Returns the total number of races logged, site-wide — intentionally
-- PUBLIC (no is_admin check, granted to anon). Used by the public home
-- page to show a live "races logged" count to signed-out visitors, who
-- can't otherwise see into the `races` table (its RLS policies are all
-- `to authenticated ... using (auth.uid() = user_id)` — see above).
create or replace function wf1.get_total_race_count()
returns bigint
language sql
security definer stable set search_path = wf1
as $$
    select count(*) from wf1.races
$$;

grant execute on function wf1.get_total_race_count to anon, authenticated;

-- Returns all feedback entries with the submitting user's email, newest
-- first — admin only. The "feedback select admin" RLS policy already
-- lets an admin select these rows directly, but a plain select() from
-- the client can't join auth.users, so this RPC does the join.
create or replace function wf1.get_all_feedback()
returns table(
    id            uuid,
    url           text,
    feedback_text text,
    created_at    timestamptz,
    user_id       uuid,
    user_email    text
)
language plpgsql
security definer set search_path = wf1
as $$
begin
    if not wf1.is_admin(auth.uid()) then
        raise exception 'Unauthorized: admin access required';
    end if;

    return query
    select
        f.id,
        f.url,
        f.feedback_text,
        f.created_at,
        f.user_id,
        u.email::text as user_email
    from wf1.feedback f
    join auth.users u on u.id = f.user_id
    order by f.created_at desc;
end;
$$;

-- =====================================================================
-- Schema-level grants: `public` gets these from Supabase's project
-- defaults, but `wf1` is a custom schema and needs them explicitly. RLS
-- policies (above) still govern row-level access on top of this — these
-- grants only make the schema/tables reachable at all.
-- =====================================================================

grant usage on schema wf1 to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema wf1 to anon, authenticated;
alter default privileges in schema wf1
    grant select, insert, update, delete on tables to anon, authenticated;
