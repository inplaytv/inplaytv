# Tournament Lifecycle System - Current State Audit
## Date: December 2, 2025

## ✅ WORKING SYSTEMS (DO NOT MODIFY)

### 1. Salary System
**Status:** ✅ WORKING PERFECTLY
**How it works:**
- Salaries are **calculated dynamically** based on OWGR (world ranking)
- Range: £5,000 (rank 300+) to £12,500 (rank 1)
- Optional override table: `tournament_golfer_salaries` (for tournament-specific pricing)
- Priority order:
  1. `tournament_golfer_salaries.salary` (if exists)
  2. Calculated from `golfers.world_rank` using OWGR formula
  3. `golfers.salary_pennies` (fallback)
  4. £5,000 minimum

**Location:** `/apps/golf/src/app/api/competitions/[competitionId]/golfers/route.ts`

**DO NOT:**
- ❌ Add `salary` column to `tournament_golfers` table
- ❌ Try to store salaries when syncing golfers
- ❌ Modify the OWGR calculation formula

### 2. Tournament Golfer Sync (Manual)
**Status:** ✅ WORKING
**Endpoint:** `/api/tournaments/[id]/sync-golfers`
**What it does:**
- Fetches golfers from DataGolf API
- Creates golfers in `golfers` table if they don't exist
- Links golfers to tournament via `tournament_golfers` table
- **Only stores:** `tournament_id`, `golfer_id`, `status: 'confirmed'`
- **Does NOT store salaries** (they're calculated dynamically)

### 3. Admin Systems
**Status:** ✅ ALL WORKING
- Tournament List
- AI Tournament Creator
- Competition Types Management
- Tournament Golfers Management

### 4. Database Schema - tournament_golfers
**Current Columns:**
```
- id (uuid)
- tournament_id (uuid)
- golfer_id (uuid)
- status (text) - 'confirmed', 'withdrawn', 'cut'
- created_at (timestamptz)
- r1_score, r2_score, r3_score, r4_score (integer)
- total_score (integer)
- position (integer)
- to_par (integer)
```

**NO SALARY COLUMN** - And that's correct!

## ❌ BROKEN SYSTEMS (NEED FIXING)

### 1. Automated Golfer Sync (Cron Job)
**Status:** ❌ BROKEN - JUST FIXED TODAY
**Issues Found:**
1. Was checking wrong status: `status='upcoming'` instead of `status='registration_open'`
2. Was trying to insert `salary` column that doesn't exist
3. Date filtering too strict (6 days instead of flexible window)

**Fixes Applied:**
- ✅ Now checks both `'upcoming'` and `'registration_open'` statuses
- ✅ Removed salary insertion (salaries calculated dynamically)
- ✅ Extended window to 30 days
- ✅ Added detailed logging

**Location:** `/apps/admin/src/app/api/cron/sync-tournament-golfers/route.ts`

### 2. Tournament Status Lifecycle
**Status:** ⚠️ INCONSISTENT
**Current Statuses:**
- `upcoming` - Tournament created but not open for registration
- `registration_open` - Users can register and build teams
- `in_progress` - Tournament has started
- `completed` - Tournament finished
- `cancelled` - Tournament cancelled

**Problems:**
- No automated status transitions
- Manual status changes required
- Timezone handling unclear
- Registration close timing not automated

## 🔧 REQUIRED FIXES

### Priority 1: Tournament Status Automation
**Need to implement:**
1. Automated status transitions based on dates/times
2. Timezone-aware registration open/close
3. Automatic transition to `in_progress` when tournament starts
4. Automatic transition to `completed` when tournament ends

### Priority 2: Registration Window Management
**Need:**
- `registration_opens_at` timestamp (timezone-aware)
- `registration_closes_at` timestamp (timezone-aware)
- Automated status change to `registration_open`
- Automated status change from `registration_open` to `in_progress`

### Priority 3: Cron Job Deployment
**Need:**
- Deploy automated golfer sync to production
- Schedule: Daily at 6 AM (or every 6 hours)
- Monitor for failures

### Priority 4: Validation & Safeguards
**Need:**
- Prevent manual breaking of working systems
- Add database constraints
- Add API validation
- Add admin warnings for dangerous operations

## 📋 NEXT STEPS

1. **DO NOT touch salary system** - it's working perfectly
2. **DO NOT modify tournament_golfers schema** - it's correct
3. **Focus on:** Tournament status lifecycle automation
4. **Add:** Timezone-aware registration windows
5. **Deploy:** Cron job to production
6. **Test:** Complete tournament lifecycle end-to-end

## 🚨 CRITICAL REMINDERS

- ✅ Golfer sync is NOW WORKING (fixed today)
- ✅ Salary system is PERFECT - leave it alone
- ✅ Admin systems are WORKING - don't break them
- ❌ Status transitions need automation
- ❌ Timezone handling needs implementation
- ❌ Cron job needs production deployment
