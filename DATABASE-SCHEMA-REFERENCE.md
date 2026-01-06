# Database Schema Reference

## Core Tables and Relationships

### Tournaments
**Table:** `tournaments`
- Primary tournament information
- Contains: name, location, dates, status, tour type

### Golfers  
**Table:** `golfers`
- Master database of all golfers
- Contains: name, country, dg_id (DataGolf ID), pga_tour_id

### Tournament Golfers (Junction)
**Table:** `tournament_golfers`
- **Critical:** Links golfers to specific tournaments  
- **Rule:** Only golfers in this table are valid for a tournament
- Columns:
  - `tournament_id` → references tournaments(id)
  - `golfer_id` → references golfers(id)
  - `status` → 'confirmed', 'withdrawn', 'cut'
  - Unique constraint: (tournament_id, golfer_id)

### Golfer Groups
**Table:** `golfer_groups`
- Named groups of golfers (e.g., "Alfred Dunhill Championship Field")
- Used to restrict available golfers for competitions

**Table:** `golfer_group_members`
- Links golfers to groups
- Columns: `group_id`, `golfer_id`

### InPlay Competitions
**Table:** `tournament_competitions`
- InPlay competitions (Full Course, Beat The Cut, etc.)
- Columns:
  - `tournament_id` → references tournaments(id)
  - `competition_type_id` → references competition_types(id)
  - `assigned_golfer_group_id` → references golfer_groups(id)
- **Important:** `assigned_golfer_group_id` defines valid golfers for this competition

### ONE 2 ONE Challenges  
**Table:** `tournament_instances`
### Competition Entries
**Table:** `competition_entries`
- User entries for competitions (both InPlay and ONE 2 ONE)
- Columns:
  - `user_id` → references auth.users(id)
  - `competition_id` → references tournament_competitions(id)
  - `entry_name` TEXT - Optional team name
  - `captain_golfer_id` → references golfers(id)
  - `total_salary` INTEGER - Sum of golfer salaries
  - `entry_fee_paid` INTEGER - Amount paid in pennies
  - `status` TEXT - 'draft', 'submitted', 'paid', 'cancelled'

**Table:** `entry_picks`
- Individual golfer selections for an entry
- Columns:
  - `entry_id` → references competition_entries(id)
  - `golfer_id` → references golfers(id)
  - `slot_position` → 1-6 for team position
  - `salary_at_selection` → golfer's salary when picked (frozen)
  - PRIMARY KEY: (entry_id, golfer_id)

**IMPORTANT**: Both InPlay and ONE 2 ONE use the same `competition_entries` table. They are distinguished by the `competition_format` field in `tournament_competitions`, NOT by separate tables or columns.

## Data Flow for InPlay Competitions

### 1. Tournament Creation
```
tournaments table
  ↓
tournament_golfers table (sync from DataGolf)
  ↓
golfer_groups table (auto-create "Tournament Field" group)
  ↓
golfer_group_members table (all tournament golfers added to group)
```

### 2. Competition Setup
```
tournament_competitions table
  ↓
assigned_golfer_group_id links to golfer_groups
  ↓
This defines valid golfers for competition
```

### 3. User Entry Creation
```
User selects golfers
  ↓
VALIDATION: Check golfer_id in golfer_group_members
             WHERE group_id = competition.assigned_golfer_group_id
  ↓
Create competition_entries record
  ↓
Create competition_entry_picks records (6 golfers)
```

## Critical Validation Rules

### ⚠️ RULE 1: Golfer Must Be in Tournament
**Before allowing golfer selection:**
```sql
SELECT 1 FROM tournament_golfers
WHERE tournament_id = :tournament_id
  AND golfer_id = :golfer_id
```

### ⚠️ RULE 2: Golfer Must Be in Competition's Group
**Before allowing golfer selection:**
```sql
SELECT 1 FROM golfer_group_members
WHERE group_id = (
  SELECT assigned_golfer_group_id 
  FROM tournament_competitions 
  WHERE id = :competition_id
)
AND golfer_id = :golfer_id
```

### ⚠️ RULE 3: Competition Links to Tournament
**To get tournament_id from competition_id:**
```sql
SELECT tournament_id
FROM tournament_competitions
WHERE id = :competition_id
```

## Common Queries

