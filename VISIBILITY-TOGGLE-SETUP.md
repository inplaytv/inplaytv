# Tournament Visibility Toggle Setup

## Overview
The visibility toggle feature allows admins to show/hide tournaments on the golf app without deleting them. This is useful for:
- Draft tournaments that aren't ready for public viewing
- Testing tournament setup before launch
- Temporarily hiding tournaments

## Current Status

✅ **Tournaments are displaying now** - The code has been updated to work without the migration
⚠️ **Visibility toggle will only work after running the migration below**

## Database Migration (Optional but Recommended)

**The visibility toggle feature requires this migration to work.**

Without the migration:
- ✅ All tournaments display in admin and golf app
- ❌ Visibility toggle button won't work
- ❌ Can't hide tournaments from public view

After the migration:
- ✅ All tournaments display in admin and golf app
- ✅ Visibility toggle button works
- ✅ Can hide tournaments from public view

### Steps to Run Migration:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `qemosikbhrnstcormhuz`

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Run Migration**
   - Open the file: `scripts/2025-11-add-tournament-visibility.sql`
   - Copy all contents
   - Paste into Supabase SQL Editor
   - Click "Run" button

4. **Verify Results**
   - The query will show you all tournaments with their new `is_visible` status
   - All existing tournaments will be set to `visible: true` by default

## Features Implemented

### Admin Panel (`/tournaments`)
- **Visibility Column**: New first column shows eye icon (👁️) for visible tournaments
- **Toggle Button**: Click the eye icon to show/hide tournament on golf app
- **Visual Indicator**: Hidden tournaments appear at 50% opacity
- **Hover Text**: Tooltips explain "Hide from golf app" or "Show on golf app"

### Golf App (`/tournaments`)
- **Automatic Filtering**: Only visible tournaments appear on the public tournaments page
- **No Visual Change**: Users don't see any indication that tournaments are hidden

### AI Tournament Creator
- **Default Visibility**: All AI-generated tournaments are visible by default
- **Can be toggled**: After creation, admins can hide tournaments if needed

## API Endpoints

### PATCH `/api/tournaments/[id]`
- **Purpose**: Toggle visibility
- **Body**: `{ "is_visible": boolean }`
- **Response**: Updated tournament object
- **Example**:
  ```javascript
  fetch('/api/tournaments/533b00b9-5c53-4cf5-a37b-085225d27a27', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_visible: false })
  })
  ```

### GET `/api/tournaments` (Golf App)
- **Filter**: `.eq('is_visible', true)`
- **Only returns visible tournaments to public**

## Testing Steps

After running the migration, test the feature:

1. **View Admin Tournament List**
   - Go to: http://localhost:3002/tournaments
   - Verify all tournaments show eye icon (👁️)
   - All should be visible (green eye) by default

2. **Hide a Tournament**
   - Click the eye icon on any tournament
   - Row should fade to 50% opacity
   - Eye icon should change appearance

3. **Check Golf App**
   - Go to: http://localhost:3001/tournaments
   - Verify the hidden tournament doesn't appear
   - Other tournaments should still show

4. **Re-show Tournament**
   - Go back to admin: http://localhost:3002/tournaments
   - Click the eye icon again
   - Row should return to full opacity

5. **Check Golf App Again**
   - Go to: http://localhost:3001/tournaments
   - Tournament should now appear again

## Database Schema

```sql
-- New column added to tournaments table
is_visible BOOLEAN NOT NULL DEFAULT true

-- Index for efficient filtering
CREATE INDEX idx_tournaments_visible ON public.tournaments(is_visible);
```

## Files Changed

### Frontend
- `apps/admin/src/app/tournaments/page.tsx` - Added is_visible to query
- `apps/admin/src/app/tournaments/TournamentsList.tsx` - Added toggle UI
- `apps/golf/src/app/api/tournaments/route.ts` - Added visibility filter

### Backend
- `apps/admin/src/app/api/tournaments/[id]/route.ts` - Added PATCH method
- `apps/admin/src/app/api/ai/create-tournament/route.ts` - Sets is_visible=true

### Database
- `scripts/2025-11-add-tournament-visibility.sql` - Migration script

## Troubleshooting

### Error: "column 'is_visible' does not exist"
- **Cause**: Migration not run yet
- **Solution**: Follow migration steps above

### Tournament not appearing on golf app
- **Check 1**: Is `is_visible` set to `true`? Toggle it in admin
- **Check 2**: Run this in Supabase SQL Editor:
  ```sql
  SELECT id, name, is_visible FROM tournaments WHERE slug = 'tournament-slug';
  ```

### Visibility toggle not working
- **Check 1**: Browser console for API errors
- **Check 2**: Verify PATCH endpoint responds with 200
- **Check 3**: Refresh admin page to see updated state

## Future Enhancements

Potential improvements to consider:
- Bulk show/hide multiple tournaments
- Schedule visibility (auto-show at specific date/time)
- Visibility history/audit log
- Tournament visibility status in dashboard stats
- Filter tournaments by visibility status
