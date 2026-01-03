# Clubhouse System - Quick Start Guide

## Overview

The Clubhouse system is a **simplified, bulletproof version** of the InPlay fantasy golf platform. It's designed to test architectural fixes before backporting them to the main system.

## Key Architectural Improvements

### 1. **Simple Status Values**
- Only 4 event statuses: `upcoming`, `open`, `active`, `completed`
- No confusion between `reg_open` vs `registration_open` vs `live`
- Single source of truth in `packages/clubhouse-shared/src/constants.ts`

### 2. **Database Automation**
- Status automatically calculated from dates via triggers
- Competition timing auto-syncs when event dates change
- No HTTP calls between services that can fail silently

### 3. **Atomic Operations**
- Credit grants use RPC function with transaction logging
- Entry creation + payment deduction is atomic (both succeed or both fail)
- Row-level locks prevent race conditions

### 4. **Database Constraints**
- Exactly 6 golfers per team (enforced by database)
- Captain must be in the team (enforced by database)
- No duplicate entries (enforced by database)
- Invalid data is impossible

## Setup Instructions

### 1. Install Dependencies

```powershell
# From workspace root
pnpm install
```

### 2. Configure Supabase

```powershell
# Copy environment files
cd apps/clubhouse-admin
copy .env.example .env.local

cd ../clubhouse
copy .env.example .env.local
```

Edit both `.env.local` files with your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (admin only)

### 3. Run Database Setup

```powershell
# Execute the database schema
.\scripts\setup-clubhouse-db.ps1
```

This creates:
- 5 tables: events, competitions, wallets, transactions, entries
- 2 triggers: auto status updates, auto timing sync
- 2 RPC functions: atomic credit grants, atomic entries

### 4. Start Development Servers

```powershell
# Admin app (port 3004)
cd apps/clubhouse-admin
pnpm dev

# User app (port 3005) - in another terminal
cd apps/clubhouse
pnpm dev
```

## Testing Checklist

### Phase 1: Event Creation
- [ ] Create event with start/end dates
- [ ] Add 3 competitions with different entry costs
- [ ] Verify status is automatically set based on dates
- [ ] Change event dates - verify competitions auto-sync

### Phase 2: Credit System
- [ ] Grant 1000 credits to test user
- [ ] Verify transaction logged in `clubhouse_credit_transactions`
- [ ] Check wallet balance updates

### Phase 3: Entry System
- [ ] Enter competition with valid 6-golfer team
- [ ] Verify credits deducted atomically
- [ ] Try entering with insufficient credits - should fail gracefully
- [ ] Try duplicate entry - should be rejected

### Phase 4: Status Transitions
- [ ] Create event with registration opening tomorrow
- [ ] Wait/change dates to trigger `open` status
- [ ] Verify competition registration opens automatically
- [ ] Move to start date - verify `active` status
- [ ] Move past end date - verify `completed` status

### Phase 5: Edge Cases
- [ ] Try entering 5 golfers - should fail (database constraint)
- [ ] Try captain not in team - should fail
- [ ] Try entering without enough credits - should fail
- [ ] Cancel event - verify automatic refunds

## Architecture Highlights

### Database Trigger: Auto Status Updates

```sql
CREATE OR REPLACE FUNCTION update_event_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically calculate status from dates
  IF NEW.start_date > NOW() THEN
    IF NEW.reg_open_date <= NOW() THEN
      NEW.status := 'open';
    ELSE
      NEW.status := 'upcoming';
    END IF;
  ELSIF NEW.end_date < NOW() THEN
    NEW.status := 'completed';
  ELSE
    NEW.status := 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Why this fixes the problem:**
- No HTTP calls that can fail
- Status always matches dates
- Runs automatically on every insert/update
- Zero manual intervention

### RPC Function: Atomic Entry Creation

```sql
CREATE OR REPLACE FUNCTION create_entry_with_payment(...)
RETURNS uuid AS $$
DECLARE
  new_entry_id uuid;
BEGIN
  -- Lock wallet row to prevent race conditions
  SELECT balance INTO current_balance
  FROM clubhouse_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check sufficient funds
  IF current_balance < entry_cost THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  -- Create entry
  INSERT INTO clubhouse_entries (...)
  VALUES (...) RETURNING id INTO new_entry_id;
  
  -- Deduct credits
  UPDATE clubhouse_wallets
  SET balance = balance - entry_cost
  WHERE user_id = p_user_id;
  
  -- Log transaction
  INSERT INTO clubhouse_credit_transactions (...)
  VALUES (...);
  
  RETURN new_entry_id;
END;
$$ LANGUAGE plpgsql;
```

**Why this fixes the problem:**
- Entry creation + payment is atomic (both or neither)
- Row locks prevent race conditions
- Transaction log for auditing
- Graceful failure with clear error messages

## Backport Strategy

Once tested with 2-3 real events:

1. **Document what works**: Write detailed test results
2. **Identify proven patterns**: Status automation, atomic operations
3. **Plan incremental backport**: One fix at a time to main system
4. **Test each backport**: Don't break production
5. **Rollback plan**: Keep old code commented for 1 week

## Key Differences from InPlay

| Feature | InPlay | Clubhouse |
|---------|---------|-----------|
| Status values | 10+ variations | 4 simple values |
| Timing sync | HTTP API calls | Database triggers |
| Credits | Stored as pennies | Whole numbers |
| Entry payment | Separate operations | Atomic RPC |
| Validation | API layer | Database constraints |
| Manual scripts | Many | Zero |

## Success Criteria

✅ **Zero manual interventions** for 3 consecutive events
✅ **Status always matches dates** without scripts
✅ **No race conditions** in credit system
✅ **Invalid data impossible** due to constraints
✅ **Clear error messages** for all failure cases

Once these are achieved for 2-3 real tournaments, we can confidently backport the proven patterns to the main InPlay system.

## Troubleshooting

### Status not updating
- Check database trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'update_event_status_trigger';`
- Manually trigger: `UPDATE clubhouse_events SET updated_at = NOW();`

### Credits not deducting
- Check RPC function exists: `SELECT proname FROM pg_proc WHERE proname = 'create_entry_with_payment';`
- Check wallet balance: `SELECT * FROM clubhouse_wallets WHERE user_id = '...';`

### Competitions not syncing
- Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'sync_competition_timing_trigger';`
- Update event dates to trigger sync

## Next Steps

1. Run the setup script
2. Start both development servers
3. Create a test event
4. Grant yourself credits
5. Enter a competition
6. Verify everything works automatically
7. Document any issues for backport planning
