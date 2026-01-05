# Clubhouse System Setup

This directory contains all setup scripts for the clubhouse system.

## Setup Order

Run these scripts in order:

### 1. Database Schema
```powershell
# Copy the SQL and run in Supabase SQL Editor
# File: 01-create-schema.sql
```

**What it creates:**
- ✅ Tables: events, competitions, wallets, credit_transactions, entries
- ✅ Constraints: Valid dates, 6 golfers, captain in team, no negative credits
- ✅ Triggers: Auto-update event status (⚠️ Competition timing sync trigger removed - see CLUBHOUSE-TIMING-TRIGGER-ANALYSIS.md)
- ✅ Functions: apply_clubhouse_credits(), create_clubhouse_entry()
- ✅ Row Level Security policies

**Verify:** Run this query in Supabase SQL Editor:
```sql
-- Should return 5 tables
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'clubhouse_%'
ORDER BY tablename;

-- Should return 3 functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%clubhouse%'
ORDER BY routine_name;
```

### 2. Test Data (Optional)
```powershell
# Coming soon: 02-seed-test-data.sql
```

### 3. Apps
Create the Next.js apps:
- **Admin App:** `apps/clubhouse-admin` (manage events, grant credits)
- **User App:** `apps/clubhouse` (enter competitions, view wallet)

## Key Differences from Main System

| Feature | Main System | Clubhouse System |
|---------|------------|------------------|
| **Currency** | Pennies (100 = $1) | Credits (simple integers) |
| **Status Values** | Inconsistent (reg_open vs registration_open) | 4 simple values: upcoming/open/active/completed |
| **Timing Updates** | Manual scripts after changes | Auto-synced via database triggers |
| **Balance Updates** | Multiple methods | Single RPC function: apply_clubhouse_credits() |
| **Entry Creation** | Separate payment + entry | Atomic: create_clubhouse_entry() (all or nothing) |
| **Data Validation** | Application logic | Database constraints enforce rules |

## Testing Strategy

1. **Create Event** - Verify auto-status calculation
2. **Add Competition** - Verify timing auto-syncs from event
3. **Grant Credits** - Verify transaction log and balance update
4. **Create Entry** - Verify atomic payment + entry creation
5. **Update Event Dates** - Verify competitions auto-update

## Migration to Main System

Once proven stable:
1. Port database triggers to main system
2. Add constraints to existing tables
3. Create atomic RPC functions
4. Standardize status values
5. Update APIs to use new functions

See `SYSTEMATIC-FIX-PLAN.md` for detailed backport strategy.
