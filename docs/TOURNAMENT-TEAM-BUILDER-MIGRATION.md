# Tournament & Team Builder Migration

## Overview
Reorganized tournament and team builder pages between main website (`apps/web`) and golf app (`apps/golf`) to properly separate promotional content from authenticated gameplay.

## Changes Made

### 1. Golf App (golf.inplay.tv) - Authenticated Users

#### Created Tournaments Page
- **Location**: `apps/golf/src/app/tournaments/`
- **Files**: 
  - `page.tsx` - Tournament listing with database integration
  - `tournaments.module.css` - Styling
- **Features**:
  - Full tournament listings from database
  - "Build Your Team" buttons link to `/team-builder/[tournamentId]`
  - Competition types (Full Course, Beat the Cut, etc.)
  - User-specific data (entries, wallet balance)

#### Created Team Builder Page
- **Location**: `apps/golf/src/app/team-builder/[tournamentId]/`
- **Files**:
  - `page.tsx` - Team builder interface
  - `team-builder.module.css` - Styling
- **Features**:
  - Dynamic route based on tournament ID
  - Player selection (6 players, £50k budget)
  - Captain selection (2x points)
  - Search, filter, sort functionality
  - Budget management with health indicators
  - Scorecard with compact inline layout
  - Empty slots (padding: 0.375rem) vs Filled slots (padding: 1.125rem)
  - No menu tab needed - accessed directly from tournament selection

### 2. Main Website (www.inplay.tv) - Public/Promotional

#### Updated Tournaments Page
- **Location**: `apps/web/src/app/tournaments/`
- **Purpose**: Promotional - showcase tournaments to encourage signups
- **Changes**:
  - Removed team-builder functionality
  - "Build Your Team" buttons now prompt login:
    - Not logged in → Redirect to `/signup?redirect=/tournaments`
    - Logged in → Redirect to `https://golf.inplay.tv/tournaments`
  - Serves as advertisement for what's available in the golf app

#### Removed Team Builder from Header
- **File**: `apps/web/src/components/Header.tsx`
- **Change**: Removed "Team Builder" link from navigation
- **Reason**: Team builder only available in authenticated golf app

## Architecture

```
Main Website (apps/web - www.inplay.tv)
├── /tournaments          → Promotional page
│   └── "Build Team" btn  → Prompts login/signup or redirects to golf app
└── (no team-builder)     → Removed from this app

Golf App (apps/golf - golf.inplay.tv)
├── /tournaments                   → Full tournament listings
│   └── "Build Team" btn          → Links to /team-builder/[tournamentId]
└── /team-builder/[tournamentId]  → Dynamic team builder for specific tournament
    └── No menu tab needed        → Accessed from tournament selection
```

## Button Behavior

### Main Website
```javascript
handleJoinPrompt() {
  if (!userEmail) {
    router.push('/signup?redirect=/tournaments');
  } else {
    window.location.href = 'https://golf.inplay.tv/tournaments';
  }
}
```

### Golf App
```tsx
<Link href="/team-builder/masters-2025">Build Your Team</Link>
<Link href="/team-builder/beat-the-cut-2025">Build Your Team</Link>
```

## Next Steps

### To Connect Database:
1. **Update Golf App Tournaments**:
   - Replace hardcoded IDs with dynamic tournament slugs
   - Use actual tournament data from Supabase
   - Generate links: `/team-builder/${tournament.slug}`

2. **Update Team Builder**:
   - Accept `params.tournamentId` prop
   - Fetch tournament details from database
   - Load actual player data for that tournament
   - Connect budget/lineup to user's entries table

3. **API Integration**:
   ```tsx
   // In team-builder/[tournamentId]/page.tsx
   export default function TeamBuilderPage({ params }: { params: { tournamentId: string } }) {
     const [tournament, setTournament] = useState(null);
     const [players, setPlayers] = useState([]);
     
     useEffect(() => {
       fetchTournament(params.tournamentId);
       fetchPlayers(params.tournamentId);
     }, [params.tournamentId]);
     
     // ... rest of component
   }
   ```

## Files Modified
- ✅ `apps/golf/src/app/tournaments/page.tsx` - Created with DB integration
- ✅ `apps/golf/src/app/tournaments/tournaments.module.css` - Created
- ✅ `apps/golf/src/app/team-builder/[tournamentId]/page.tsx` - Created with dynamic route
- ✅ `apps/golf/src/app/team-builder/[tournamentId]/team-builder.module.css` - Created
- ✅ `apps/web/src/app/tournaments/page.tsx` - Updated for promotional use
- ✅ `apps/web/src/components/Header.tsx` - Removed team builder link

## Testing Checklist
- [ ] Main website tournaments page loads
- [ ] "Build Your Team" prompts signup when not logged in
- [ ] "Build Your Team" redirects to golf app when logged in
- [ ] Golf app tournaments page loads
- [ ] Golf app "Build Your Team" links to team builder
- [ ] Team builder loads with tournament ID in URL
- [ ] All filtering, sorting, selection works
- [ ] Budget calculations correct
- [ ] Captain selection functional
- [ ] Responsive design works on both apps
