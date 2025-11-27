# InPlay Fantasy Golf Scoring System
## Complete Scoring Rules & Implementation Guide

---

## 🎯 Overview

The InPlay Fantasy Golf scoring system uses a comprehensive, multi-layered approach that rewards exceptional play while penalizing poor performance. Points are calculated from hole-by-hole scoring, round achievements, tournament placement, and captain multipliers.

**Key Files:**
- `apps/golf/src/lib/fantasy-scoring.ts` - Core scoring engine (single source of truth)
- `apps/golf/src/components/ScoringBreakdown.tsx` - UI component for displaying breakdowns
- `apps/golf/src/app/leaderboards/page.tsx` - Leaderboard implementation

---

## 📊 Scoring Components

### 1. Hole-by-Hole Scoring (Base Points)

Every hole a golfer plays earns or loses points based on their score relative to par:

| Score | Relative to Par | Points | Examples |
|-------|-----------------|--------|----------|
| **Albatross/Condor/HIO** | -3 or better | **+10** | Hole-in-one on Par 4, Albatross on Par 5 |
| **Eagle** | -2 | **+6** | 3 on a Par 5, 2 on a Par 4 |
| **Birdie** | -1 | **+3** | 3 on a Par 4, 4 on a Par 5 |
| **Par** | 0 | **+1** | 4 on a Par 4, 5 on a Par 5 |
| **Bogey** | +1 | **-1** | 5 on a Par 4, 6 on a Par 5 |
| **Double Bogey+** | +2 or worse | **-3** | 6+ on a Par 4, 7+ on a Par 5 |

**Calculation:**
```typescript
function calculateHolePoints(score: number, par: number): number {
  const toPar = score - par;
  
  if (toPar <= -3) return 10;  // Albatross/HIO
  if (toPar === -2) return 6;   // Eagle
  if (toPar === -1) return 3;   // Birdie
  if (toPar === 0) return 1;    // Par
  if (toPar === 1) return -1;   // Bogey
  if (toPar >= 2) return -3;    // Double Bogey or worse
  
  return 0;
}
```

**Example:**
- Round of: Birdie, Par, Par, Eagle, Bogey, Birdie, Par, Par, Par = +3 +1 +1 +6 -1 +3 +1 +1 +1 = **16 points**

---

### 2. Round Achievement Bonuses

Bonuses awarded for exceptional round performance. These stack and are applied per round:

| Achievement | Requirement | Bonus Points |
|-------------|-------------|--------------|
| **Bogey Free Round** | No bogeys or worse in round | **+5** |
| **Sub-70 Round** | Total score under 70 | **+3** |
| **3+ Eagles** | Three or more eagles in round | **+10** |
| **7+ Birdies** | Seven or more birdies in round | **+5** |
| **6+ Under Par** | Round score 6 or more under par | **+5** |

**Example:**
- Player shoots 66 (-6) with 8 birdies, no bogeys
- Bonuses: Bogey Free (+5) + Sub-70 (+3) + 7+ Birdies (+5) + 6+ Under (+5) = **+18 bonus points**

---

### 3. Scoring Streak Bonuses

Bonuses for consecutive scoring runs within a single round:

| Streak | Bonus Points | Note |
|--------|--------------|------|
| **3 Consecutive Birdies** | **+5** | Three or more birdies in a row |
| **4 Consecutive Birdies** | **+8** | Additional +3 points (total +8) |
| **5+ Consecutive Birdies** | **+12** | Additional +4 points (total +12) |

**Note:** Eagles count as birdies for streak purposes.

**Example:**
- Holes 5-8: Birdie, Birdie, Birdie, Eagle = **+5 points** (3+ consecutive)
- If extended to 5+ holes = **+12 points total**

---

### 4. Tournament Placement Bonuses

One-time bonuses based on final tournament position. **NOT multiplied by captain.**

| Position | Bonus Points |
|----------|--------------|
| **1st Place** | **+25** |
| **2nd Place** | **+15** |
| **3rd Place** | **+10** |
| **4th Place** | **+7** |
| **5th Place** | **+5** |
| **6th-10th** | **+3** |
| **11th-20th** | **+2** |
| **21st-30th** | **+1** |
| 31st+ | 0 |

---

### 5. Cut Bonus

| Achievement | Bonus Points |
|-------------|--------------|
| **Made the Cut** | **+5** |

**Note:** Not multiplied by captain.

---

### 6. Captain Multiplier (⭐ 2x)

