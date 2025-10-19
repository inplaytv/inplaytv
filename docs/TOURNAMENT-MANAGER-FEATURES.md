# Tournament Manager - Feature Summary

## Overview
Complete tournament management system for the Admin app with auto-calculated registration close times.

## Database Structure

### Three Core Tables
1. **`tournaments`** - Main tournament events
   - Location, dates, timezone, admin fee
   - Status tracking (draft → upcoming → live → completed)
   
2. **`competition_types`** - Reusable competition templates
   - Master list (e.g., "Full Course", "Round 1", "Round 2")
   - Used across multiple tournaments
   
3. **`tournament_competitions`** - Active competition instances
   - Links tournaments to competition types
   - Instance-specific: entry fees, caps, registration dates
   - **Auto-calculated `reg_close_at`**: 15 minutes before `start_at`

## Key Features

### 1. Auto-Registration Close Logic
**Database Trigger:**
- When `start_at` is set and `reg_close_at` is NULL
- Automatically sets `reg_close_at = start_at - 15 minutes`
- Runs on INSERT and UPDATE operations

**UI Behavior:**
- Pre-populates `reg_close_at` when admin sets `start_at`
- Shows warning when admin clicks the field
- Visual indicators:
  - Normal state: Grey background, "Auto-calculated from Competition Start time"
  - Manual override: Orange background, "⚠️ Manual override active"
- Warning message on focus (first click):
  > "⚠️ This field is auto-generated to be 15 minutes before the competition start time. Only change this if the competition starts early or you need a different registration close time."

### 2. Timezone Dropdown
- Replaced text input with proper timezone selector
- 17 common timezones across Europe, Americas, Asia, Pacific
- IANA timezone identifiers (e.g., "Europe/London", "America/New_York")
- Default: `Europe/London`

### 3. Tournament Manager Pages

**Tournaments List** (`/tournaments`)
- View all tournaments with status badges
- Columns: Title, Location, Status, Start, End, Updated
- Quick actions: Edit, View

**Create Tournament** (`/tournaments/new`)
- Basic info: Name, slug, description, location
- Timezone dropdown
- Dates: Start, End (with validation)
- Settings: Status, admin fee percentage
- Optional: External ID, image URL

**Edit Tournament** (`/tournaments/[id]`)
- Update tournament details
- Manage competition instances
- Add/Edit/Delete competitions
- Prize pool calculator (shows examples at 50, 100, 200 entrants)

**Active Competitions** (`/competitions`)
- List ALL competition instances across all tournaments
- Joined view with tournament names and competition types
- Shows: Entry fee, cap, status, registration windows
- Quick link to parent tournament

**Competition Types** (`/competition-types`)
- Master list of reusable competition templates
- Create/Edit/Delete competition type templates

## API Routes

### Tournaments
- `GET /api/tournaments` - List all tournaments
- `POST /api/tournaments` - Create tournament
- `GET /api/tournaments/[id]` - Get single tournament
- `PUT /api/tournaments/[id]` - Update tournament
- `DELETE /api/tournaments/[id]` - Delete tournament

### Competition Types
- `GET /api/competition-types` - List all types
- `POST /api/competition-types` - Create type
- `PUT /api/competition-types/[id]` - Update type
- `DELETE /api/competition-types/[id]` - Delete type

### Tournament Competitions
- `GET /api/tournaments/[id]/competitions` - List tournament's competitions
- `POST /api/tournaments/[id]/competitions` - Add competition to tournament
- `PUT /api/tournaments/[id]/competitions?competitionId=X` - Update competition
- `DELETE /api/tournaments/[id]/competitions?competitionId=X` - Remove competition

## SQL Migrations

Run these in order in Supabase Dashboard:

1. **`scripts/2025-01-tournaments.sql`**
   - Creates tournaments table
   - RLS policies (public read, admin write)
   
2. **`scripts/2025-01-competition-types.sql`**
   - Creates competition_types table
   - RLS policies
   
3. **`scripts/2025-01-tournament-competitions.sql`**
   - Creates tournament_competitions junction table
   - **Auto-close trigger function** (`auto_set_reg_close_at()`)
   - RLS policies
   - Unique constraint: one competition type per tournament

## Status Flow

Both tournaments and competitions use status tracking:
- `draft` - Being set up
- `upcoming` - Scheduled, not yet open
- `reg_open` - Registration is open
- `reg_close` - Registration closed, not yet started
- `live` - Currently happening
- `completed` - Finished
- `cancelled` - Cancelled

## Security

- All routes protected with `assertAdminOrRedirect()`
- RLS policies on all tables
- Public can read, only admins can write
- Admin verification via `public.admins` table join

## Navigation

**Admin Sidebar → Tournaments Section:**
- All Tournaments
- Create Tournament
- Active Competitions
- Competition Types

## Files Modified/Created

### Created:
- `apps/admin/src/app/tournaments/page.tsx`
- `apps/admin/src/app/tournaments/new/page.tsx`
- `apps/admin/src/app/tournaments/[id]/page.tsx`
- `apps/admin/src/app/competitions/page.tsx`
- `apps/admin/src/app/competition-types/page.tsx`
- `apps/admin/src/app/api/tournaments/route.ts`
- `apps/admin/src/app/api/tournaments/[id]/route.ts`
- `apps/admin/src/app/api/tournaments/[id]/competitions/route.ts`
- `apps/admin/src/app/api/competition-types/route.ts`
- `apps/admin/src/app/api/competition-types/[id]/route.ts`
- `apps/admin/src/lib/timezones.ts`
- `scripts/2025-01-tournaments.sql`
- `scripts/2025-01-competition-types.sql`
- `scripts/2025-01-tournament-competitions.sql`

### Modified:
- `apps/admin/src/components/Sidebar.tsx` (added Tournaments section)

## Next Steps

1. **Run SQL Migrations** in Supabase Dashboard (in order)
2. **Test the feature** in the Admin app
3. **Add tournament images** (optional)
4. **Create initial competition types** (Full Course, Round 1-4, etc.)
5. **Build first tournament** with competitions

## Notes

- Entry fees stored in pennies (multiply by 100 from pounds)
- `entrants_cap = 0` means unlimited entrants
- Admin fee is a percentage (e.g., 10.00 = 10%)
- All timestamps stored as TIMESTAMPTZ
- British English spelling throughout
- Inline styles maintained for consistency
