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
--
-- PUBLIC BY DEFAULT: every column on this table is readable by anyone
-- (signed in or not) for every user who hasn't opted out — see the
-- "races select own or public" policy below. Anything private to the
-- owner (notes, which API key logged it, ...) belongs in races_private,
-- never here.
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

-- Name of the online server the race was run on, raw as the game reports
-- it -- including Wreckfest's ^N / ^: color codes, kept so the site can
-- strip them or render the colors. null for offline races, races logged
-- before this existed, or where the companion tool couldn't resolve it.
alter table wf1.races add column if not exists server_name text;

-- Engine and armor upgrades on the logging player's car, as the companion
-- plugin reports them, e.g. {"engine": "sport", "engine_parts":
-- {"air_filter": "racing", ...}, "armor": {"front_bumper": {"name":
-- "Mesh Guard", "weight_kg": 45}, ...}}. Also present in that
-- player's results_roster entry; kept here so it can be queried directly.
-- null for races logged before this existed, or where it couldn't be read.
alter table wf1.races add column if not exists parts jsonb;

-- Where the race was logged from: the web UI, or the external API (see
-- races_private.api_key_id further down for which key).
alter table wf1.races add column if not exists source text not null default 'web';
alter table wf1.races drop constraint if exists races_source_check;
alter table wf1.races add constraint races_source_check check (source in ('web', 'api'));

-- PI class letter derived from performance_index, so leaderboards can
-- filter/group "best lap per track per class" with a plain .eq() and an
-- index instead of re-deriving it in every query. null when the PI is
-- unknown. Keep these thresholds in sync with src/utils/piInfo.js.
alter table wf1.races add column if not exists pi_class text
    generated always as (
        case
            when performance_index is null then null
            when performance_index >= 235 then 'A'
            when performance_index >= 165 then 'B'
            when performance_index >= 100 then 'C'
            else 'D'
        end
    ) stored;

create index if not exists races_user_track_idx
    on wf1.races (user_id, track_variation_id, datetime desc);

create index if not exists races_user_datetime_idx
    on wf1.races (user_id, datetime desc);

-- The two indexes above both lead with user_id, so neither helps a query
-- across all users. These back the community race feed (newest first) and
-- per-track/per-class lap-time leaderboards. lap_time_ms = 0 means "no lap
-- completed", not a 0ms lap, so it's left out of the leaderboard index.
create index if not exists races_datetime_idx
    on wf1.races (datetime desc, created_at desc);

create index if not exists races_variation_class_lap_idx
    on wf1.races (track_variation_id, pi_class, lap_time_ms)
    where lap_time_ms > 0;

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

-- User details: private per-user data that doesn't belong on auth.users
-- (which Supabase owns and manages via GoTrue) — account status (used for
-- bans) today, room for more later without ever touching the auth schema.
-- Public-facing profile fields live in wf1.profiles instead (below), so
-- this table never needs a public read policy or a user update policy —
-- a user who could update their own row here could unban themselves.
-- No row is required for every user: a missing row just means the
-- defaults apply (status 'active'), the same pattern
-- get_all_users_with_roles() already uses for role resolution below.
-- Defined here (ahead of user_roles/roles) since the RLS policies right
-- below need is_banned() to already exist.
create table if not exists wf1.user_details (
    user_id           uuid primary key references auth.users(id) on delete cascade,
    status            text not null default 'active',
    status_updated_at timestamptz,
    status_updated_by uuid references auth.users(id) on delete set null,
    created_at        timestamptz not null default now()
);

-- display_name used to live here but was never read or written by the
-- app; it moved to wf1.profiles.
alter table wf1.user_details drop column if exists display_name;

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

-- Profiles: the public face of an account — the name shown next to its
-- races on community pages, and whether its races are public at all. Kept
-- apart from user_details so this table can be publicly readable and
-- user-editable without exposing or letting anyone change their ban
-- status. Every account gets a row: handle_new_user() creates it on
-- signup and the backfill further down covers older accounts.
create table if not exists wf1.profiles (
    user_id      uuid primary key references auth.users(id) on delete cascade,
    display_name text not null,
    -- Opt-out switch: false hides every one of this user's races (and this
    -- profile) from everyone but the user themselves — see is_public_user()
    -- and the races/profiles select policies.
    is_public    boolean not null default true,
    created_at   timestamptz not null default now()
);

