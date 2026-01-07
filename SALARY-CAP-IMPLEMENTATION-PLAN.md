# Salary Cap Implementation Plan

## Current Problem

Multiple conflicting salary caps exist across the platform:
- **competition-rules.ts**: £50,000 (5,000,000 pennies)
- **InPlay team builder**: £600 (60,000 pennies)
- **Clubhouse team builder**: £600 (60,000 pennies)

## Industry Standard Salary Cap Systems

### 1. **DraftKings / FanDuel Model** ⭐ RECOMMENDED
- **Fixed cap**: All users get the same budget (e.g., $50,000)
- **Dynamic pricing**: Player salaries adjust based on projected performance
- **Benefits**:
  - Simple for users to understand
  - Creates strategic choices (stars vs value picks)
  - Easy to enforce and validate

### 2. **ESPN Fantasy Model**
- **Auction draft**: Users bid on players with limited budget
- **Fixed roster**: No salary changes during season
- **Better for**: Season-long leagues, not single-tournament

### 3. **Yahoo Fantasy Model**  
- **No salary cap**: Uses waiver wire / draft order
- **Better for**: Long-term leagues, not single-tournament

## Recommended Implementation: **DraftKings Model**

### Why DraftKings Model?
1. **Industry standard** for daily fantasy sports
2. **Tournament-friendly**: Perfect for single-event contests
3. **Strategic depth**: Forces tough decisions between expensive stars vs value picks
4. **User familiarity**: Most fantasy players know this system
5. **Easy validation**: Simple math check (total ≤ cap)

## Proposed Solution

### Single Source of Truth
Create **`@inplaytv/salary-cap-config`** package with:

