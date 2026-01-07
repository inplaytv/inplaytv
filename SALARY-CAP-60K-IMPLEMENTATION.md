# £60,000 Salary Cap Implementation - Complete Guide

## 🎯 What Changed

Upgraded from £600 test cap to **£60,000 DraftKings-style cap** with realistic golfer pricing.

### Before
- **Salary Cap**: £600 (60,000 pennies)
- **Golfer Salaries**: £100 each (10,000 pennies)
- **Economics**: Could pick 6 golfers at £100 = £600 total
- **Problem**: Not realistic for production

### After
- **Salary Cap**: £60,000 (6,000,000 pennies)
- **Golfer Salaries**: £5,000-£15,000 range based on world ranking
- **Economics**: Must balance 1-2 premium golfers with mid-tier and value picks
- **Result**: DraftKings-style strategic team building

## 📋 Installation Steps

### Step 1: Run Database Migration
```powershell
# Open Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new)
# Copy and paste contents of: scripts/recalculate-golfer-salaries.sql
# Click "Run" to execute

# This will:
# - Backup current salaries to temp table
# - Recalculate all golfer salaries based on world_ranking
# - Update both salary_pennies and salary columns
# - Show verification results
```

**Expected Results:**
```
✅ GOLFER SALARIES RECALCULATED
📊 Min Salary: £5,000 (500,000p)
📊 Max Salary: £15,000 (1,500,000p)
📊 Avg Salary: £9,500 (950,000p)
💰 Salary Cap: £60,000 (6,000,000p)
✅ Ready for DraftKings-style team building!
```

### Step 2: Verify Code Changes
All code changes are already applied:

✅ **InPlay Team Builder** (`apps/golf/src/app/build-team/[competitionId]/page.tsx`)
- Budget: 6,000,000 pennies (£60,000)
- Filters: Premium (£14k+), Mid (£9k-14k), Value (<£9k)

✅ **Clubhouse Team Builder** (`apps/golf/src/app/clubhouse/build-team/[eventId]/page.tsx`)
- Budget: 6,000,000 pennies (£60,000)
- Filters: Premium (£14k+), Mid (£9k-14k), Value (<£9k)

✅ **Competition Rules** (`apps/golf/src/lib/competition-rules.ts`)
- SALARY_CAP_PENNIES: 6,000,000

✅ **Salary Cap Package** (`packages/salary-cap/src/index.ts`)
- Already configured with correct thresholds

### Step 3: Test the System
```powershell
# Start the development server
pnpm dev:golf

# Navigate to: http://localhost:3003
```

**Testing Checklist:**
- [ ] InPlay tournament shows £60,000 budget
- [ ] Golfers show salaries between £5k-£15k
- [ ] Can select 4-5 golfers (not all 6 at max price)
- [ ] Budget remaining updates correctly
- [ ] Salary filters work (Premium/Mid/Value)
- [ ] Cannot exceed £60,000 total
- [ ] Clubhouse shows same behavior

## 🎮 How It Works

### Salary Distribution by World Ranking

| Tier | World Ranking | Salary Range | Average Cost | Example Players |
|------|--------------|--------------|--------------|-----------------|
| **Premium** | Top 10 | £12,000 - £15,000 | £13,500 | Scottie Scheffler, Rory McIlroy |
| **High-Value** | 11-50 | £9,000 - £11,999 | £10,500 | Top 50 ranked players |
| **Mid-Tier** | 51-100 | £7,000 - £8,999 | £8,000 | Solid tour players |
| **Value** | 100+ | £5,000 - £6,999 | £6,000 | Budget-friendly options |

### Strategic Team Building

With £60,000 cap, typical lineup might be:
```
1. Premium Golfer:    £14,500
2. High-Value:        £10,200
3. Mid-Tier:          £8,100
4. Mid-Tier:          £7,800
5. Value:             £6,200
6. Value (Captain):   £5,900 × 1.5 scoring
                      -------
   TOTAL:             £52,700
   Remaining:         £7,300
```

### Filter System

**Premium (£14k+)**
- Top 10 golfers by world ranking
- Highest scoring potential
- Can afford 1-2 per team

**Mid-Range (£9k-14k)**
- Ranks 11-100
- Balance of value and performance
- Core of most teams (2-3 players)

