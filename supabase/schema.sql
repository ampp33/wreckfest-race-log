-- =====================================================================
-- Wreckfest Race Log — Supabase schema
-- Run this in the Supabase SQL editor on a fresh project.
-- =====================================================================

-- Tracks: shared catalogue (no user_id — same set for everyone).
create table if not exists public.tracks (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    slug text not null unique,
    created_at timestamptz not null default now()
);

-- Track variations: routes/configurations of a track.
create table if not exists public.track_variations (
    id uuid primary key default gen_random_uuid(),
    track_id uuid not null references public.tracks(id) on delete cascade,
    name text not null,
    slug text not null,
    created_at timestamptz not null default now(),
    unique (track_id, slug)
);

-- Vehicles: shared catalogue.
create table if not exists public.vehicles (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    class text,
    image_url text,
    created_at timestamptz not null default now()
);

-- For projects upgrading from an earlier schema version: add the columns
-- if they're missing. Safe to leave in even on a fresh install.
alter table public.vehicles add column if not exists image_url text;

-- Goals: per-user lap-time goal and notes for a track variation.
create table if not exists public.goals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    track_variation_id uuid not null references public.track_variations(id) on delete cascade,
    goal_lap_time_ms integer check (goal_lap_time_ms is null or goal_lap_time_ms > 0),
    notes text,
    updated_at timestamptz not null default now(),
    unique (user_id, track_variation_id)
);

-- For existing installs: migrate goals table to new shape.
alter table public.goals alter column goal_lap_time_ms drop not null;
alter table public.goals add column if not exists notes text;
drop table if exists public.track_variation_notes;

-- Races: the core record.
-- Times stored as integer milliseconds for precise comparisons.
create table if not exists public.races (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    datetime timestamptz not null default now(),
    track_variation_id uuid not null references public.track_variations(id) on delete cascade,
    vehicle_id uuid references public.vehicles(id) on delete set null,
    tuning integer,
    place text,
    lap_time_ms integer,
    total_time_ms integer,
    notes text,
    created_at timestamptz not null default now()
);

create index if not exists races_user_track_idx
    on public.races (user_id, track_variation_id, datetime desc);

create index if not exists races_user_datetime_idx
    on public.races (user_id, datetime desc);

-- Variation annotations: per-user turn notes pinned to a map image position.
create table if not exists public.variation_annotations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    track_variation_id uuid not null references public.track_variations(id) on delete cascade,
    x numeric(6,3) not null,
    y numeric(6,3) not null,
    number integer not null default 1,
    note text,
    created_at timestamptz not null default now()
);

create index if not exists variation_annotations_user_track_idx
    on public.variation_annotations (user_id, track_variation_id);

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table public.tracks enable row level security;
alter table public.track_variations enable row level security;
alter table public.vehicles enable row level security;
alter table public.races enable row level security;
alter table public.goals enable row level security;

-- Catalogue tables: anyone signed in can read.
-- Postgres 15 has no `create policy if not exists`, so we drop-then-create
-- to keep this script safe to re-run.
drop policy if exists "tracks readable by authenticated" on public.tracks;
create policy "tracks readable by authenticated"
    on public.tracks for select
    to authenticated
    using (true);

drop policy if exists "track_variations readable by authenticated" on public.track_variations;
create policy "track_variations readable by authenticated"
    on public.track_variations for select
    to authenticated
    using (true);

drop policy if exists "vehicles readable by authenticated" on public.vehicles;
create policy "vehicles readable by authenticated"
    on public.vehicles for select
    to authenticated
    using (true);

-- Races: users only see/touch their own.
drop policy if exists "races select own" on public.races;
create policy "races select own"
    on public.races for select
    to authenticated
    using (auth.uid() = user_id);

drop policy if exists "races insert own" on public.races;
create policy "races insert own"
    on public.races for insert
    to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "races update own" on public.races;
create policy "races update own"
    on public.races for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "races delete own" on public.races;
create policy "races delete own"
    on public.races for delete
    to authenticated
    using (auth.uid() = user_id);

-- Goals: same pattern.
drop policy if exists "goals select own" on public.goals;
create policy "goals select own"
    on public.goals for select
    to authenticated
    using (auth.uid() = user_id);

drop policy if exists "goals insert own" on public.goals;
create policy "goals insert own"
    on public.goals for insert
    to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "goals update own" on public.goals;
create policy "goals update own"
    on public.goals for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "goals delete own" on public.goals;
create policy "goals delete own"
    on public.goals for delete
    to authenticated
    using (auth.uid() = user_id);

-- Variation annotations: same pattern as races/goals.
alter table public.variation_annotations enable row level security;

drop policy if exists "variation_annotations select own" on public.variation_annotations;
create policy "variation_annotations select own"
    on public.variation_annotations for select
    to authenticated
    using (auth.uid() = user_id);

drop policy if exists "variation_annotations insert own" on public.variation_annotations;
create policy "variation_annotations insert own"
    on public.variation_annotations for insert
    to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "variation_annotations delete own" on public.variation_annotations;