### Get Valid Golfers for Competition
```sql
SELECT DISTINCT g.*
FROM golfers g
JOIN golfer_group_members ggm ON ggm.golfer_id = g.id
JOIN tournament_competitions tc ON tc.assigned_golfer_group_id = ggm.group_id
WHERE tc.id = :competition_id
  AND g.id IN (
    SELECT golfer_id 
    FROM tournament_golfers 
    WHERE tournament_id = tc.tournament_id
  );
```

### Check if Entry Golfers Are Valid
```sql
SELECT 
  cep.golfer_id,
  g.name,
  CASE 
    WHEN tg.golfer_id IS NULL THEN 'NOT IN TOURNAMENT'
    WHEN ggm.golfer_id IS NULL THEN 'NOT IN COMPETITION GROUP'
    ELSE 'VALID'
  END as status
FROM competition_entry_picks cep
JOIN competition_entries ce ON ce.id = cep.entry_id
JOIN tournament_competitions tc ON tc.id = ce.competition_id
JOIN golfers g ON g.id = cep.golfer_id
LEFT JOIN tournament_golfers tg 
  ON tg.tournament_id = tc.tournament_id 
  AND tg.golfer_id = cep.golfer_id
LEFT JOIN golfer_group_members ggm
  ON ggm.group_id = tc.assigned_golfer_group_id
  AND ggm.golfer_id = cep.golfer_id
WHERE ce.id = :entry_id;
```

## Bug Prevention

### The Admin Golfer Selection Bug (December 2024)
**Problem:** Admin account had golfers not in tournament field

**Root Cause:** No validation that selected golfers exist in:
1. `tournament_golfers` table for that tournament
2. `golfer_group_members` for competition's assigned group

**Solution:** Add validation at these points:
1. Frontend: Filter available golfers before showing picker
2. API: Validate each golfer_id before creating picks
3. Database: Add CHECK constraint (future enhancement)

