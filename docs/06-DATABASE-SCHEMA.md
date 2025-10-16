# Database Schema

Complete PostgreSQL schema for Fantasy Golf platform.

## Current Schema ✅

### profiles
```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  created_at timestamptz default now()
);
```

**Status:** ✅ Deployed

## Upcoming Tables

### tournaments
```sql
create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pga_tournament_id text unique,
  start_date timestamptz not null,
  end_date timestamptz not null,
  course_name text,
  location text,
  status text check (status in ('upcoming', 'open', 'in_progress', 'completed', 'cancelled')),
  entry_fee numeric(10,2) not null,
  prize_pool numeric(10,2) not null,
  max_entries integer,
  salary_cap integer default 50000,
  min_golfers integer default 6,
  max_golfers integer default 8,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index tournaments_status_idx on public.tournaments(status);
create index tournaments_start_date_idx on public.tournaments(start_date);
```

### golfers
```sql
create table public.golfers (
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

create index golfers_status_idx on public.golfers(status);
```

### tournament_golfers
```sql
-- Links golfers to tournaments with salary
create table public.tournament_golfers (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  golfer_id uuid references public.golfers(id) on delete cascade,
  salary integer not null,
  status text check (status in ('confirmed', 'withdrawn', 'cut')) default 'confirmed',
  created_at timestamptz default now(),
  unique(tournament_id, golfer_id)
);

create index tournament_golfers_tournament_idx on public.tournament_golfers(tournament_id);
create index tournament_golfers_salary_idx on public.tournament_golfers(salary);
```

### entries
```sql
create table public.entries (
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

create index entries_user_idx on public.entries(user_id);
create index entries_tournament_idx on public.entries(tournament_id);
create index entries_status_idx on public.entries(status);
```

### picks
```sql
create table public.picks (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references public.entries(id) on delete cascade,
  golfer_id uuid references public.golfers(id) on delete cascade,
  position integer check (position >= 1 and position <= 8),
  salary_at_pick integer not null,
  created_at timestamptz default now(),
  unique(entry_id, golfer_id),
  unique(entry_id, position)
);

create index picks_entry_idx on public.picks(entry_id);
create index picks_golfer_idx on public.picks(golfer_id);
```

### scores_live
```sql
create table public.scores_live (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  golfer_id uuid references public.golfers(id) on delete cascade,
  round integer check (round >= 1 and round <= 4),
  hole integer check (hole >= 0 and hole <= 18),
  strokes integer,
  score_to_par integer,
  total_strokes integer,
  total_to_par integer,
  position integer,
  updated_at timestamptz default now(),
  unique(tournament_id, golfer_id, round)
);

create index scores_live_tournament_idx on public.scores_live(tournament_id);
create index scores_live_golfer_idx on public.scores_live(golfer_id);
create index scores_live_updated_idx on public.scores_live(updated_at);
```

### leaderboards
```sql
create table public.leaderboards (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  entry_id uuid references public.entries(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  total_score integer not null,
  position integer,
  prize_amount numeric(10,2) default 0,
  calculated_at timestamptz default now(),
  unique(tournament_id, entry_id)
);

create index leaderboards_tournament_idx on public.leaderboards(tournament_id);
create index leaderboards_position_idx on public.leaderboards(position);
create index leaderboards_user_idx on public.leaderboards(user_id);
```

### transactions
```sql
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  entry_id uuid references public.entries(id) on delete set null,
  type text check (type in ('entry_fee', 'prize_payout', 'refund')) not null,
  amount numeric(10,2) not null,
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  status text check (status in ('pending', 'completed', 'failed')) default 'pending',
  metadata jsonb,
  created_at timestamptz default now()
);

create index transactions_user_idx on public.transactions(user_id);
create index transactions_entry_idx on public.transactions(entry_id);
create index transactions_status_idx on public.transactions(status);
```

## Row Level Security (RLS)

### profiles (already set)
```sql
-- Users can read their own profile
create policy "read own profile"
on public.profiles for select using (auth.uid() = id);

-- Users can insert their own profile
create policy "insert own profile"
on public.profiles for insert with check (auth.uid() = id);

-- Users can update their own profile
create policy "update own profile"
on public.profiles for update using (auth.uid() = id);
```

### tournaments
```sql
-- Everyone can read tournaments
create policy "read all tournaments"
on public.tournaments for select using (true);

-- Only admins can manage (add role check later)
create policy "admin manage tournaments"
on public.tournaments for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
```

### entries
```sql
-- Users can read their own entries
create policy "read own entries"
on public.entries for select using (auth.uid() = user_id);

-- Users can insert their own entries
create policy "insert own entries"
on public.entries for insert with check (auth.uid() = user_id);

-- Users can update their own entries (before tournament starts)
create policy "update own entries"
on public.entries for update using (
  auth.uid() = user_id and status = 'pending'
);
```

## Functions & Triggers

### Update timestamp trigger
```sql
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tournaments_updated_at
  before update on public.tournaments
  for each row execute function update_updated_at();

create trigger entries_updated_at
  before update on public.entries
  for each row execute function update_updated_at();
```

### Calculate leaderboard positions
```sql
create or replace function calculate_leaderboard(tournament_uuid uuid)
returns void as $$
begin
  -- Calculate total scores for each entry
  insert into public.leaderboards (tournament_id, entry_id, user_id, total_score)
  select 
    e.tournament_id,
    e.id as entry_id,
    e.user_id,
    sum(s.total_to_par) as total_score
  from public.entries e
  join public.picks p on p.entry_id = e.id
  join public.scores_live s on s.golfer_id = p.golfer_id
  where e.tournament_id = tournament_uuid
    and s.tournament_id = tournament_uuid
  group by e.id, e.tournament_id, e.user_id
  on conflict (tournament_id, entry_id) 
  do update set 
    total_score = excluded.total_score,
    calculated_at = now();

  -- Update positions
  with ranked as (
    select 
      id,
      row_number() over (partition by tournament_id order by total_score asc) as pos
    from public.leaderboards
    where tournament_id = tournament_uuid
  )
  update public.leaderboards l
  set position = r.pos
  from ranked r
  where l.id = r.id;
end;
$$ language plpgsql;
```

## Indexes for Performance

Already included in table definitions above. Key indexes:
- Status columns for filtering
- Foreign keys for joins
- Timestamp columns for sorting
- Composite unique constraints

## Migration Order

1. ✅ profiles (deployed)
2. tournaments
3. golfers
4. tournament_golfers
5. entries
6. picks
7. scores_live
8. leaderboards
9. transactions

## Deployment Commands

Run in Supabase SQL Editor in order:

```bash
# See individual SQL blocks above
# Copy and paste each CREATE TABLE statement
# Then add indexes
# Then add RLS policies
# Then add functions/triggers
```

## Next Steps

1. Deploy tournaments table
2. Seed with sample tournament data
3. Deploy golfers table
4. Import golfer roster from PGA
5. Continue with remaining tables
