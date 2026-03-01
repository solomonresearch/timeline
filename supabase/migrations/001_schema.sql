-- ============================================================
-- 001_schema.sql — Life Timeline App database schema
-- Run in Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  bio text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- TIMELINES
-- ============================================================
create table public.timelines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Life',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.timelines enable row level security;

create policy "Users can read own timelines"
  on public.timelines for select
  using (auth.uid() = user_id);

create policy "Users can insert own timelines"
  on public.timelines for insert
  with check (auth.uid() = user_id);

create policy "Users can update own timelines"
  on public.timelines for update
  using (auth.uid() = user_id);

create policy "Users can delete own timelines"
  on public.timelines for delete
  using (auth.uid() = user_id);

-- ============================================================
-- LANES
-- ============================================================
create table public.lanes (
  id uuid primary key default gen_random_uuid(),
  timeline_id uuid not null references public.timelines(id) on delete cascade,
  name text not null,
  color text not null default '#3b82f6',
  visible boolean not null default true,
  is_default boolean not null default false,
  "order" integer not null default 0
);

alter table public.lanes enable row level security;

create policy "Users can read own lanes"
  on public.lanes for select
  using (
    exists (
      select 1 from public.timelines t
      where t.id = lanes.timeline_id and t.user_id = auth.uid()
    )
  );

create policy "Users can insert own lanes"
  on public.lanes for insert
  with check (
    exists (
      select 1 from public.timelines t
      where t.id = lanes.timeline_id and t.user_id = auth.uid()
    )
  );

create policy "Users can update own lanes"
  on public.lanes for update
  using (
    exists (
      select 1 from public.timelines t
      where t.id = lanes.timeline_id and t.user_id = auth.uid()
    )
  );

create policy "Users can delete own lanes"
  on public.lanes for delete
  using (
    exists (
      select 1 from public.timelines t
      where t.id = lanes.timeline_id and t.user_id = auth.uid()
    )
  );

-- ============================================================
-- EVENTS
-- ============================================================
create table public.events (
  id uuid primary key default gen_random_uuid(),
  lane_id uuid not null references public.lanes(id) on delete cascade,
  timeline_id uuid not null references public.timelines(id) on delete cascade,
  title text not null,
  description text not null default '',
  type text not null check (type in ('range', 'point')),
  start_year real not null,
  end_year real,
  color text
);

alter table public.events enable row level security;

create policy "Users can read own events"
  on public.events for select
  using (
    exists (
      select 1 from public.timelines t
      where t.id = events.timeline_id and t.user_id = auth.uid()
    )
  );

create policy "Users can insert own events"
  on public.events for insert
  with check (
    exists (
      select 1 from public.timelines t
      where t.id = events.timeline_id and t.user_id = auth.uid()
    )
  );

create policy "Users can update own events"
  on public.events for update
  using (
    exists (
      select 1 from public.timelines t
      where t.id = events.timeline_id and t.user_id = auth.uid()
    )
  );

create policy "Users can delete own events"
  on public.events for delete
  using (
    exists (
      select 1 from public.timelines t
      where t.id = events.timeline_id and t.user_id = auth.uid()
    )
  );

-- ============================================================
-- PERSONAS (global, read-only for authenticated users)
-- ============================================================
create table public.personas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text not null default '',
  birth_year integer not null,
  death_year integer
);

alter table public.personas enable row level security;

create policy "Authenticated users can read personas"
  on public.personas for select
  using (auth.role() = 'authenticated');

-- ============================================================
-- PERSONA_EVENTS
-- ============================================================
create table public.persona_events (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  lane_name text not null,
  title text not null,
  description text not null default '',
  type text not null check (type in ('range', 'point')),
  start_year real not null,
  end_year real,
  color text
);

alter table public.persona_events enable row level security;

create policy "Authenticated users can read persona events"
  on public.persona_events for select
  using (auth.role() = 'authenticated');

-- ============================================================
-- RPC: create_default_timeline
-- Creates a "My Life" timeline with 10 default lanes for a user
-- ============================================================
create or replace function public.create_default_timeline(p_user_id uuid)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  v_timeline_id uuid;
begin
  insert into public.timelines (user_id, name)
  values (p_user_id, 'My Life')
  returning id into v_timeline_id;

  insert into public.lanes (timeline_id, name, color, visible, is_default, "order") values
    (v_timeline_id, 'Location',         '#3b82f6', true, true, 0),
    (v_timeline_id, 'University',       '#8b5cf6', true, true, 1),
    (v_timeline_id, 'Work',             '#10b981', true, true, 2),
    (v_timeline_id, 'Other Activities', '#f59e0b', true, true, 3),
    (v_timeline_id, 'Type of House',    '#6366f1', true, true, 4),
    (v_timeline_id, 'Wealth',           '#14b8a6', true, true, 5),
    (v_timeline_id, 'Relations',        '#ec4899', true, true, 6),
    (v_timeline_id, 'Kids',             '#f97316', true, true, 7),
    (v_timeline_id, 'Parents',          '#84cc16', true, true, 8),
    (v_timeline_id, 'Cars',             '#64748b', true, true, 9);

  return v_timeline_id;
end;
$$;