create policy "variation_annotations delete own"
    on public.variation_annotations for delete
    to authenticated
    using (auth.uid() = user_id);

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
drop table if exists public.user_roles cascade;
drop table if exists public.user_profiles cascade;

-- Roles catalogue: the set of valid roles.
create table if not exists public.roles (
    id          uuid primary key default gen_random_uuid(),
    name        text not null unique,
    description text,
    created_at  timestamptz not null default now()
);

-- Seed the two built-in roles (idempotent).
insert into public.roles (name, description) values
    ('user',  'Standard user'),
    ('admin', 'Administrator with access to admin pages')
on conflict (name) do nothing;

alter table public.roles enable row level security;

drop policy if exists "roles readable by authenticated" on public.roles;
create policy "roles readable by authenticated"
    on public.roles for select
    to authenticated
    using (true);

-- User roles: links auth.users directly to roles.
create table if not exists public.user_roles (
    user_id    uuid not null references auth.users(id) on delete cascade,
    role_id    uuid not null references public.roles(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, role_id)
);

alter table public.user_roles enable row level security;

-- Each user can read their own role assignments.
drop policy if exists "user_roles select own" on public.user_roles;
create policy "user_roles select own"
    on public.user_roles for select
    to authenticated
    using (auth.uid() = user_id);

-- Assign the 'user' role to new sign-ups automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.user_roles (user_id, role_id)
    select new.id, r.id from public.roles r where r.name = 'user'
    on conflict (user_id, role_id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Backfill: assign 'user' role to any existing users without a role assignment.
insert into public.user_roles (user_id, role_id)
select u.id, r.id
from auth.users u
cross join public.roles r
where r.name = 'user'
  and not exists (
      select 1 from public.user_roles ur where ur.user_id = u.id
  )
on conflict (user_id, role_id) do nothing;

-- =====================================================================
-- Admin RPC functions (security definer — bypass RLS with role check)
-- =====================================================================

-- Internal helper: true if the given user holds the admin role.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer stable set search_path = public
as $$
    select exists (
        select 1
        from public.user_roles ur
        join public.roles r on r.id = ur.role_id
        where ur.user_id = uid and r.name = 'admin'
    )
$$;

-- Returns aggregate diagnostics — admin only.
create or replace function public.get_diagnostics()
returns json
language plpgsql
security definer set search_path = public
as $$
declare
    v_total_users int;
    v_top_users   json;
begin
    if not public.is_admin(auth.uid()) then
        raise exception 'Unauthorized: admin access required';
    end if;

    select count(*) into v_total_users from auth.users;

    select json_agg(t) into v_top_users
    from (
        select
            u.email,
            count(distinct rc.id)  as race_count,
            count(distinct g.id)   as goal_count,
            count(distinct a.id)   as annotation_count,
            count(distinct rc.id) + count(distinct g.id) + count(distinct a.id) as total_activity
        from auth.users u
        left join public.races                 rc on rc.user_id = u.id
        left join public.goals                 g  on g.user_id  = u.id
        left join public.variation_annotations a  on a.user_id  = u.id
        group by u.id, u.email
        order by total_activity desc
        limit 5
    ) t;

    return json_build_object(
        'total_users', v_total_users,
        'top_users',   coalesce(v_top_users, '[]'::json)
    );
end;
$$;

-- Returns all users with their current role name — admin only.
create or replace function public.get_all_users_with_roles()
returns table(id uuid, email text, role text, created_at timestamptz)
language plpgsql
security definer set search_path = public
as $$
begin
    if not public.is_admin(auth.uid()) then
        raise exception 'Unauthorized: admin access required';
    end if;

    return query
    select
        u.id::uuid,
        u.email::text,
        coalesce(
            (select r.name
             from public.user_roles ur
             join public.roles r on r.id = ur.role_id
             where ur.user_id = u.id
             limit 1),
            'user'
        )::text as role,
        u.created_at::timestamptz
    from auth.users u
    order by u.created_at asc;
end;
$$;

-- Sets the role of a target user — admin only.
-- Replaces all current role assignments with the single new role.
create or replace function public.set_user_role(target_user_id uuid, new_role text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
    v_role_id uuid;
begin
    if not public.is_admin(auth.uid()) then
        raise exception 'Unauthorized: admin access required';
    end if;

    select id into v_role_id from public.roles where name = new_role;
    if v_role_id is null then
        raise exception 'Unknown role: %', new_role;
    end if;

    -- Prevent demoting the last admin.
    if new_role <> 'admin' then
        if (
            select count(*)
            from public.user_roles ur
            join public.roles r on r.id = ur.role_id
            where r.name = 'admin' and ur.user_id = target_user_id
        ) > 0 and (
            select count(*)
            from public.user_roles ur
            join public.roles r on r.id = ur.role_id
            where r.name = 'admin'
        ) = 1 then
            raise exception 'Cannot remove the last admin';
        end if;
    end if;

    delete from public.user_roles where user_id = target_user_id;
    insert into public.user_roles (user_id, role_id) values (target_user_id, v_role_id);
end;
$$;
