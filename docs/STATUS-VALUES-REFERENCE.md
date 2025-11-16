# Status Values Reference

## Overview
The system uses **different status value conventions** for tournaments vs competitions due to legacy schema differences.

## Tournament Status Values
**Table**: `tournaments`  
**Constraint**: Defined in `scripts/2025-01-tournament-lifecycle.sql`

| Status Value | Label | Description |
|--------------|-------|-------------|
| `upcoming` | Upcoming | Tournament not yet started |
| `registration_open` | Registration Open | Registration is open for participants |
| `registration_closed` | Registration Closed | Registration closed, waiting for start |
| `live_inplay` | Live In-Play | Tournament currently running |
| `completed` | Completed | Tournament has ended |
| `cancelled` | Cancelled | Tournament was cancelled |

## Competition Status Values
**Table**: `tournament_competitions`  
**Constraint**: Defined in `scripts/2025-01-tournament-competitions.sql`

| Status Value | Label | Description |
|--------------|-------|-------------|
| `draft` | Draft | Competition not yet published |
| `upcoming` | Upcoming | Competition scheduled but not open |
| `reg_open` | Registration Open | Open for entry |
| `reg_closed` | Registration Closed | Closed for new entries |
| `live` | Live | Competition in progress |
| `completed` | Completed | Competition finished |
| `cancelled` | Cancelled | Competition was cancelled |

## Key Differences

### Long Format (Tournaments)
- `registration_open` (not `reg_open`)
- `registration_closed` (not `reg_closed`)
- `live_inplay` (not `live`)

### Short Format (Competitions)
- `reg_open` (not `registration_open`)
- `reg_closed` (not `registration_closed`)
- `live` (not `live_inplay`)
- Has `draft` status (tournaments don't show as draft on frontend)

## API Filtering

### Golf Tournament API
**File**: `apps/golf/src/app/api/tournaments/route.ts`

```typescript
// Tournament filter - uses LONG format
.in('status', ['upcoming', 'registration_open', 'registration_closed', 'live_inplay'])

// Competition filter - uses SHORT format
.in('status', ['upcoming', 'reg_open', 'reg_closed', 'live'])
```

### Admin Status Management
**Files**: 
- `apps/admin/src/lib/tournament-lifecycle.ts` - Tournament constants (long format)
- `apps/admin/src/app/tournaments/[id]/page.tsx` - Saves tournament status

Admin uses constants from `tournament-lifecycle.ts`:
```typescript
TOURNAMENT_STATUS.REGISTRATION_OPEN  // 'registration_open'
TOURNAMENT_STATUS.REGISTRATION_CLOSED // 'registration_closed'
TOURNAMENT_STATUS.LIVE_INPLAY        // 'live_inplay'
```

## Auto-Status Updater
**File**: `scripts/2025-01-auto-status-updater.sql`

The SQL functions use the correct format for each table:

### Tournament Updates
```sql
-- Updates tournaments to 'live_inplay' (not 'live')
SET status = 'live_inplay'
WHERE status NOT IN ('live_inplay', 'completed', 'cancelled')
```

### Competition Updates
```sql
-- Updates competitions to 'live' (not 'live_inplay')
SET status = 'live'
WHERE status NOT IN ('live', 'completed', 'cancelled')
```

## Common Issues

### Issue: Tournaments not showing on frontend
**Cause**: API filtering for `reg_open` but database has `registration_open`  
**Fix**: Update API filter to use long format for tournaments

### Issue: Competitions not appearing
**Cause**: API filtering for `registration_open` but database has `reg_open`  
**Fix**: Update API filter to use short format for competitions

### Issue: Auto-updater not working
**Cause**: SQL using wrong status values (`live` vs `live_inplay`)  
**Fix**: Use long format for tournament updates, short format for competition updates

## Migration History

1. **Initial Schema** (`2025-01-tournaments.sql`, `2025-01-tournament-competitions.sql`)
   - Both used short format: `reg_open`, `reg_closed`, `live`

2. **Lifecycle Update** (`2025-01-tournament-lifecycle.sql`)
   - Changed **tournaments only** to long format
   - Competitions kept short format for backward compatibility

3. **Status Updater Fix** (this update)
   - Updated auto-updater SQL to use correct format per table
   - Updated golf API to use correct format per table

## Best Practices

1. **Always check which table** you're working with before writing status filters
2. **Use constants** from `tournament-lifecycle.ts` for tournament statuses in TypeScript
3. **Test both tables** when adding new status-related features
4. **Document status values** in API comments for future developers

## Future Considerations

To unify the system, consider:
- Migrating competitions table to use long format
- Creating a single source of truth for status values
- Using enums in TypeScript for compile-time checking
- Adding database views with standardized status names