```typescript
// packages/salary-cap-config/src/index.ts
export const SALARY_CAP = {
  // Main salary cap (in pennies for precision)
  TOTAL_PENNIES: 6000000,  // £60,000
  
  // Display values
  DISPLAY_CURRENCY: 'GBP',
  DISPLAY_SYMBOL: '£',
  
  // Team composition
  LINEUP_SIZE: 6,
  REQUIRE_CAPTAIN: true,
  CAPTAIN_MULTIPLIER: 1.5,
  
  // Validation thresholds
  MAX_PLAYER_COST_PERCENT: 0.30,  // No player > 30% of cap
  MIN_REMAINING_BUDGET: 100,       // Must have £1+ left
  
  // Salary tiers (for UI filtering)
  TIERS: {
    PREMIUM: { min: 14000, label: 'Premium (£140+)' },
    MID: { min: 9000, max: 13999, label: 'Mid-Range (£90-139)' },
    VALUE: { max: 8999, label: 'Value (< £90)' },
  },
} as const;

// Helper functions
export const formatSalary = (pennies: number): string => {
  const pounds = pennies / 100;
  return `£${pounds.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export const validateLineup = (golfers: { salary: number }[]): {
  valid: boolean;
  totalSalary: number;
  remaining: number;
  errors: string[];
} => {
  const totalSalary = golfers.reduce((sum, g) => sum + g.salary, 0);
  const remaining = SALARY_CAP.TOTAL_PENNIES - totalSalary;
  const errors: string[] = [];
  
  if (golfers.length !== SALARY_CAP.LINEUP_SIZE) {
    errors.push(`Must select ${SALARY_CAP.LINEUP_SIZE} golfers`);
  }
  
  if (totalSalary > SALARY_CAP.TOTAL_PENNIES) {
    errors.push(`Total salary (${formatSalary(totalSalary)}) exceeds cap (${formatSalary(SALARY_CAP.TOTAL_PENNIES)})`);
  }
  
  // Check for individual golfer exceeding max
  const maxAllowed = SALARY_CAP.TOTAL_PENNIES * SALARY_CAP.MAX_PLAYER_COST_PERCENT;
  golfers.forEach(g => {
    if (g.salary > maxAllowed) {
      errors.push(`Player cost (${formatSalary(g.salary)}) exceeds ${SALARY_CAP.MAX_PLAYER_COST_PERCENT * 100}% of cap`);
    }
  });
  
  return {
    valid: errors.length === 0,
    totalSalary,
    remaining,
    errors,
  };
};
```

## Implementation Steps

### 1. Create Salary Cap Package ✅
```bash
mkdir -p packages/salary-cap-config/src
# Create package.json, tsconfig.json, index.ts
```

### 2. Update competition-rules.ts
Replace hardcoded values with imports from package:
```typescript
import { SALARY_CAP } from '@inplaytv/salary-cap-config';

export const LINEUP_RULES = {
  SALARY_CAP_PENNIES: SALARY_CAP.TOTAL_PENNIES,
  LINEUP_SIZE: SALARY_CAP.LINEUP_SIZE,
  // ...
};
```

### 3. Update InPlay Team Builder
```typescript
// apps/golf/src/app/build-team/[competitionId]/page.tsx
import { SALARY_CAP, validateLineup, formatSalary } from '@inplaytv/salary-cap-config';

const [totalBudget] = useState(SALARY_CAP.TOTAL_PENNIES);

// Use validateLineup() before submission
const validation = validateLineup(lineup.map(slot => ({ salary: slot.golfer?.salary || 0 })));
if (!validation.valid) {
  setError(validation.errors.join('. '));
  return;
}
```

### 4. Update Clubhouse Team Builder
```typescript
// apps/golf/src/app/clubhouse/build-team/[eventId]/page.tsx
import { SALARY_CAP, validateLineup, formatSalary } from '@inplaytv/salary-cap-config';

const [totalBudget] = useState(SALARY_CAP.TOTAL_PENNIES);
// Same validation logic as InPlay
```

### 5. Backend Validation
```typescript
// apps/golf/src/app/api/competitions/[id]/entries/route.ts
import { SALARY_CAP, validateLineup } from '@inplaytv/salary-cap-config';

// Validate on server side (CRITICAL - don't trust client)
const validation = validateLineup(picks.map(p => ({ salary: p.salary })));
if (!validation.valid) {
  return NextResponse.json({ error: validation.errors[0] }, { status: 400 });
}
```

### 6. Database Schema Update
```sql
-- Add salary cap validation at database level
ALTER TABLE competition_entries 
  ADD CONSTRAINT total_salary_within_cap 
  CHECK (total_salary <= 6000000);  -- £60,000 in pennies

-- Add index for salary lookups
CREATE INDEX idx_competition_entries_total_salary 
  ON competition_entries(total_salary);
```

## UI Enhancements

### Budget Display Component
```typescript
// components/SalaryCapDisplay.tsx
<div className={styles.salaryCapBar}>
  <div className={styles.used} style={{ width: `${usedPercent}%` }}>
    {formatSalary(usedBudget)}
  </div>
  <div className={styles.remaining}>
    {formatSalary(remaining)} left
  </div>
</div>
```

### Salary Tier Badges
```typescript
// Show tier badges on golfer cards
const getTier = (salary: number) => {
  if (salary >= SALARY_CAP.TIERS.PREMIUM.min) return 'premium';
  if (salary >= SALARY_CAP.TIERS.MID.min) return 'mid';
  return 'value';
};
```

### Smart Suggestions
```typescript
// Suggest affordable golfers when budget is low
const affordableGolfers = availableGolfers.filter(
  g => g.salary <= remaining && !isSelected(g.id)
);
```

## Testing Checklist

- [ ] Create salary-cap-config package
- [ ] Update competition-rules.ts
- [ ] Update InPlay team builder
- [ ] Update Clubhouse team builder
- [ ] Add backend validation
- [ ] Update database constraints
- [ ] Test edge cases:
  - [ ] Selecting 6 golfers under cap
  - [ ] Exceeding cap by £1
  - [ ] Selecting one golfer over 30% of cap
  - [ ] Edit mode preserves validation
- [ ] Test both InPlay and Clubhouse flows
- [ ] Verify API endpoints reject over-cap submissions

## Rollout Plan

### Phase 1: Infrastructure (Day 1)
- Create salary-cap-config package
- Update imports in all team builders
- Deploy to staging

### Phase 2: Validation (Day 2)
- Add backend validation
- Add database constraints
- Test with real data

### Phase 3: UI Polish (Day 3)
- Add budget display components
- Add tier badges
- Add smart suggestions

### Phase 4: Production (Day 4)
- Deploy to production
- Monitor for issues
- Adjust cap if needed

## Future Enhancements

1. **Dynamic Salary Adjustments**
   - Increase salary for hot players
   - Decrease for poor performance
   
2. **Multiple Salary Caps**
   - Different caps for different competition types
   - Premium tournaments with higher caps
   
3. **Ownership Limits**
   - Prevent everyone picking same golfer
   - Add roster diversity bonuses

4. **Salary History**
   - Track salary changes over time
   - Show golfer value trends

## Benefits of This Approach

✅ **Single source of truth** - No more conflicts  
✅ **Type-safe** - TypeScript ensures correctness  
✅ **Reusable** - Both systems use same logic  
✅ **Industry standard** - DraftKings model proven at scale  
✅ **Easy to change** - Update one file, changes everywhere  
✅ **Validated** - Both client and server-side checks  
✅ **User-friendly** - Familiar to fantasy sports players  

## Current Values

**Recommended:** £60,000 (6,000,000 pennies)

**Why £60k?**
- Forces strategic decisions
- Prevents picking all stars
- Allows 2-3 premium picks + value selections
- Matches current team builder implementation
- Room for salary inflation over time

**Alternative options:**
- £50,000 - More restrictive, harder lineups
- £75,000 - More flexible, easier to field strong teams
- £100,000 - Very flexible, less strategic depth

---

**Ready to implement?** Let me know and I'll create the package and update all files!
