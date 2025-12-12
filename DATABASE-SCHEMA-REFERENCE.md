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
- ONE 2 ONE challenge instances
- Uses `instance_id` in competition_entries

### Competition Entries
**Table:** `competition_entries`
- User entries for competitions
- Columns:
  - `user_id` → references auth.users(id)
  - `competition_id` → references tournament_competitions(id) [InPlay]
  - `instance_id` → references tournament_instances(id) [ONE 2 ONE]
  - `captain_golfer_id` → references golfers(id)

**Table:** `competition_entry_picks`
- Individual golfer selections for an entry
- Columns:
  - `entry_id` → references competition_entries(id)
  - `golfer_id` → references golfers(id)
  - `slot_position` → 1-6 for team position
  - `salary` → golfer's salary cost
  - `is_captain` → boolean

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

## Related Documentation
- See `TOURNAMENT-GOLFERS-COMPLETE.md` for golfer management
- See `TYPE-SYSTEM-GUIDE.md` for TypeScript discriminated unions
- See `DATAGOLF-INTEGRATION-PLAN.md` for field synchronization