### Prevention Checklist
- [ ] Always join through `tournament_golfers` when showing available golfers
- [ ] Always validate against `golfer_group_members` for competition groups
- [ ] Never assume golfer_id is valid without checking relationships
- [ ] Use competition's `assigned_golfer_group_id` to restrict selections
- [ ] Test with admin accounts (they don't have same UI restrictions as users)

## InPlay vs ONE 2 ONE Differences

| Feature | InPlay Competitions | ONE 2 ONE Challenges |
|---------|---------------------|----------------------|
| Table | `tournament_competitions` | `tournament_instances` |
| Reference in entries | `competition_id` | `instance_id` |
| Golfer source | tournament_golfers via golfer_groups | tournament_golfers |
| Entry restriction | assigned_golfer_group_id | No group restriction |
| Competition types | Full Course, Beat The Cut, etc. | Head-to-head matchups |
| Multiple per tournament | Yes (6+ competitions) | Yes (multiple instances) |

---

## Clubhouse System (Testing Ground)

### Purpose
Isolated testing environment for validating fixes before backporting to InPlay/ONE 2 ONE. All tables use `clubhouse_*` prefix for guaranteed isolation.

### Clubhouse Events
**Table:** `clubhouse_events`
- Similar to `tournaments` but simplified for testing
- Key columns:
  - `name`, `slug`, `description`, `venue`, `location`
  - `start_date TIMESTAMPTZ`, `end_date TIMESTAMPTZ`
  - `registration_opens_at TIMESTAMPTZ`, `registration_closes_at TIMESTAMPTZ`
  - `round1_tee_time`, `round2_tee_time`, `round3_tee_time`, `round4_tee_time` (all TIMESTAMPTZ)
  - `status` → 'upcoming', 'open', 'active', 'completed'
- **Critical constraint:** `registration_closes_at <= end_date` (NOT start_date)
  - **Why:** Golf tournaments accept entries until 15min before LAST round
  - **Example:** 4-day tournament Jan 5-8 can accept entries until Jan 8 at 06:45

### Clubhouse Competitions
**Table:** `clubhouse_competitions`
- Multiple competitions per event (like InPlay types)
- Key columns:
  - `event_id` → references clubhouse_events(id)
  - `name`, `description`
  - `entry_credits INTEGER` (NOT "credits") - Entry cost in credits
  - `max_entries INTEGER` - Capacity limit
  - `prize_pool_credits INTEGER`
  - `assigned_golfer_group_id` → references golfer_groups(id) (shared with InPlay!)
  - `opens_at`, `closes_at`, `starts_at`, `ends_at` (all TIMESTAMPTZ)
  - `status` → 'upcoming', 'open', 'active', 'completed'
- **No `rounds_covered` column** - Simplified from original design

### Clubhouse Wallets
**Table:** `clubhouse_wallets`
- Credit-based payment system
- Key columns:
  - `user_id` → references auth.users(id)
  - `balance_credits INTEGER` (NOT "credits") - Current balance
  - `created_at`, `updated_at`

### Clubhouse Transactions
**Table:** `clubhouse_credit_transactions`
- Immutable audit log of all credit movements
- Key columns:
  - `wallet_id` → references clubhouse_wallets(id)
  - `user_id` → references auth.users(id)
  - `amount_credits INTEGER` - Positive for credit, negative for debit
  - `transaction_type` → 'topup', 'entry', 'refund', 'prize'
  - `description TEXT` - Human-readable explanation
  - `balance_after INTEGER` - Balance snapshot after transaction

### Clubhouse Entries
**Table:** `clubhouse_entries`
- User entries for clubhouse competitions
- Key columns:
  - `competition_id` → references clubhouse_competitions(id)
  - `user_id` → references auth.users(id)
  - `entry_fee_paid INTEGER` (NOT "entry_credits")
  - `total_score DECIMAL`, `position INTEGER`
  - `prize_credits INTEGER`
  - `status` → 'active', 'withdrawn', 'disqualified'

### Clubhouse Entry Picks
**Table:** `clubhouse_entry_picks`
- Individual golfer selections (6 per entry, 1 captain)
- Key columns:
  - `entry_id` → references clubhouse_entries(id)
  - `golfer_id` → references golfers(id) (shared with InPlay!)
  - `is_captain BOOLEAN`
  - `pick_order INTEGER` (1-6)

### Clubhouse Integration with Main System

**Shared Resources:**
- ✅ Uses same `golfers` table (read-only)
- ✅ Uses same `golfer_groups` system for field restrictions
- ✅ Uses same `auth.users` for authentication

**Isolated Resources:**
- ❌ Separate event/competition tables (clubhouse_events, clubhouse_competitions)
- ❌ Separate wallet/transaction tables
- ❌ Separate entries/picks tables

**Data Flow:**
```
1. Admin assigns golfer group to Clubhouse competition
   ↓
2. Clubhouse uses assigned_golfer_group_id to filter available golfers
   ↓
3. User creates entry with 6 golfers from group
   ↓
4. clubhouse_entries + clubhouse_entry_picks created
   ↓
5. Credits deducted from clubhouse_wallets
```

### Column Name Reference (Common Mistakes)

| ❌ Wrong Column | ✅ Correct Column | Table |
|----------------|-------------------|-------|
| `credits` | `balance_credits` | clubhouse_wallets |
| `entry_credits` | `entry_fee_paid` | clubhouse_entries |
| `rounds_covered` | (doesn't exist) | clubhouse_competitions |
| `start_date` in constraint | `end_date` | clubhouse_events |

### Registration Timing Logic

**Key Insight:** Golf tournaments accept entries until 15 minutes before the LAST round tee-off, NOT the first round.

**Example:**
- Tournament: Jan 5-8 (4 days)
- Round 1: Jan 5 at 07:00
- Round 4: Jan 8 at 07:00 (LAST round)
- Registration closes: Jan 8 at 06:45 (15 min before Round 4)

**API Logic:**
```typescript
// Calculate registration close time
const lastRound = event.round4_tee_time || event.round3_tee_time; // Use highest round available
const regCloseTime = new Date(lastRound.getTime() - 15 * 60 * 1000); // Subtract 15 minutes
```

**Files Using This Logic:**
- `apps/golf/src/app/api/clubhouse/events/route.ts`
- `apps/golf/src/app/api/clubhouse/events/[id]/route.ts`

---

## Related Documentation
- See `TOURNAMENT-GOLFERS-COMPLETE.md` for golfer management
- See `TYPE-SYSTEM-GUIDE.md` for TypeScript discriminated unions
- See `DATAGOLF-INTEGRATION-PLAN.md` for field synchronization