-- 3–24 characters, no leading/trailing whitespace, no control characters.
-- Otherwise free-form — URLs use the user id, not the name, so it doesn't
-- need to be URL-safe.
alter table wf1.profiles drop constraint if exists profiles_display_name_format;
alter table wf1.profiles add constraint profiles_display_name_format
    check (
        char_length(display_name) between 3 and 24
        and display_name = btrim(display_name)
        and display_name !~ '[[:cntrl:]]'
    );

-- Unique ignoring case, so "Ampp33" and "ampp33" can't both exist.
create unique index if not exists profiles_display_name_lower_key
    on wf1.profiles (lower(display_name));

alter table wf1.profiles enable row level security;

drop policy if exists "profiles select public or own" on wf1.profiles;
create policy "profiles select public or own"
    on wf1.profiles for select
    to anon, authenticated
    using (is_public or auth.uid() = user_id);

-- No insert or delete policy: rows are created by handle_new_user() and
-- removed by the auth.users cascade. Which columns a user may update is
-- narrowed with column grants at the bottom of this file.
drop policy if exists "profiles update own" on wf1.profiles;
create policy "profiles update own"
    on wf1.profiles for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id and not wf1.is_banned(auth.uid()));

-- True when this user's races are publicly visible. Security definer (like
-- is_banned) so the races select policy can call it per row without
-- running the profiles RLS policy inside the races one. A user with no
-- profile row is treated as private — the safe failure mode.
create or replace function wf1.is_public_user(uid uuid)
returns boolean
language sql
security definer stable set search_path = wf1
as $$
    select coalesce(
        (select is_public from wf1.profiles where user_id = uid),
        false
    )
$$;

-- Picks the auto-assigned name for a new account: 'Driver-' plus the first
-- 6 hex chars of md5(user id), lengthened a step at a time on the rare
-- collision (with another default, or a user who chose that exact name).
-- Deterministic, so re-running the backfill below never renames anyone.
-- Never derived from the email or OAuth profile — those carry real names.
create or replace function wf1.default_display_name(uid uuid)
returns text
language plpgsql
security definer stable set search_path = wf1
as $$
declare
    h         text := md5(uid::text);
    candidate text;
begin
    for len in 6..16 loop
        candidate := 'Driver-' || substr(h, 1, len);
        if not exists (
            select 1 from wf1.profiles
            where lower(display_name) = lower(candidate) and user_id <> uid
        ) then
            return candidate;
        end if;
    end loop;
    -- 16 hex chars colliding is effectively impossible; 17 chars of the
    -- user id itself is unique by construction and still fits in 24.
    return 'Driver-' || substr(replace(uid::text, '-', ''), 1, 17);
end;
$$;

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table wf1.tracks enable row level security;
alter table wf1.track_variations enable row level security;
alter table wf1.vehicles enable row level security;
alter table wf1.races enable row level security;
alter table wf1.goals enable row level security;

-- Catalogue tables: anyone can read, signed in or not — the community pages
-- are public and need track/vehicle names.
-- Postgres 15 has no `create policy if not exists`, so we drop-then-create
-- to keep this script safe to re-run.
drop policy if exists "tracks readable by authenticated" on wf1.tracks;
drop policy if exists "tracks readable by everyone" on wf1.tracks;
create policy "tracks readable by everyone"
    on wf1.tracks for select
    to anon, authenticated
    using (true);

drop policy if exists "track_variations readable by authenticated" on wf1.track_variations;
drop policy if exists "track_variations readable by everyone" on wf1.track_variations;
create policy "track_variations readable by everyone"
    on wf1.track_variations for select
    to anon, authenticated
    using (true);

drop policy if exists "vehicles readable by authenticated" on wf1.vehicles;
drop policy if exists "vehicles readable by everyone" on wf1.vehicles;
create policy "vehicles readable by everyone"
    on wf1.vehicles for select
    to anon, authenticated
    using (true);

