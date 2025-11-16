# Tournament Display System Implementation

## Overview
Implemented a comprehensive tournament and competition management system with:
1. Admin-controlled featured competitions (top 2 slots)
2. Upcoming tournaments display (coming soon)
3. Active tournament with all its competitions
4. Tournament detail page showing competition list

## Database Changes

### Schema Update
```sql
-- File: scripts/2025-01-featured-competitions.sql

ALTER TABLE tournament_competitions 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_order INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS featured_message TEXT DEFAULT NULL;
```

**New Columns:**
- `is_featured` - Boolean flag for featured status
- `featured_order` - Display order (1 = top, 2 = second)
- `featured_message` - Optional promotional message ("Only 50 spots left!")

## Admin Panel Changes

### 1. New Page: Featured Competitions Manager
**File:** `apps/admin/src/app/featured-competitions/page.tsx`

**Features:**
- View all currently featured competitions
- Add/remove competitions from featured list
- Reorder featured competitions (↑ ↓ buttons)
- Set custom featured messages per competition
- Real-time preview of featured order

**Access:** Admin Sidebar → Tournaments → Featured Competitions

### 2. API Endpoint: Featured Competitions
**File:** `apps/admin/src/app/api/featured-competitions/route.ts`

**Endpoints:**
- `GET /api/featured-competitions` - List all competitions with featured status
- `PUT /api/featured-competitions` - Update featured status/order/message

**Request Body (PUT):**
```json
{
  "competition_id": "uuid",
  "is_featured": true,
  "featured_order": 1,
  "featured_message": "Only 50 spots left!"
}
```

### 3. Sidebar Update
**File:** `apps/admin/src/components/Sidebar.tsx`

Added "Featured Competitions" link in Tournaments section.

## Golf App Changes

### 1. Updated Tournaments API
**File:** `apps/golf/src/app/api/tournaments/route.ts`

**New Response Structure:**
```json
{
  "tournaments": [
    {
      "id": "uuid",
      "name": "Masters Tournament 2025",
      "status": "active",
      "competitions": [...]
    }
  ],
  "featured": [
    {
      "id": "uuid",
      "is_featured": true,
      "featured_order": 1,
      "featured_message": "Almost full!",
      "competition_types": {...},
      "tournaments": {...}
    }
  ]
}
```

**Query Parameters:**
- `?view=featured` - Returns only featured competitions
- `?view=all` - Returns full structure (default)

### 2. Tournaments Page Structure
**File:** `apps/golf/src/app/tournaments/page.tsx`

**Needs Update To:**

```
┌─────────────────────────────────────────┐
│     TOURNAMENT SELECTION PAGE           │
├─────────────────────────────────────────┤
│                                         │
│  ┌────────────────┐  ┌────────────────┐│
│  │ FEATURED #1    │  │ FEATURED #2    ││
│  │ (from database)│  │ (from database)││
│  │ - Admin selected│  │ - Admin selected││
│  │ - Custom message│  │ - Custom message││
│  │ [Build Team] btn│  │ [Build Team] btn││
│  └────────────────┘  └────────────────┘│
│                                         │
├─────────────────────────────────────────┤
│  UPCOMING TOURNAMENTS                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ Coming   │ │ Coming   │ │ Active   ││
│  │ Soon     │ │ Soon     │ │ [VIEW]   ││
│  │ (greyed) │ │ (greyed) │ │ (green)  ││
│  └──────────┘ └──────────┘ └──────────┘│
└─────────────────────────────────────────┘
```

## Tournament Status Logic

### Tournament Display Rules:

1. **Featured Competitions (Top 2)**
   - Admin manually selects via Featured Competitions page
   - Can be from any active tournament
   - Shows custom featured_message if set
   - Order determined by featured_order (1, 2)
   - Links to `/team-builder/[tournamentId]`

2. **Upcoming Tournaments**
   - Shows all tournaments with `status = 'active'`
   - Display logic:
     - **Coming Soon**: `start_date > today` (greyed out, no button)
     - **Active**: `start_date <= today AND end_date >= today` (green VIEW button)
     - **Completed**: Don't show on this page

3. **Tournament Detail Page** (NEW - needs creation)
   - URL: `/tournaments/[slug]`
   - Shows all competitions for that specific tournament
   - Each competition displayed like featured cards
   - "Build Your Team" links to `/team-builder/[competitionId]`

## User Flow

### Homepage → Tournaments Page
```
1. User sees 2 featured competitions (admin selected)
   ↓
2. User can click "Build Your Team" on featured
   → Goes to team builder for that competition

3. User scrolls to see all tournaments
   ↓
4. Sees "Coming Soon" (greyed) or "VIEW" (green) buttons
   ↓
5. Clicks green "VIEW" on active tournament
   → Goes to tournament detail page

6. Tournament detail shows all competitions for that tournament
   ↓
7. User selects competition → Build Your Team
   → Goes to team builder
```

## Next Implementation Steps

### Step 1: Run Database Migration
```sql
-- Run this in Supabase SQL Editor
-- File: scripts/2025-01-featured-competitions.sql
```

### Step 2: Configure Featured Competitions
1. Go to admin panel → Featured Competitions
2. Select 2 competitions to feature
3. Set featured_order (1, 2)
4. Optionally add featured_message

### Step 3: Update Golf App Tournaments Page
- Fetch from updated API
- Display top 2 featured from `response.featured`
- Show upcoming tournaments from `response.tournaments`
- Add status-based button logic (Coming Soon vs VIEW)

### Step 4: Create Tournament Detail Page
**File:** `apps/golf/src/app/tournaments/[slug]/page.tsx`

Show all competitions for a specific tournament.

### Step 5: Update Team Builder Route
Change from `/team-builder/[tournamentId]` to `/team-builder/[competitionId]`
- More specific - each competition has different rules
- Allows same tournament to have multiple competition types

## Testing Checklist

- [ ] Run database migration
- [ ] Admin can access Featured Competitions page
- [ ] Admin can mark competitions as featured (order 1, 2)
- [ ] Admin can set featured messages
- [ ] Golf app fetches featured competitions
- [ ] Golf app displays featured at top
- [ ] Golf app shows upcoming tournaments below
- [ ] Coming Soon tournaments are greyed out
- [ ] Active tournaments have green VIEW button
- [ ] VIEW button opens tournament detail page
- [ ] Tournament detail shows all competitions
- [ ] Build Your Team links work correctly

## Files Modified

**Database:**
- `scripts/2025-01-featured-competitions.sql` ✅

**Admin App:**
- `apps/admin/src/app/featured-competitions/page.tsx` ✅
- `apps/admin/src/app/api/featured-competitions/route.ts` ✅
- `apps/admin/src/components/Sidebar.tsx` ✅

**Golf App:**
- `apps/golf/src/app/api/tournaments/route.ts` ✅
- `apps/golf/src/app/tournaments/page.tsx` ⏳ (needs update)
- `apps/golf/src/app/tournaments/[slug]/page.tsx` ⏳ (needs creation)
- `apps/golf/src/app/team-builder/[competitionId]/page.tsx` ⏳ (needs update)

## API Reference

### Admin API
```
GET  /api/featured-competitions - List all with featured status
PUT  /api/featured-competitions - Update featured settings
```

### Golf App API  
```
GET /api/tournaments?view=all      - Full tournament list + featured
GET /api/tournaments?view=featured - Only featured competitions
```
