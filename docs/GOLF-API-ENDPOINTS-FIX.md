# Golf App API Endpoints Fix

## Issue
Golf app tournaments page was showing:
```
Error Loading Tournaments
HTTP error! status: 404
```

## Root Cause
The golf app was trying to fetch from `/api/tournaments` and `/api/user/entries` but these endpoints didn't exist in the golf app - they only existed in the web app.

## Solution
Created the missing API endpoints in the golf app.

### Files Created

1. **`apps/golf/src/app/api/tournaments/route.ts`**
   - Fetches active tournaments from Supabase
   - Includes competition data with competition types
   - Returns structured tournament data with competitions array

2. **`apps/golf/src/app/api/user/entries/route.ts`**
   - Fetches user's competition entries count
   - Returns 0 if user not authenticated
   - Handles errors gracefully

## API Endpoints

### GET /api/tournaments
**Query Params:**
- `status` (optional) - Filter by tournament status (default: 'active')

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Masters Tournament 2025",
    "slug": "masters-2025",
    "description": "...",
    "location": "Augusta National Golf Club",
    "start_date": "2025-04-10",
    "end_date": "2025-04-13",
    "status": "active",
    "image_url": "https://...",
    "competitions": [
      {
        "id": "uuid",
        "entry_fee_pennies": 2500,
        "entrants_cap": 10000,
        "admin_fee_percent": 10,
        "status": "reg_open",
        "competition_types": {
          "id": "uuid",
          "name": "Full Course",
          "slug": "full-course",
          "description": "..."
        }
      }
    ]
  }
]
```

### GET /api/user/entries
**Authentication:** Required (uses Supabase auth)

**Response:**
```json
{
  "entries": 5
}
```

## Testing
1. Navigate to http://localhost:3001/tournaments
2. Page should load without 404 errors
3. Tournaments should display if data exists in database
4. User entries count should show in header stats

## Database Tables Used
- `tournaments` - Tournament master data
- `tournament_competitions` - Competitions within tournaments
- `competition_types` - Competition type metadata
- `competition_entries` - User's team entries

## Next Steps
If tournaments still don't show:
1. Check if tournaments exist in database with `status = 'active'`
2. Check if competitions are linked to tournaments
3. Verify Supabase environment variables are set correctly in golf app:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
