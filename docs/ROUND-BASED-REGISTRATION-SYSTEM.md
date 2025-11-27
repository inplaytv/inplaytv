# Round-Based Registration System

## Problem
Golf tournaments have 4 rounds over 4 days, but different competition types cover different rounds:
- **Full Course** (Rounds 1-4): Reg closes before Round 1
- **Beat The Cut** (Rounds 1-2): Reg closes before Round 1  
- **THE WEEKENDER** (Rounds 3-4): Reg closes before Round 3
- **Final Strike** (Round 4 only): Reg closes before Round 4
- **Second Round** (Round 2 only): Reg closes before Round 2
- **First To Strike** (Round 1 only): Reg closes before Round 1

## Solution Architecture

### Database Schema
Add `round_start` field to `competition_types` table:

```sql
ALTER TABLE public.competition_types 
ADD COLUMN IF NOT EXISTS round_start INTEGER DEFAULT 1;

-- Update competition types
UPDATE public.competition_types SET round_start = 1 WHERE name IN ('Full Course', 'ONE 2 ONE', 'First To Strike', 'Beat The Cut');
UPDATE public.competition_types SET round_start = 2 WHERE name = 'Second Round';
UPDATE public.competition_types SET round_start = 3 WHERE name = 'THE WEEKENDER';
UPDATE public.competition_types SET round_start = 4 WHERE name = 'Final Strike';
```

### Registration Logic

**Formula**: `reg_close_at = tournament_start_date + (round_start - 1) days + 6:30 AM`

Registration closes at **6:30 AM** on the day each round starts (typical golf tournament tee times are 7:00-8:00 AM).

Examples (tournament starts Nov 20):
- **Full Course** (round_start=1): Closes Nov 20 at 6:30 AM (before Round 1)
- **Beat The Cut** (round_start=1): Closes Nov 20 at 6:30 AM (before Round 1)
- **Second Round** (round_start=2): Closes Nov 21 at 6:30 AM (before Round 2)  
- **THE WEEKENDER** (round_start=3): Closes Nov 22 at 6:30 AM (before Round 3)
- **Final Strike** (round_start=4): Closes Nov 23 at 6:30 AM (before Round 4)

### Tournament Status Labels

**During Tournament** (start_date ≤ now < end_date):
- Status: `live` 
- Label: **"In-Play"** (not "Live In-Play" or "Completed")

**After Final Day Ends** (now ≥ end_date):
- Status: `completed`
- Label: **"Completed"**

## Implementation Files

### 1. Database Migration
File: `scripts/add-round-start-to-competition-types.sql`

### 2. Auto-Calculate Registration Dates
File: `apps/admin/src/app/api/ai/create-tournament/route.ts`
- Calculate `reg_close_at` based on `round_start`
- Apply to each competition when creating tournament

### 3. Update Status Labels
File: `apps/admin/src/lib/tournament-lifecycle.ts`
- Change "Live In-Play" → "In-Play"

### 4. Admin UI Display
File: `apps/admin/src/app/tournaments/[id]/page.tsx`
- Show round info when adding competitions
- Display registration window based on rounds

## Testing Checklist

- [ ] Full Course closes before tournament starts (Round 1)
- [ ] Beat The Cut closes before tournament starts (Round 1)
- [ ] Second Round stays open during Round 1, closes before Round 2
- [ ] THE WEEKENDER stays open during Rounds 1-2, closes before Round 3
- [ ] Final Strike stays open during Rounds 1-3, closes before Round 4
- [ ] Tournament shows "In-Play" during tournament
- [ ] Tournament shows "Completed" only after final round
- [ ] Each competition has correct reg_close_at date

## Benefits

✅ **Automatic**: No manual date entry needed  
✅ **Accurate**: Registration closes exactly when each round starts  
✅ **Flexible**: Works for any tournament length  
✅ **Maintainable**: Logic in one place (competition type definition)
