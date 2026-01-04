# Clubhouse Smart Salary System

## Overview

Advanced salary calculation for Clubhouse events using a weighted formula based on player ranking and recent form.

## Formula

```
Player Value Score (PVS) = (Rank Score × 0.6) + (Form Score × 0.4)
Salary = Base Price + (Sigmoid(PVS) × Scaling Factor)
```

### Components

**Rank Score (60% weight)**
- Uses OWGR (Official World Golf Ranking) from DataGolf
- Logarithmic scale: #1 player gets 100 points, #150 gets ~1 point
- Prevents random "one-week wonders" from being overpriced

**Form Score (40% weight)**
- Based on average finish in last 5 tournaments OR strokes gained
- Win = 100pts, Top 10 = 80pts, Made Cut = 40pts
- Captures the "hot hand" effect crucial in golf

**Sigmoid Distribution (S-curve)**
- Creates larger price gaps at the top (#1 vs #10)
- Smaller gaps at the bottom (#100 vs #110)
- Ensures strategic "stars and scrubs" team building

## Budget & Constraints

| Parameter | Value |
|-----------|-------|
| Total Budget | £600.00 |
| Team Size | 6 players |
| Average Cost | £100.00 per player |
| **Floor** | £60.00 (minimum) |
| **Ceiling** | £135.00 (maximum) |

## Target Price Ranges

| Tier | Range | Target Players |
|------|-------|---------------|
| **Elite** | £115 - £135 | Top 5 OWGR |
| **Mid-Tier** | £90 - £115 | Solid starters |
| **Value/Sleepers** | £65 - £85 | Budget picks |

## Why This Works

### Prevents "All-Stars" Teams
- Even with 20 players, cheapest costs ~£70
- Can't pick all top players and stay under budget

### Strategic Depth
- Typical team: 2 elite + 2 mid + 2 value = £600
- Forces tradeoffs: elite captain OR balanced squad?

### Relative Pricing
- Automatically adjusts to field size
- Small fields (20 players) still have proper spread
- Large fields (150 players) maintain tier separation

## Usage

### Run Calculator (Preview)
```powershell
# From project root
.\scripts\clubhouse\run-salary-calculator.ps1

# For specific event
.\scripts\clubhouse\run-salary-calculator.ps1 <event-id>
```

### Apply to Database
The script will show calculated salaries and prompt:
```
💾 Apply these salaries to database? (y/n)
```

Type `y` to update `golfers.salary_pennies` for all players.

## Current Salary Storage

### Database Column
- **Table**: `golfers`
- **Column**: `salary_pennies` (INTEGER)
- **Format**: Pennies (e.g., 12500 = £125.00)

### Last Update Tracking
- **Column**: `last_salary_update` (TIMESTAMPTZ)
- Set automatically when calculator runs

## Future Enhancements

### DataGolf Integration
Connect to strokes gained API for more accurate form scores:
```javascript
// Replace avgFinish estimation with real SG data
const strokesGained = await fetchDataGolfSG(golferId);
const formScore = calculateFormScore(null, strokesGained);
```

### Tournament-Specific Adjustments
- Course fit history
- Weather conditions
- Recent injuries

### Dynamic Ownership Pricing
- Reduce salary for high-owned players
- Increase salary for under-owned sleepers

## Examples

### Top Player (#1 OWGR, Hot Form)
- Rank Score: 100 (logarithmic scale)
- Form Score: 90 (recent win)
- PVS: (100 × 0.6) + (90 × 0.4) = 96
- Sigmoid(0.96) ≈ 0.95
- Salary: £60 + (£75 × 0.95) = **£131.25** → £131.00

### Mid-Tier (#25 OWGR, Average Form)
- Rank Score: 65
- Form Score: 55 (made cuts)
- PVS: (65 × 0.6) + (55 × 0.4) = 61
- Sigmoid(0.61) ≈ 0.62
- Salary: £60 + (£75 × 0.62) = **£106.50** → £106.00

### Value Pick (#100 OWGR, Poor Form)
- Rank Score: 20
- Form Score: 30 (missed cuts)
- PVS: (20 × 0.6) + (30 × 0.4) = 24
- Sigmoid(0.24) ≈ 0.20
- Salary: £60 + (£75 × 0.20) = **£75.00**

## Validation

### Budget Check
Cheapest possible team (6 worst players):
- 6 × £70 = £420 ✅ (leaves room for upgrades)

Most expensive team (all elite):
- 6 × £135 = £810 ❌ (impossible - forces strategy)

Balanced team (2+2+2):
- 2 × £130 + 2 × £100 + 2 × £70 = £600 ✅ (perfect!)

## Maintenance

### When to Recalculate
- ✅ Before each new tournament (weekly)
- ✅ After major championship (rankings shift)
- ✅ When DataGolf updates rankings
- ❌ Not during active tournaments

### Monitoring
Check distribution after calculation:
- Elite should be 3-5% of field
- Mid should be 30-40% of field
- Value should be 55-65% of field

If distribution is off, adjust sigmoid steepness parameter.

## Files

| File | Purpose |
|------|---------|
| `calculate-smart-salaries.js` | Main calculator (Node.js) |
| `run-salary-calculator.ps1` | PowerShell wrapper |
| `SALARY-SYSTEM.md` | This documentation |

## Related Documentation

- `CLUBHOUSE-SYSTEM-PLAN.md` - Overall architecture
- `SYSTEMATIC-FIX-PLAN.md` - Design principles
- `DATABASE-SCHEMA-REFERENCE.md` - Schema details
