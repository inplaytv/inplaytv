# Dynamic Salary System

## Overview

The salary system automatically adjusts player salaries based on **tournament field size** to ensure fair and strategic team building across all competitions.

## Core Principles

### Budget & Team Size
- **Team Budget**: £60,000
- **Team Size**: 6 players
- **Average Salary**: £10,000 per player

### Strategic Balance
The system ensures that:
1. **Top players are unaffordable together** - Forces strategic choices
2. **Bottom players require mixing** - Can't win with only cheap players
3. **Middle tier provides balance** - Around the £10k average

## Salary Calculation

### Formula
```
Max Salary = 25% of budget = £15,000
Min Salary = 10.8% of budget = £6,500
Salary Distribution = Linear from max to min based on field position
```

### Field Position
Players are sorted by **world ranking** (best to worst), then assigned salaries:
- **Position 1** (best player): £15,000
- **Position 2**: £14,900 (approximately)
- **Position 3**: £14,700
- ...
- **Position 66** (worst in 66-player field): £6,500

### Example: 66-Player Field

| Group | Positions | Salary Range | Combined (6 players) | % of Budget |
|-------|-----------|--------------|---------------------|-------------|
| **Top Tier** | 1-6 | £15,000 - £14,300 | ~£88,000 | 147% ❌ |
| **Upper Mid** | 10-20 | £13,700 - £12,500 | ~£78,000 | 130% ❌ |
| **Mid Tier** | 30-36 | £10,700 - £11,300 | ~£66,000 | 110% ❌ |
| **Lower Mid** | 45-50 | £9,000 - £8,700 | ~£53,000 | 88% ✅ |
| **Bottom Tier** | 61-66 | £7,000 - £6,500 | ~£40,500 | 68% ⚠️ |

### Strategic Team Building Examples

**Balanced Team** (£60k exactly):
- 1 top star (£15,000)
- 2 upper-mid (£13,000 each = £26,000)
- 3 lower-mid (£7,000 each = £21,000)
- **Total: £62,000** ✅ Just over budget, need minor adjustments

**Value Team** (£58k):
- 0 top stars
- 3 mid-tier (£10,500 each = £31,500)
- 3 lower-tier (£9,000 each = £27,000)
- **Total: £58,500** ✅ Under budget with strategic picks

**Star-Heavy Team** (£60k):
- 2 top stars (£15,000 + £14,800 = £29,800)
- 4 budget players (£7,500 average = £30,000)
- **Total: £59,800** ✅ Risky but affordable

## Automatic Field Size Adjustment

The system automatically works for any tournament field size:

- **Small Fields (60-80 players)**: Max £15k, Min £6.5k
- **Medium Fields (80-120 players)**: Same formula applies
- **Large Fields (120-156 players)**: Same formula applies
- **PGA Tour Fields (156 players)**: Same formula applies

The linear distribution ensures fairness regardless of field size.

## Current Implementation

### File Location
```
apps/golf/src/app/api/competitions/[competitionId]/golfers/route.ts
```

### Key Functions

#### `calculateDynamicSalaries(fieldSize: number)`
Returns min and max salary values based on field size.

#### `calculateSalaryFromFieldPosition(position: number, totalGolfers: number)`
Calculates exact salary for a player based on their position in the field.

#### `calculateSalary(worldRanking: number, fieldPosition: number, totalGolfers: number)`
Main salary calculation function with rounding to clean values.

### Salary Priority Order
1. **tournament_golfer_salaries table** - Override salaries if manually set
2. **Field position calculation** - Default dynamic system (current)
3. Future: Form-based adjustments (coming soon)

## Future Enhancements

### Form-Based Adjustments (Planned)
The system is designed to accommodate **recent form** in the future:

```typescript
// Future implementation
const formMultiplier = calculateFormMultiplier(player);
const baseSalary = calculateSalaryFromFieldPosition(position, totalGolfers);
const adjustedSalary = baseSalary * formMultiplier;
```

**Form multipliers could include:**
- Recent tournament finishes (last 3-5 events)
- Strokes gained trends
- Course history at tournament venue
- Cut-making percentage
- Top-10 finishes

**Example adjustments:**
- Hot streak (3 top-10s): +5-10% salary
- Cold streak (3 missed cuts): -5-10% salary
- Course specialist: +3-5% at specific venue

### Benefits of Current Architecture

1. **Automatic**: No manual salary updates needed
2. **Fair**: Same rules apply to all tournaments
3. **Scalable**: Works for any field size (60-156 players)
4. **Strategic**: Forces meaningful team-building decisions
5. **Extensible**: Ready for form-based enhancements

## Testing & Validation

### Validation Checklist
- ✅ Top 6 players must cost >100% of budget (impossible to afford)
- ✅ Bottom 6 players must cost 60-80% of budget (requires mixing)
- ✅ Middle players cluster around £10k average
- ✅ Linear distribution with no gaps
- ✅ All salaries rounded to clean £100 increments
- ✅ System applies to all tournaments automatically

### Testing Commands
```bash
# Build to verify no errors
cd apps/golf
pnpm run build

# Test API endpoint
curl http://localhost:3001/api/competitions/[ID]/golfers

# Verify salary distribution
node scripts/check-nedbank-team-builder.js
```

## Summary

**The new salary system ensures:**
- Fair competition across all tournament field sizes
- Strategic team building (can't afford all stars)
- Automatic adjustment (no manual updates needed)
- Ready for future form-based enhancements
- Works identically for all tournaments

**Key Numbers to Remember:**
- Budget: £60,000
- Top player: £15,000 (25% of budget)
- Bottom player: £6,500 (10.8% of budget)
- Top 6 combined: ~£88,000 (impossible)
- Bottom 6 combined: ~£40,500 (need better players too)
