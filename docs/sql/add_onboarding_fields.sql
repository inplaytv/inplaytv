-- Migration: Create profiles table with onboarding fields
-- Date: 2025-10-16
-- Purpose: Enable user onboarding flow with name and password setup

-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Drop existing policies if they exist
drop policy if exists "profile is self select" on public.profiles;
drop policy if exists "profile is self insert" on public.profiles;
drop policy if exists "profile is self update" on public.profiles;

-- Create Row Level Security policies
create policy "profile is self select"
on public.profiles for select
using (auth.uid() = id);

create policy "profile is self insert"
on public.profiles for insert
with check (auth.uid() = id);

create policy "profile is self update"
on public.profiles for update
using (auth.uid() = id);

-- Create function to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, onboarding_complete)
  values (new.id, false);
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to run function on new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Note: Run this migration in Supabase SQL Editor
-- After running, users will automatically get a profile row when they sign up
-- They'll need to complete onboarding to set their name and password