-- Races: anyone (signed in or not) can read the races of a user who hasn't
-- opted out, and you can always read your own. Only the owner can write.
-- This means a client query is NOT scoped to the current user unless it
-- filters on user_id itself — every "my races" query in
-- src/services/raceService.js does so explicitly.
drop policy if exists "races select own" on wf1.races;
drop policy if exists "races select own or public" on wf1.races;
create policy "races select own or public"
    on wf1.races for select
    to anon, authenticated
    using (auth.uid() = user_id or wf1.is_public_user(user_id));

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

-- Clean up previous schema versions that had user_profiles, whose
-- user_roles had a different shape. Only on such a database: this used to
-- drop user_roles on EVERY run, which demoted every admin to 'user' each
-- time this file was applied (the backfill below then re-adds 'user' rows).
do $$
begin
    if to_regclass('wf1.user_profiles') is not null then
        drop table if exists wf1.user_roles cascade;
        drop table wf1.user_profiles cascade;
    end if;
end
$$;

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

-- Assign the 'user' role and create the public profile (with an
-- auto-assigned display name) for new sign-ups automatically.
create or replace function wf1.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = wf1
as $$
begin
    insert into wf1.user_roles (user_id, role_id)
    select new.id, r.id from wf1.roles r where r.name = 'user'
    on conflict (user_id, role_id) do nothing;

    -- auth.users.created_at is nullable; a null here would fail the whole
    -- signup, so fall back rather than trust GoTrue to always set it.
    insert into wf1.profiles (user_id, display_name, created_at)
    values (new.id, wf1.default_display_name(new.id), coalesce(new.created_at, now()))
    on conflict (user_id) do nothing;

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

-- Backfill: a profile for every existing account. One insert per user, in
-- a loop, so default_display_name() sees the names already handed out in
-- this same run when it checks for collisions. created_at is copied from
-- auth.users — it's the "driver since" date, and now() would tell every
-- existing user they joined today.
do $$
declare
    u record;
begin
    for u in
        select au.id, au.created_at
        from auth.users au
        where not exists (select 1 from wf1.profiles p where p.user_id = au.id)
        order by au.created_at
    loop
        insert into wf1.profiles (user_id, display_name, created_at)
        values (u.id, wf1.default_display_name(u.id), coalesce(u.created_at, now()))
        on conflict (user_id) do nothing;
    end loop;
end
$$;

-- Second foreign key on races.user_id (alongside the auth.users one), so
-- PostgREST can embed the driver's name: races?select=*,driver:profiles(display_name).
-- auth isn't an exposed schema, so this is the only relationship it sees.
-- Added after the backfill above, which guarantees every racer has a row.
alter table wf1.races drop constraint if exists races_user_id_profile_fkey;
alter table wf1.races add constraint races_user_id_profile_fkey
    foreign key (user_id) references wf1.profiles(user_id) on delete cascade;

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
-- first day of the window. Only get_race_log_bins() needs it now, but the
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
-- returns, and races from the 15-minute bins below.
drop function if exists wf1.get_user_growth();
drop function if exists wf1.get_user_growth(text);
drop function if exists wf1.get_race_log_growth(text);
-- Replaced by get_race_log_bins(): one row per race ran into PostgREST's
-- 1000-row response cap, which (oldest first) silently dropped the newest races.
drop function if exists wf1.get_race_log_times(text);

