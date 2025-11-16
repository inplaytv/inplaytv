# Golf App Fixes - Navigation & Error Handling

## Issues Fixed

### 1. Missing "Tournaments" Menu Item in Golf App ✅
**Problem**: Tournaments link was not visible in the golf app navigation (port 3001).

**Solution**: 
- Updated `apps/golf/src/components/Header.tsx`
- Added "Tournaments" link between "Lobby" and "My Entries"

```tsx
<Link href="/tournaments" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
  Tournaments
</Link>
```

### 2. Added Authentication & Header to Golf Pages ✅
**Problem**: Golf app tournament and team-builder pages didn't have header navigation or authentication.

**Solution**: 
- Added `Header` component to both pages
- Wrapped pages in `RequireAuth` component
- Updated files:
  - `apps/golf/src/app/tournaments/page.tsx`
  - `apps/golf/src/app/team-builder/[tournamentId]/page.tsx`

```tsx
import Header from '@/components/Header';
import RequireAuth from '@/components/RequireAuth';

// In return statement:
<RequireAuth>
  <Header />
  <div className={styles.wrap}>
    {/* Page content */}
  </div>
</RequireAuth>
```

### 3. "Build Your Team" Button Links ✅
**Problem**: "Build Your Team" buttons on golf app tournaments page weren't linking to team builder.

**Solution**:
- Changed buttons to `<Link>` components
- Added dynamic routes for different tournaments:
  - Masters 2025 → `/team-builder/masters-2025`
  - Beat the Cut → `/team-builder/beat-the-cut-2025`

```tsx
<Link href="/team-builder/masters-2025" className={styles.btnPrimary}>
  <i className="fas fa-users"></i>
  Build Your Team
</Link>
```

### 4. JSON Parsing Error Handling ✅
**Problem**: "Failed to execute 'json' on 'Response': Unexpected end of JSON input" when fetching user data.

**Solution**: 
- Added try-catch error handling to `checkUser` function in web app tournaments page
- Wrapped `/api/user/entries` fetch in try-catch
- Silently fails if API is unavailable (not critical for page function)

```tsx
async function checkUser() {
  const { data: { user } } = await supabase.auth.getUser();
  setUserEmail(user?.email || null);
  
  if (user) {
    try {
      const res = await fetch('/api/user/entries');
      if (res.ok) {
        const data = await res.json();
        setMyEntries(data.entries || 0);
      }
    } catch (err) {
      console.error('Error fetching user entries:', err);
      // Silently fail - not critical
    }
  }
}
```

## Testing Checklist

### Golf App (localhost:3001)
- [x] Navigate to http://localhost:3001
- [x] Verify "Tournaments" link appears in header
- [x] Click "Tournaments" → Should load tournaments page with header
- [x] Click "Build Your Team" on Masters card → Should navigate to `/team-builder/masters-2025`
- [x] Verify team builder page loads with header navigation
- [x] Verify RequireAuth redirects if not logged in

### Web App (localhost:3000)
- [x] Navigate to http://localhost:3000/tournaments
- [x] Verify page loads without JSON errors in console
- [x] Click "Build Your Team" when NOT logged in → Should redirect to signup
- [x] Click "Build Your Team" when logged in → Should redirect to golf.inplay.tv

## Files Modified

1. **apps/golf/src/components/Header.tsx**
   - Added "Tournaments" navigation link

2. **apps/golf/src/app/tournaments/page.tsx**
   - Added Header and RequireAuth imports
   - Wrapped page in RequireAuth + Header
   - Changed "Build Your Team" buttons to Link components

3. **apps/golf/src/app/team-builder/[tournamentId]/page.tsx**
   - Added Header and RequireAuth imports
   - Wrapped page in RequireAuth + Header

4. **apps/web/src/app/tournaments/page.tsx**
   - Added error handling to checkUser function
   - Wrapped API fetch in try-catch

## Next Steps (Database Integration)

When connecting to database:

1. **Dynamic Tournament Routes**:
   ```tsx
   // Replace hardcoded IDs with actual tournament slugs
   <Link href={`/team-builder/${tournament.slug}`}>
     Build Your Team
   </Link>
   ```

2. **Team Builder Props**:
   ```tsx
   // Accept tournamentId from route params
   export default function TeamBuilderPage({ 
     params 
   }: { 
     params: { tournamentId: string } 
   }) {
     // Fetch tournament data
     useEffect(() => {
       fetchTournament(params.tournamentId);
       fetchPlayers(params.tournamentId);
     }, [params.tournamentId]);
   }
   ```

3. **Player Data**:
   - Replace mock data with actual golfer records from database
   - Fetch golfers assigned to tournament's golfer groups
   - Load real salaries, rankings, form data

## Architecture Summary

```
Golf App Flow (golf.inplay.tv):
├── Header (with Tournaments link)
├── /tournaments
│   ├── RequireAuth → Redirect if not logged in
│   ├── Header navigation
│   └── "Build Your Team" → /team-builder/[tournamentId]
└── /team-builder/[tournamentId]
    ├── RequireAuth → Redirect if not logged in
    ├── Header navigation
    └── Dynamic tournament-specific team builder

Web App Flow (www.inplay.tv):
└── /tournaments
    ├── Public promotional page
    └── "Build Your Team" → Login prompt or redirect to golf app
```
