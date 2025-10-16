-- ===================================================================
-- Fantasy Golf Database Schema - LIVE SUPABASE DATABASE
-- Run this in: https://supabase.com/dashboard/project/qemosikbhrnstcormhuz/sql
-- ===================================================================

-- 1. PROFILES TABLE (extends auth.users)
-- ===================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
drop policy if exists "insert own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;

create policy "read own profile"
on public.profiles for select using (auth.uid() = id);

create policy "insert own profile"
on public.profiles for insert with check (auth.uid() = id);

create policy "update own profile"
on public.profiles for update using (auth.uid() = id);

-- 2. TOURNAMENTS TABLE
-- ===================================================================
create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pga_tournament_id text unique,
  start_date timestamptz not null,
  end_date timestamptz not null,
  course_name text,
  location text,
  status text check (status in ('upcoming', 'open', 'in_progress', 'completed', 'cancelled')) default 'upcoming',
  entry_fee numeric(10,2) not null default 0,
  prize_pool numeric(10,2) not null default 0,
  max_entries integer,
  salary_cap integer default 50000,
  min_golfers integer default 6,
  max_golfers integer default 8,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists tournaments_status_idx on public.tournaments(status);
create index if not exists tournaments_start_date_idx on public.tournaments(start_date);

alter table public.tournaments enable row level security;

drop policy if exists "read all tournaments" on public.tournaments;
create policy "read all tournaments"
on public.tournaments for select using (true);

-- 3. GOLFERS TABLE
-- ===================================================================
create table if not exists public.golfers (
  id uuid primary key default gen_random_uuid(),
  pga_player_id text unique,
  first_name text not null,
  last_name text not null,
  country text,
  world_ranking integer,
  profile_image_url text,
  status text check (status in ('active', 'injured', 'withdrawn')) default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists golfers_status_idx on public.golfers(status);

alter table public.golfers enable row level security;

drop policy if exists "read all golfers" on public.golfers;
create policy "read all golfers"
on public.golfers for select using (true);

-- 4. TOURNAMENT_GOLFERS (links golfers to tournaments with salary)
-- ===================================================================
create table if not exists public.tournament_golfers (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  golfer_id uuid references public.golfers(id) on delete cascade,
  salary integer not null,
  status text check (status in ('confirmed', 'withdrawn', 'cut')) default 'confirmed',
  created_at timestamptz default now(),
  unique(tournament_id, golfer_id)
);

create index if not exists tournament_golfers_tournament_idx on public.tournament_golfers(tournament_id);
create index if not exists tournament_golfers_salary_idx on public.tournament_golfers(salary);

alter table public.tournament_golfers enable row level security;

drop policy if exists "read all tournament golfers" on public.tournament_golfers;
create policy "read all tournament golfers"
on public.tournament_golfers for select using (true);

-- 5. ENTRIES TABLE
-- ===================================================================
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tournament_id uuid references public.tournaments(id) on delete cascade,
  entry_name text,
  total_salary integer not null,
  entry_fee numeric(10,2) not null,
  status text check (status in ('pending', 'confirmed', 'cancelled', 'refunded')) default 'pending',
  payment_status text check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  transaction_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists entries_user_idx on public.entries(user_id);
create index if not exists entries_tournament_idx on public.entries(tournament_id);
create index if not exists entries_status_idx on public.entries(status);

alter table public.entries enable row level security;

drop policy if exists "read own entries" on public.entries;
drop policy if exists "insert own entries" on public.entries;
drop policy if exists "update own entries" on public.entries;

create policy "read own entries"
on public.entries for select using (auth.uid() = user_id);

create policy "insert own entries"
on public.entries for insert with check (auth.uid() = user_id);

create policy "update own entries"
on public.entries for update using (auth.uid() = user_id and status = 'pending');

-- ===================================================================
-- SUCCESS! Your LIVE Supabase database is now set up ✅
-- ===================================================================
