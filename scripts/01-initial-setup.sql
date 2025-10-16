-- ============================================
-- Initial Database Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create profiles table
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  created_at timestamptz default now()
);

-- 2. Enable Row Level Security
-- ============================================
alter table public.profiles enable row level security;

-- 3. Drop existing policies (if any)
-- ============================================
drop policy if exists "read own profile" on public.profiles;
drop policy if exists "insert own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;

-- 4. Create RLS policies
-- ============================================
-- Users can read their own profile
create policy "read own profile"
on public.profiles for select 
using (auth.uid() = id);

-- Users can insert their own profile
create policy "insert own profile"
on public.profiles for insert 
with check (auth.uid() = id);

-- Users can update their own profile
create policy "update own profile"
on public.profiles for update 
using (auth.uid() = id);

-- ============================================
-- Verification queries (optional - run after)
-- ============================================

-- Check if table exists
select table_name, table_type 
from information_schema.tables 
where table_schema = 'public' 
and table_name = 'profiles';

-- Check RLS is enabled
select tablename, rowsecurity 
from pg_tables 
where schemaname = 'public' 
and tablename = 'profiles';

-- Check policies
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
and tablename = 'profiles';