**Value (<£9k)**
- Lower-ranked but still competitive
- Essential for budget balance
- 2-3 per team typical

## 🔧 Database Schema

### Golfers Table
```sql
golfers {
  salary_pennies INTEGER  -- Primary storage (1,500,000 = £15,000)
  salary INTEGER          -- Legacy InPlay field (same value)
  world_ranking INTEGER   -- Determines salary tier
}
```

### Storage Format
**Both systems now use pennies:**
- InPlay: Uses `golfer.salary` (populated with same pennies value)
- Clubhouse: Uses `golfer.salary_pennies`
- Display: Divide by 100 for UI (1,500,000 → £15,000)

## 📊 Validation Queries

### Check Salary Distribution
```sql
SELECT 
  CASE 
    WHEN salary_pennies >= 1400000 THEN 'Premium (£14k+)'
    WHEN salary_pennies >= 900000 THEN 'High-Value (£9k-14k)'
    WHEN salary_pennies >= 700000 THEN 'Mid-Tier (£7k-9k)'
    ELSE 'Value (£5k-7k)'
  END AS tier,
  COUNT(*) as golfers,
  MIN(salary_pennies/100) as min_pounds,
  MAX(salary_pennies/100) as max_pounds
FROM golfers
GROUP BY tier
ORDER BY MIN(salary_pennies) DESC;
```

### Verify Affordable Teams
```sql
-- Can we build a 6-golfer team under £60k?
SELECT 
  SUM(salary_pennies) as total_pennies,
  SUM(salary_pennies)/100 as total_pounds,
  6000000 - SUM(salary_pennies) as remaining_pennies
FROM (
  SELECT salary_pennies FROM golfers ORDER BY salary_pennies DESC LIMIT 6
) expensive_team;
```

## 🚨 Troubleshooting

### Issue: Team builders still show £600
**Cause**: Browser cache  
**Fix**: Hard refresh (Ctrl+Shift+R) or clear cache

### Issue: Golfers still cost £100
**Cause**: Database migration not run  
**Fix**: Run `scripts/recalculate-golfer-salaries.sql` in Supabase

### Issue: Can't select any golfers (all too expensive)
**Cause**: Salary thresholds not updated  
**Fix**: Verify code changes in both team builders (lines with `1400000` and `900000`)

### Issue: Display shows wrong amounts
**Cause**: Division by 100 missing  
**Fix**: Check display logic - should be `(salary_pennies / 100).toLocaleString()`

## 📈 Migration Notes

### Backward Compatibility
- ✅ New entries work with new salaries
- ⚠️ Old entries still reference old salaries (pre-migration)
- 💡 Consider: Add migration date check in UI to show "Legacy Entry"

### Golfer Salary Updates
The migration uses `RANDOM()` to distribute salaries within tier ranges. This means:
- Each golfer gets unique salary (not all exactly £12,000)
- Re-running migration will change values
- Production should run ONCE and save the values

### Future Updates
To update golfer salaries based on new rankings:
```sql
-- Update specific golfer
UPDATE golfers
SET salary_pennies = 1450000  -- £14,500
WHERE id = 'golfer-uuid';

-- Bulk update by ranking
UPDATE golfers
SET salary_pennies = 1200000 + (RANDOM() * 300000)::INTEGER
WHERE world_ranking <= 10;
```

## ✅ Success Criteria

You know it's working when:
- [x] Team builder shows "£60,000 Budget"
- [x] Golfers show salaries like "£12,450" or "£8,750"
- [x] Can select 4-6 golfers (not all 6 at highest prices)
- [x] Budget remaining decreases correctly
- [x] Salary filters show appropriate golfers
- [x] Cannot exceed cap when selecting team
- [x] Clubhouse and InPlay show same prices
- [x] Strategic choices required (can't just pick 6 best)

## 🎯 Next Steps

1. **Test with real tournament**: Create event → Assign golfer group → Build team
2. **Monitor analytics**: Track which salary tiers users prefer
3. **Adjust if needed**: If everyone picks same lineups, tweak salary distribution
4. **Add features**: Consider dynamic pricing based on form/popularity

---

**Questions?** Check the main instructions file: `.github/copilot-instructions.md`
