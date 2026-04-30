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
