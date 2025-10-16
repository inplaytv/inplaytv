# Setup Guide

Complete setup instructions for the Fantasy Golf monorepo.

## Prerequisites

✅ **Already Installed:**
- Node.js v20+
- pnpm 9.0+
- Git

## Step 1: Supabase Project Setup

### Create Project

1. Go to https://supabase.com
2. Click "New Project"
3. Choose organization and project name
4. Select region closest to your users
5. Generate a strong database password (save it!)
6. Wait for project to be provisioned (~2 minutes)

### Create Database Schema

Go to **SQL Editor** in Supabase and run:

```sql
-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policies
create policy "read own profile"
on public.profiles for select using (auth.uid() = id);

create policy "insert own profile"
on public.profiles for insert with check (auth.uid() = id);

create policy "update own profile"
on public.profiles for update using (auth.uid() = id);
```

### Configure Auth Providers

1. Go to **Authentication → Providers**
2. Enable **Email** provider
3. Disable "Confirm email" for development (re-enable in production!)
4. Save changes

### Add Redirect URLs

1. Go to **Authentication → URL Configuration**
2. Add these Site URLs:
   - `http://localhost:3000`
   - `http://localhost:3000/**` (wildcard)
3. Add these Redirect URLs:
   - `http://localhost:3000/account`
   - `http://localhost:3000/auth/callback`

## Step 2: Get API Credentials

1. Go to **Project Settings → API**
2. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## Step 3: Configure Environment Variables

1. Navigate to `apps/web/`
2. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```
3. Open `.env.local` and paste your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-key-here
   ```

⚠️ **Never commit `.env.local` to git!** (Already in .gitignore)

## Step 4: Start Development Server

```bash
# From project root
pnpm dev:web
```

Open http://localhost:3000 in your browser.

## Verification Checklist

- [ ] Supabase project created
- [ ] Database schema deployed
- [ ] Email auth provider enabled
- [ ] Redirect URLs configured
- [ ] Environment variables set
- [ ] Dev server starts without errors
- [ ] Home page loads at http://localhost:3000
- [ ] Login page loads at http://localhost:3000/login

✅ **Next:** See `03-TESTING-AUTH.md` to test authentication