The captain receives **2x points** for:
- ✅ **Hole-by-hole scoring** (all base points doubled)
- ✅ **Round achievement bonuses** (doubled)
- ✅ **Scoring streak bonuses** (doubled)

The captain does **NOT** get 2x for:
- ❌ **Tournament placement bonuses** (stays at base value)
- ❌ **Cut-made bonus** (stays at +5)

**Example:**
```
Non-Captain Golfer:
- Hole-by-hole: 85 points
- Round bonuses: 13 points  
- Placement: +10 (3rd place)
- Total: 108 points

Same Performance as Captain:
- Hole-by-hole: 85 × 2 = 170 points
- Round bonuses: 13 × 2 = 26 points
- Placement: +10 (not doubled)
- Total: 206 points
```

---

## 🎮 Complete Scoring Example

### Example: Rory McIlroy (Captain)

#### **Round 1:**
- Holes: 3,5,3,3,4,3,4,3,4 | 4,3,4,4,4,3,5,4,4
- Par: 4,5,4,3,5,3,4,4,4 | 4,4,4,4,5,3,5,4,4
- Scores: -1,0,-1,0,-1,0,0,-1,0 | 0,-1,0,0,-1,0,0,0,0
- Points per hole: 3,1,3,1,3,1,1,3,1 | 1,3,1,1,3,1,1,1,1
- **Round 1 Total: 30 points**
- **Bonuses:** Bogey Free (+5)

#### **Round 2:**
- Total: 32 points
- **Bonuses:** Sub-70 (+3), 3 Consecutive Birdies (+5)

#### **Round 3:**
- Total: 28 points
- **Bonuses:** None

#### **Round 4:**
- Total: 35 points
- **Bonuses:** Bogey Free (+5), 7+ Birdies (+5)

#### **Tournament Position:** 2nd Place

#### **Final Calculation:**

```
Base Hole-by-Hole Points: 125
Round Bonuses: 23
Total Before Captain: 148

Captain Multiplier (2x):
- Hole-by-hole: 125 × 2 = 250
- Bonuses: 23 × 2 = 46
- Subtotal: 296

Tournament Placement (NOT doubled):
- 2nd Place: +15

Cut Made: +5

FINAL TOTAL: 316 points
```

---

## 💻 Implementation

### Core Scoring Function

```typescript
import { 
  calculateGolferScore,
  type GolferPerformance,
  type RoundScore 
} from '@/lib/fantasy-scoring';

// Build performance data
const performance: GolferPerformance = {
  rounds: [
    {
      round: 1,
      holes: [
        { hole: 1, par: 4, score: 3 },
        { hole: 2, par: 5, score: 5 },
        // ... all 18 holes
      ]
    },
    // ... all rounds
  ],
  finalPosition: 2,  // 2nd place
  madeCut: true,
  isCaptain: true    // Is this the captain?
};

// Calculate complete score with breakdown
const scoring = calculateGolferScore(performance);

console.log(`Final Points: ${scoring.finalTotal}`);
console.log(`Hole-by-Hole: ${scoring.holeByHolePoints}`);
console.log(`Bonuses: ${scoring.roundBonusTotal + scoring.streakBonusTotal}`);
console.log(`Placement: +${scoring.placementBonus}`);
```

### Entry (Team) Scoring

Calculate total points for a 6-golfer entry:

```typescript
import { calculateEntryScore } from '@/lib/fantasy-scoring';

const entry = {
  entryId: 'entry-123',
  entryName: "Tiger's Dream Team",
  captainId: 'golfer-1',
  golfers: [
    {
      id: 'golfer-1',
      name: 'Scottie Scheffler',
      performance: { /* ... */ }
    },
    // ... 5 more golfers
  ]
};

const entryScore = calculateEntryScore(entry);
console.log(`Team Total: ${entryScore.totalPoints}`);

// Get individual golfer breakdowns
entryScore.golferScores.forEach((scoring, golferId) => {
  console.log(`${golferId}: ${scoring.finalTotal} points`);
});
```

---

## 📱 UI Display

### Scoring Breakdown Component

```tsx
import ScoringBreakdownComponent from '@/components/ScoringBreakdown';

// Display detailed scoring for a golfer
<ScoringBreakdownComponent
  golferName="Rory McIlroy"
  scoring={golferScoringBreakdown}
  isCaptain={true}
/>
```

This displays:
- ✅ Total points with captain indicator
- ✅ Hole-by-hole base scoring (with captain multiplier shown)
- ✅ Round achievement bonuses (with breakdown)
- ✅ Scoring streak bonuses
- ✅ Tournament placement bonus
- ✅ Cut-made bonus
- ✅ Complete calculation summary