-- Race counts in the range per 15-minute UTC bin, as a jsonb array of
-- [bin start in epoch ms, count] pairs, empty bins omitted — admin only.
-- 15 minutes is the coarsest bin that still lands wholly inside one local
-- hour in every timezone (offsets come in :00, :30 and :45), so the browser
-- can regroup bins into its own hours and days. A single jsonb value rather
-- than a set of rows so the response is never truncated by the row cap.
-- The extra day on the start covers viewers east of UTC, whose first local
-- day opens before the UTC day the range resolves to; the browser trims the
-- window back to what it actually plots.
create or replace function wf1.get_race_log_bins(p_range text default '30d')
returns jsonb
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

    return coalesce((
        select jsonb_agg(jsonb_build_array(b.bin_ms, b.race_count) order by b.bin_ms)
        from (
            select (floor(extract(epoch from r.created_at) / 900) * 900000)::bigint as bin_ms,
                   count(*) as race_count
            from wf1.races r
            where r.created_at >= start_day::timestamptz
            group by 1
        ) b
    ), '[]'::jsonb);
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
-- removing the row, so races_private.api_key_id (below) keeps resolving to the
-- real key/owner forever, even after the key stops working.
alter table wf1.api_keys add column if not exists revoked_at timestamptz;

-- =====================================================================
-- Races private: the owner-only half of a race. wf1.races is publicly
-- readable, so anything about a race that only its owner should see lives
-- here instead, one row per race (and only for races that have something
-- to store). Pages pull it in alongside the race with a PostgREST embed —
-- races_private(...) — which comes back null for anyone else's race.
-- Defined after api_keys since it references it.
-- =====================================================================

create table if not exists wf1.races_private (
    race_id        uuid primary key references wf1.races(id) on delete cascade,
    -- Denormalized from races.user_id so the RLS policies below are a plain
    -- column check. The insert/update policies also require the race itself
    -- to belong to auth.uid(), so a user can't claim the private row for
    -- someone else's race (which would block the owner from adding notes).
    user_id        uuid not null references auth.users(id) on delete cascade,
    notes          text,
    -- The key that logged the race, for source = 'api' rows. "on delete set
    -- null" — revoking/removing a key never deletes or orphans its races.
    api_key_id     uuid references wf1.api_keys(id) on delete set null,
    -- Version of the companion plugin that submitted the race via the API
    -- (e.g. '1.4.0'), so bad data can be traced back to a plugin release.
    -- null for web-logged races, races logged before this existed, or
    -- plugins too old to send it.
    plugin_version text
);

create index if not exists races_private_api_key_idx
    on wf1.races_private (api_key_id)
    where api_key_id is not null;

-- One-time migration for installs that predate races_private: notes,
-- api_key_id and plugin_version used to be columns on races. Copy them
-- across, then drop them from races so they can't be read publicly. Keyed
-- off the notes column (present in every earlier schema), and it adds the
-- other two first if a very old install never had them, so the copy below
-- doesn't need a variant per schema version.
do $$
begin
    if exists (
        select 1 from information_schema.columns
        where table_schema = 'wf1' and table_name = 'races' and column_name = 'notes'
    ) then
        alter table wf1.races add column if not exists api_key_id uuid;
        alter table wf1.races add column if not exists plugin_version text;

        insert into wf1.races_private (race_id, user_id, notes, api_key_id, plugin_version)
        select r.id, r.user_id, r.notes, r.api_key_id, r.plugin_version
        from wf1.races r
        where r.notes is not null or r.api_key_id is not null or r.plugin_version is not null
        on conflict (race_id) do nothing;

        alter table wf1.races
            drop column notes,
            drop column api_key_id,
            drop column plugin_version;
    end if;
end
$$;

alter table wf1.races_private enable row level security;

drop policy if exists "races_private select own" on wf1.races_private;
create policy "races_private select own"
    on wf1.races_private for select
    to authenticated
    using (auth.uid() = user_id);

drop policy if exists "races_private insert own" on wf1.races_private;
create policy "races_private insert own"
    on wf1.races_private for insert
    to authenticated
    with check (
        auth.uid() = user_id
        and not wf1.is_banned(auth.uid())
        and exists (select 1 from wf1.races r where r.id = race_id and r.user_id = auth.uid())
    );

drop policy if exists "races_private update own" on wf1.races_private;
create policy "races_private update own"
    on wf1.races_private for update
    to authenticated
    using (auth.uid() = user_id)
    with check (
        auth.uid() = user_id
        and not wf1.is_banned(auth.uid())
        and exists (select 1 from wf1.races r where r.id = race_id and r.user_id = auth.uid())
    );

