# LPGA Integration Plan

## Current State
- GOLFDATA page built with DataGolf API integration
- Supports PGA, DP World Tour (Euro), Korn Ferry Tour (KFT), LIV Golf (alt)
- Architecture allows for multiple data sources

## Future LPGA Integration

### Data Source Options
Since DataGolf doesn't include LPGA, potential alternatives:
1. **LPGA Official API** (if available)
2. **Golf Channel API**
3. **ESPN Golf API**
4. **Manual data entry via admin dashboard**
5. **Third-party golf data providers**

### Architecture Changes Needed

#### 1. Database Schema
**No changes required** - Current schema is tour-agnostic:
- `tournaments` table already has `tour` field
- Simply add `tour = 'lpga'` when creating LPGA tournaments
- All scoring/stats tables work the same way

#### 2. API Layer - Add Data Source Abstraction
Create `packages/data-service/` to wrap multiple providers:

```typescript
// packages/data-service/src/providers/interface.ts
export interface GolfDataProvider {
  getRankings(): Promise<PlayerRanking[]>;
  getSkillRatings(): Promise<SkillRating[]>;
  getTournamentScores(tournamentId: string, tour: string): Promise<Scores[]>;
  getFieldUpdates(tour: string): Promise<FieldUpdate[]>;
}

// packages/data-service/src/providers/datagolf.ts
export class DataGolfProvider implements GolfDataProvider {
  // Current implementation
}

// packages/data-service/src/providers/lpga.ts
export class LPGAProvider implements GolfDataProvider {
  // Future LPGA implementation
}

// packages/data-service/src/index.ts
export class GolfDataService {
  private providers: Map<string, GolfDataProvider>;
  
  getProvider(tour: string): GolfDataProvider {
    if (tour === 'lpga') return this.providers.get('lpga');
    return this.providers.get('datagolf'); // PGA, Euro, KFT, LIV
  }
}
```

#### 3. GOLFDATA Page Updates

**Current Code** (already flexible):
```typescript
// apps/golf/src/app/golfdata/page.tsx
// Filter by tour when needed
const filteredRankings = rankings.filter(p => 
  selectedTour === 'all' || p.primary_tour === selectedTour
);
```

**Add Tour Selector**:
```tsx
<select value={selectedTour} onChange={(e) => setSelectedTour(e.target.value)}>
  <option value="all">All Tours</option>
  <option value="pga">PGA Tour</option>
  <option value="euro">DP World Tour</option>
  <option value="lpga">LPGA</option>
  <option value="kft">Korn Ferry</option>
  <option value="liv">LIV Golf</option>
</select>
```

#### 4. API Endpoints Enhancement

**Current**: `/api/golfdata/rankings` → DataGolf only

**Future**: Add tour parameter
```typescript
// apps/golf/src/app/api/golfdata/rankings/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tour = searchParams.get('tour') || 'pga';
  
  const dataService = new GolfDataService();
  const provider = dataService.getProvider(tour);
  
  const rankings = await provider.getRankings();
  return NextResponse.json({ rankings });
}
```

#### 5. Environment Variables
Add LPGA API credentials:
```bash
# .env.local
DATAGOLF_API_KEY=ac7793fb...          # Existing
LPGA_API_KEY=xxx                       # Future
LPGA_API_BASE_URL=https://api.lpga.com # Future
```

### Implementation Phases

#### Phase 1: Prep Current System (DONE ✅)
- ✅ Generic tour field in database
- ✅ Tour-agnostic scoring service
- ✅ Dynamic tour selection in scoring sync

#### Phase 2: Add Provider Abstraction (Future)
- Create `GolfDataProvider` interface
- Refactor DataGolf code into provider pattern
- Update API routes to use provider factory

#### Phase 3: LPGA Provider Implementation (Future)
- Research LPGA data source options
- Implement `LPGAProvider` class
- Add LPGA-specific field mappings
- Test with sample LPGA tournament

#### Phase 4: UI Updates (Future)
- Add tour filter to GOLFDATA page
- Show LPGA rankings separately or merged
- Add LPGA-specific stats (if different from PGA)
- Update navigation/branding

### Migration Strategy

**Backward Compatibility**:
- All existing PGA/Euro/KFT functionality continues to work
- LPGA added as separate tour, doesn't affect existing data
- Default to DataGolf provider if tour not specified

**Testing Plan**:
1. Create test LPGA tournament in database
2. Manually add LPGA scores via admin dashboard
3. Verify scoring dashboard works with LPGA tour
4. Test leaderboards with mixed PGA/LPGA tournaments
5. Once LPGA API found, test provider integration

### Code Organization

```
packages/
  data-service/              # NEW package
    src/
      providers/
        interface.ts          # GolfDataProvider interface
        datagolf.ts          # Existing DataGolf implementation
        lpga.ts              # Future LPGA implementation
        manual.ts            # Manual data entry provider
      factory.ts             # Provider factory
      index.ts
    package.json

apps/
  golf/
    src/
      app/
        api/
          golfdata/
            rankings/
              route.ts       # Update to use provider factory
            skills/
              route.ts       # Update to use provider factory
  
  admin/
    src/
      app/
        tournaments/
          [id]/
            scoring/
              page.tsx       # Already tour-agnostic ✅
```

### Notes for Development
- Keep DataGolf integration as primary source for PGA/Euro/KFT
- LPGA will be additive, not replacing anything
- Consider manual data entry as fallback for any tour
- Admin dashboard already supports manual score entry
- Tour field is already dynamic in database schema

### Questions to Research
1. Does LPGA have an official API?
2. What data format does LPGA provide?
3. Do we need real-time LPGA scoring or delayed is OK?
4. Should LPGA rankings be separate or integrated with PGA rankings?
5. Are LPGA stats calculated the same way (SG categories)?

---

**Current Status**: System architecture is ready for multi-source integration. LPGA can be added without breaking existing functionality.
