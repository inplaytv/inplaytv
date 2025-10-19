# Admin Fee Moved to Competition Level

## Changes Made

### 1. Database Schema Update

**File**: `scripts/2025-01-tournament-competitions.sql`
- Added `admin_fee_percent DECIMAL(5,2)` column to `tournament_competitions` table
- Default value: `10.00`
- Constraint: Between 0 and 100
- **This allows each competition to have its own admin fee percentage**

### 2. Global Settings Table (New)

**File**: `scripts/2025-01-admin-settings.sql`
- Created new `admin_settings` table for platform-wide settings
- Key-value storage with descriptions
- RLS policies (public read, admin write)
- Default setting: `default_admin_fee_percent = 10.00`
- **This will be used to pre-populate the field when creating competitions**

### 3. UI Changes

**Tournament Edit Page** (`apps/admin/src/app/tournaments/[id]/page.tsx`):

#### Added to Competition Form:
- **Admin Fee (%)** input field
  - Type: number
  - Range: 0-100
  - Step: 0.01
  - Default: 10.00
  - Helper text: "Platform fee deducted from prize pool"
- Positioned between "Entrants Cap" and "Status"

#### Updated Prize Pool Calculator:
- Now uses competition's `admin_fee_percent` instead of tournament's
- Calculator updates in real-time when admin fee is changed
- Shows accurate prize pool for different fee percentages

#### Updated Competition Display:
- Shows admin fee percentage alongside entry fee and cap
- Display: "Admin Fee: 10%"

### 4. API Updates

**File**: `apps/admin/src/app/api/tournaments/[id]/competitions/route.ts`

Both POST and PUT endpoints now:
- Accept `admin_fee_percent` from request body
- Store in database with default 10.00 if not provided
- Parse as float for proper decimal handling

### 5. TypeScript Interface

**Updated** `TournamentCompetition` interface:
```typescript
interface TournamentCompetition {
  // ... existing fields
  admin_fee_percent: number;  // Added
  // ... rest of fields
}
```

## Migration Order

Run these SQL migrations in Supabase Dashboard in this order:

1. `2025-01-tournaments.sql` (if not already run)
2. `2025-01-competition-types.sql` (if not already run)
3. `2025-01-admin-settings.sql` (NEW - run this)
4. `2025-01-tournament-competitions.sql` (updated with admin_fee_percent column)

## Why This Change?

### Before:
- Admin fee was set at **tournament level**
- All competitions in a tournament had the same fee
- Less flexible for different competition types

### After:
- Admin fee is set at **competition level**
- Each competition can have its own fee percentage
- **Example use cases**:
  - Lower fee for beginner competitions (5%)
  - Standard fee for regular play (10%)
  - Higher fee for high-stakes competitions (15%)
  - Free/promotional competitions (0%)

## UI Flow

1. Admin clicks "Add Competition"
2. Form opens with default admin fee (10.00%)
3. Admin can change the fee for this specific competition
4. Prize pool calculator updates to show earnings with that fee
5. Different competitions in same tournament can have different fees

## Benefits

1. **Flexibility**: Different competition types can have different fee structures
2. **Transparency**: Fee is shown alongside each competition
3. **Visual Feedback**: Prize calculator shows impact of fee changes
4. **Future-Proof**: Default can be changed globally in settings without code changes
5. **Per-Competition Control**: Promotional or special events can have custom fees

## Backward Compatibility

- Default value of 10.00% ensures existing logic continues to work
- If admin fee not provided in API, defaults to 10.00
- No breaking changes to existing functionality

## Future Enhancements

Can add to Settings page:
- Global default admin fee configuration
- Minimum/maximum admin fee limits
- Fee presets (Economy: 5%, Standard: 10%, Premium: 15%)
- Historical fee tracking and analytics