drop policy if exists "races_private delete own" on wf1.races_private;
create policy "races_private delete own"
    on wf1.races_private for delete
    to authenticated
    using (auth.uid() = user_id and not wf1.is_banned(auth.uid()));

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
-- Drop the pre-server_name version (18 params).
drop function if exists wf1.insert_race_with_api_key_wf1(
    text, text, text, text, integer, integer, integer, integer,
    integer, integer, integer, integer, text, integer, jsonb, jsonb, jsonb, integer
);
-- Drop the pre-plugin_version version (19 params).
drop function if exists wf1.insert_race_with_api_key_wf1(
    text, text, text, text, integer, integer, integer, integer,
    integer, integer, integer, integer, text, integer, jsonb, jsonb, jsonb, integer, text
);
-- Drop the pre-parts version (20 params).
drop function if exists wf1.insert_race_with_api_key_wf1(
    text, text, text, text, integer, integer, integer, integer,
    integer, integer, integer, integer, text, integer, jsonb, jsonb, jsonb, integer, text, text
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
    vehicle_weight_kg  integer default null,
    server_name        text default null,
    plugin_version     text default null,
    parts              jsonb default null
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

    if parts is not null and jsonb_typeof(parts) <> 'object' then
        return json_build_object('success', false, 'error', 'parts must be a JSON object');
    end if;

    if lap_count is not null and lap_count < 0 then
        return json_build_object('success', false, 'error', 'lap_count must be >= 0');
    end if;

    if vehicle_weight_kg is not null and vehicle_weight_kg < 0 then
        return json_build_object('success', false, 'error', 'vehicle_weight_kg must be >= 0');
    end if;

    if server_name is not null and length(server_name) > 256 then
        return json_build_object('success', false, 'error', 'server_name must be at most 256 characters');
    end if;

    if plugin_version is not null and length(plugin_version) > 64 then
        return json_build_object('success', false, 'error', 'plugin_version must be at most 64 characters');
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

    -- Insert race bypassing RLS (security definer). The public half goes
    -- to races, the owner-only half (notes, key, plugin version) to
    -- races_private — both in this one transaction.
    insert into wf1.races (
        user_id, track_variation_id, vehicle_id,
        place, lap_time_ms, total_time_ms, datetime,
        performance_index, tuning, lap_count, lap_times_ms, results_roster,
        assists, vehicle_weight_kg, server_name, parts, source
    ) values (
        v_user_id, v_track_variation_id, v_vehicle_id,
        place::text, lap_time_ms, total_time_ms, now(),
        performance_index, v_tuning, v_lap_count, lap_times_ms, results_roster,
        assists, vehicle_weight_kg, nullif(server_name, ''), parts, 'api'
    )
    returning id into v_race_id;

    insert into wf1.races_private (race_id, user_id, notes, api_key_id, plugin_version)
    values (v_race_id, v_user_id, nullif(notes, ''), v_key_id, nullif(plugin_version, ''));

    return json_build_object('success', true, 'race_id', v_race_id);
end;
$$;

-- Allow the anon key (used by the external tool) to call this function.
-- Identity is verified inside via the API key hash — no session needed.
grant execute on function wf1.insert_race_with_api_key_wf1 to anon, authenticated;

-- Returns the current user's own active (non-revoked) API keys along with
-- how many races each has logged. A plain select() from the client can't
-- do the count/join, so this RPC does it — security definer so it can
-- read races_private by api_key_id across the user's races in one query,
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
        count(r.race_id) as race_count
    from wf1.api_keys k
    left join wf1.races_private r on r.api_key_id = k.id
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
        count(r.race_id) as race_count
    from wf1.api_keys k
    join auth.users u on u.id = k.user_id
    left join wf1.races_private r on r.api_key_id = k.id
    group by k.id, k.name, k.created_at, k.last_used_at, k.revoked_at, k.user_id, u.email
    order by k.created_at desc;
end;
$$;

-- Revokes any user's API key by id — admin only. The regular
-- "api_keys update own" RLS policy only lets a user revoke their own
-- key, so admin revocation needs a security-definer RPC. This sets
-- revoked_at rather than deleting the row, so races logged with the key
-- keep resolving back to it (see races_private.api_key_id).
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
-- PUBLIC (no is_admin check, granted to anon). Security definer so the
-- count includes races from users who opted out of public visibility —
-- it reveals how many races exist, never whose or what they were.
create or replace function wf1.get_total_race_count()
returns bigint
language sql
security definer stable set search_path = wf1
as $$
    select count(*) from wf1.races
$$;

grant execute on function wf1.get_total_race_count to anon, authenticated;

-- =====================================================================
-- Community leaderboards. Plain SQL over races, run as the caller (security
-- invoker, the default) rather than as definer: the "races select own or
-- public" policy then decides whose races count, so users who opted out are
-- left out for everyone but themselves — no second copy of that rule here.
-- Functions rather than client queries because PostgREST can't do the
-- group by / distinct on these need. Only races logged by the telemetry
-- plugin (source = 'api') count, so hand-entered web races stay off the boards.
-- =====================================================================

-- The drivers with the most races logged, most first.
drop function if exists wf1.get_most_races_leaderboard(integer);
create or replace function wf1.get_most_races_leaderboard(p_limit integer default 25)
returns table(
    user_id      uuid,
    display_name text,
    race_count   bigint
)
language sql
stable set search_path = wf1
as $$
    select r.user_id, p.display_name, count(*) as race_count
    from wf1.races r
    left join wf1.profiles p on p.user_id = r.user_id
    where r.source = 'api'
    group by r.user_id, p.display_name
    order by race_count desc, p.display_name
    limit least(greatest(coalesce(p_limit, 25), 1), 100)
$$;

grant execute on function wf1.get_most_races_leaderboard to anon, authenticated;

-- The fastest lap ever logged on each track variation, one row per
-- variation, ordered by track then variation name — optionally only laps in
-- one PI class ('A'..'D', see races.pi_class) and/or in one vehicle.
-- lap_time_ms = 0 means no lap was completed, so it's never a record. On a
-- tie the earlier race wins. Each added parameter changed the signature, so
-- the old overloads go too.
drop function if exists wf1.get_fastest_laps();
drop function if exists wf1.get_fastest_laps(text);
drop function if exists wf1.get_fastest_laps(text, uuid);
create or replace function wf1.get_fastest_laps(p_pi_class text default null, p_vehicle_id uuid default null)
returns table(
    race_id            uuid,
    track_variation_id uuid,
    track_name         text,
    track_slug         text,
    variation_name     text,
    variation_slug     text,
    user_id            uuid,
    display_name       text,
    lap_time_ms        integer,
    vehicle_id         uuid,
    vehicle_name       text,
    performance_index  integer,
    tuning             integer,
    assists            jsonb,
    datetime           timestamptz
)
language sql
stable set search_path = wf1
as $$
    select
        best.id, best.track_variation_id,
        t.name, t.slug, tv.name, tv.slug,
        best.user_id, p.display_name,
        best.lap_time_ms, best.vehicle_id, v.name,
        best.performance_index, best.tuning, best.assists, best.datetime
    from (
        select distinct on (r.track_variation_id) r.*
        from wf1.races r
        where r.lap_time_ms > 0
          and r.source = 'api'
          and (p_pi_class is null or r.pi_class = p_pi_class)
          and (p_vehicle_id is null or r.vehicle_id = p_vehicle_id)
        order by r.track_variation_id, r.lap_time_ms, r.datetime
    ) best
    join wf1.track_variations tv on tv.id = best.track_variation_id
    join wf1.tracks t on t.id = tv.track_id
    left join wf1.vehicles v on v.id = best.vehicle_id
    left join wf1.profiles p on p.user_id = best.user_id
    order by t.name, tv.name
$$;

grant execute on function wf1.get_fastest_laps to anon, authenticated;

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

-- Column-level narrowing, after the blanket grant above (which would
-- otherwise re-grant it on every run): a user may change their own
-- profile's name and visibility, never its user_id or created_at.
revoke update on wf1.profiles from anon, authenticated;
grant update (display_name, is_public) on wf1.profiles to authenticated;