---

## 🎯 Leaderboard Integration

### In-Play Leaderboard

The leaderboard system automatically:
1. Fetches tournament hole-by-hole data from DataGolf API
2. Matches golfers to user entries
3. Calculates fantasy points using `calculateGolferScore()`
4. Applies captain multipliers
5. Ranks entries by total points
6. Updates every 5 minutes during live tournaments

**Key Function:**
```typescript
const calculateEntryFantasyPoints = (entry: any): number => {
  // For each golfer in the entry:
  // 1. Get their tournament performance data
  // 2. Build GolferPerformance object
  // 3. Call calculateGolferScore()
  // 4. Sum all golfer points
  return totalPoints;
};
```

---

## 📊 Scoring Summary Table

| Component | Points Range | Multiplied by Captain? |
|-----------|--------------|------------------------|
| Hole-by-Hole | -54 to +180 (18 holes × 4 rounds) | ✅ Yes (2x) |
| Round Bonuses | 0 to +28 per round | ✅ Yes (2x) |
| Streak Bonuses | 0 to +12 per round | ✅ Yes (2x) |
| Placement Bonus | 0 to +25 | ❌ No |
| Cut Bonus | 0 or +5 | ❌ No |

**Maximum Possible Points (Single Golfer, Captain):**
- Perfect 18-hole rounds (all hole-in-ones): ~720 points × 2 (captain) = 1,440
- Max bonuses per round: ~28 × 4 rounds × 2 = 224
- 1st Place: +25
- Cut: +5
- **Theoretical Maximum: ~1,694 points**

**Realistic Top Performance (Captain):**
- 4 rounds of 65 (-7 each): ~280 points × 2 = 560
- Strong bonuses: ~40 × 2 = 80
- 1st Place: +25
- Cut: +5
- **Realistic Maximum: ~670 points**

---

## 🔄 Data Flow

```
1. Tournament Data (DataGolf API)
   ↓
2. Fetch hole-by-hole scores
   ↓
3. Match golfers to entries
   ↓
4. Build GolferPerformance objects
   ↓
5. calculateGolferScore() → ScoringBreakdown
   ↓
6. Apply captain multiplier
   ↓
7. Sum entry total
   ↓
8. Display leaderboard + breakdowns
```

---

## 🚀 Testing

### Test Cases

```typescript
import { calculateHolePoints, calculateGolferScore } from '@/lib/fantasy-scoring';

// Test 1: Hole scoring
expect(calculateHolePoints(2, 4)).toBe(6);  // Eagle
expect(calculateHolePoints(3, 4)).toBe(3);  // Birdie
expect(calculateHolePoints(4, 4)).toBe(1);  // Par
expect(calculateHolePoints(5, 4)).toBe(-1); // Bogey
expect(calculateHolePoints(6, 4)).toBe(-3); // Double

// Test 2: Captain multiplier
const normalGolfer = { /* performance */, isCaptain: false };
const captainGolfer = { /* same performance */, isCaptain: true };
const normalScore = calculateGolferScore(normalGolfer);
const captainScore = calculateGolferScore(captainGolfer);

// Captain should have ~2x base scoring, but placement not doubled
expect(captainScore.holeByHolePoints).toBe(normalScore.holeByHolePoints * 2);
expect(captainScore.placementBonus).toBe(normalScore.placementBonus);
```

---

## 📝 Notes

- All scoring is cumulative across the tournament
- Points update in real-time as holes are completed
- Cut-missed golfers receive 0 for remaining rounds
- Withdrawals freeze points at last completed hole
- Scoring is deterministic and reproducible
- No randomness or adjustments - pure performance-based

---

## 🎓 For Developers

**Single Source of Truth:** `apps/golf/src/lib/fantasy-scoring.ts`

Never inline scoring logic elsewhere. Always import and use:
- `calculateHolePoints()` - For individual hole display
- `calculateGolferScore()` - For complete golfer scoring
- `calculateEntryScore()` - For team/entry totals

This ensures consistency across:
- Leaderboards
- Scorecard displays
- Results pages
- Analytics
- Admin panels

---

## 📞 Support

For scoring questions or discrepancies:
1. Check `fantasy-scoring.ts` for authoritative rules
2. Review `ScoringBreakdown` component for detailed calculations
3. Verify tournament data from DataGolf API
4. Check captain designation in entry data

**Last Updated:** November 25, 2025
