# Ranking System Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Run the Database Migration ⚠️ REQUIRED FIRST!

**If you skip this step, you'll get an error: "could not find salary_pennies column"**

1. Open Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project → SQL Editor (left sidebar)
3. Copy **ALL** the contents of: `c:\inplaytv\scripts\migrations\add-golfer-rankings-fixed.sql`
4. Paste into SQL Editor
5. Click the big green **RUN** button
6. Wait for "Success!" message

**What this does:**
- Adds `world_rank`, `skill_rating`, `salary_pennies` columns to golfers table
- Creates `golfer_ranking_history` table (tracks changes over time)
- Creates `ranking_sync_logs` table (audit trail of imports)
- Sets default salary of £100.00 (10000 pennies) for existing golfers

**Verify it worked:**
```sql
-- Check golfers table has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'golfers' 
AND column_name IN ('world_rank', 'skill_rating', 'salary_pennies');

-- Should show 3 rows: world_rank, skill_rating, salary_pennies
```

**💡 What is "salary_pennies"?**
It's how we store money: £1.00 = 100 pennies, so £150.00 = 15000 pennies. This avoids decimal rounding errors with money!

### Step 2: Upload Your First Golfers with Rankings

1. Start your admin app:
   ```powershell
   cd c:\inplaytv\apps\admin
   pnpm dev
   ```

2. Navigate to: http://localhost:3002/golfers/groups

3. Import golfers with rankings:
   - Click "Import CSV"
   - Enter group name (e.g., "PGA Championship 2026 - Full Field")
   - Upload CSV with columns: First Name, Last Name, World Rank, Skill Rating
   - Sample file: `c:\inplaytv\docs\examples\sample-rankings.csv`
   - Click "Import"

**Note:** You can also use http://localhost:3002/rankings/upload to update rankings for existing golfers

4. Verify updates:
   - Go to Supabase → Table Editor → `golfers`
   - Check `world_rank`, `skill_rating`, `salary_pennies` columns are populated
   - Check `last_ranking_update` has timestamp
   - Go to `golfer_ranking_history` → should have entries for each golfer
   - Go to `golfer_groups` → should see your new group
   - Go to `golfer_group_members` → should have all golfer assignments

### Step 3: Test the Provider System (Optional)

If you want to test DataGolf API:

1. **Sign up for free trial:**
   - Visit: https://datagolf.com/api-access
   - Click "Start Free Trial"
   - Get your API key

2. **Add to environment:**
   ```bash
   # apps/admin/.env.local
   GOLF_DATA_PROVIDER=datagolf
   GOLF_API_KEY=your_key_here
   ```

3. **Test it works:**
   Create test file `apps/admin/src/app/api/test-provider/route.ts`:
   ```typescript
   import { GolfDataProviderFactory } from '@/../../packages/shared/src/lib/providers/factory';
   
   export async function GET() {
     const result = await GolfDataProviderFactory.createFromEnv();
     const rankings = await result.provider.getRankings(10);
     
     return Response.json({
       provider: result.provider.metadata.name,
       topGolfers: rankings.slice(0, 5),
       cost: result.cost,
       reliability: result.reliability,
     });
   }
   ```

4. **Visit:** http://localhost:3002/api/test-provider

---

## 📊 How It Works

### Salary Calculation Formula

```typescript
// Base salary: Higher rank = lower salary
baseSalary = max(£10.00, £150.00 - (rank * £0.45))

// Skill bonus: Add up to £30 for high skill ratings
skillBonus = skillRating * £3.00

// Total: £10.00 minimum, £150.00 maximum
totalSalary = min(£150.00, max(£10.00, baseSalary + skillBonus))
```

**Examples:**
- Rank 1, Skill 12.5 → Base £149.55 + Bonus £37.50 = **£150.00** (capped)
- Rank 50, Skill 5.3 → Base £127.50 + Bonus £15.90 = **£143.40**
- Rank 100, Skill 4.0 → Base £105.00 + Bonus £12.00 = **£117.00**
- Rank 200, Skill 2.0 → Base £60.00 + Bonus £6.00 = **£66.00**

### Data Flow

```
CSV Upload → Parse & Match → Preview Changes → Apply Updates → History Log
     ↓              ↓              ↓               ↓              ↓
  Admin UI    Name Matching   Show Diff     Update Golfers   Audit Trail
```

### Database Structure

```
golfers
├── world_rank (new)
├── skill_rating (new)
├── form_rating (new)
├── last_ranking_update (new)
├── ranking_source (new)
└── salary_pennies (updated by formula)

golfer_ranking_history
├── golfer_id
├── world_rank
├── skill_rating
├── salary_pennies
├── source
└── recorded_at

ranking_sync_logs
├── source (manual/datagolf/etc)
├── sync_type (csv_upload/api_sync)
├── golfers_updated
├── status (success/failure)
└── metadata (JSON)
```

---

## 🔄 Regular Usage

### Weekly Ranking Updates (Recommended)

**Option 1: Import New Tournament (with rankings)**
1. Go to http://localhost:3002/golfers/groups
2. Click "Import CSV"
3. Upload CSV with: First Name, Last Name, World Rank, Skill Rating
4. New golfers created + rankings set + salaries calculated automatically

**Option 2: Update Existing Golfers**
1. Go to http://localhost:3002/rankings/upload
2. Upload CSV with just rankings: name, world_rank, skill_rating
3. Only updates rankings/salaries for golfers already in database
4. Use when you want to refresh salaries without creating new groups

**Both options:**
- Salaries automatically recalculate
- Changes logged to history
- Audit trail in `ranking_sync_logs`

### Automated API Sync (Future)

When you're ready to use paid APIs:

1. Set up DataGolf account
2. Configure environment variables
3. Create cron job:
   ```typescript
   // apps/admin/src/app/api/rankings/sync/route.ts
   // Runs daily at 3 AM
   export async function GET() {
     const provider = await GolfDataProviderFactory.createFromEnv();
     const rankings = await provider.getRankings(500);
     
     // Update database...
     
     return Response.json({ updated: rankings.length });
   }
   ```

4. Add to `vercel.json`:
   ```json
   {
     "crons": [
       {
         "path": "/api/rankings/sync",
         "schedule": "0 3 * * *"
       }
     ]
   }
   ```

---

## 🎯 Common Tasks

### View Ranking History

```typescript
// Get golfer's ranking over time
const { data } = await supabase
  .from('golfer_ranking_history')
  .select('*')
  .eq('golfer_id', golferId)
  .order('recorded_at', { ascending: false });

// Chart shows: Rank going up/down, salary changes
```

### Adjust Salary Formula

Edit the `calculateSalary` function in:
- `apps/admin/src/app/rankings/upload/page.tsx` (line ~124)

Change constants:
```typescript
// Make top players more expensive
const baseSalary = Math.max(1000, 20000 - (worldRank * 50));

// Increase skill bonus impact
const skillBonus = skillRating ? Math.round(skillRating * 500) : 0;

// Adjust min/max caps
const totalSalary = Math.min(25000, Math.max(1000, baseSalary + skillBonus));
```

### Check Sync Logs

```sql
SELECT 
  source,
  sync_type,
  golfers_updated,
  status,
  synced_at
FROM ranking_sync_logs
ORDER BY synced_at DESC
LIMIT 10;
```

Shows:
- When rankings were updated
- How many golfers changed
- Success/failure status
- Source (manual CSV vs API)

---

## ⚠️ Troubleshooting

### CSV Upload Shows "Not Found" for All Golfers

**Problem:** Name matching failed

**Solutions:**
1. Check CSV format matches exactly:
   ```csv
   name,world_rank,skill_rating,form_rating,country
   Tiger Woods,150,7.5,70,USA
   ```

2. Try with `first_name` and `last_name` columns:
   ```csv
   first_name,last_name,world_rank,skill_rating,country
   Tiger,Woods,150,7.5,USA
   ```

3. Check golfer exists in database:
   ```sql
   SELECT first_name, last_name FROM golfers WHERE last_name = 'Woods';
   ```

### Salaries Not Updating

**Problem:** `calculateSalary()` function not running

**Solutions:**
1. Check you clicked "Apply Changes" (not just "Parse CSV")
2. Verify no errors in browser console (F12)
3. Check `salary_pennies` column updated:
   ```sql
   SELECT 
     first_name, 
     last_name, 
     salary_pennies, 
     last_ranking_update 
   FROM golfers 
   WHERE last_ranking_update IS NOT NULL;
   ```

### API Provider Not Working

**Problem:** Provider fails to initialize

**Solutions:**
1. Check environment variables set:
   ```bash
   echo $GOLF_DATA_PROVIDER
   echo $GOLF_API_KEY
   ```

2. Test API key directly:
   ```bash
   curl "https://feeds.datagolf.com/get-player-rankings?file_format=json&key=YOUR_KEY"
   ```

3. Check rate limits not exceeded (DataGolf free = 100/day)

4. Verify network connection (firewall/proxy issues)

---

## 📈 Next Steps

### Immediate (This Week)
- [ ] Run database migration
- [ ] Upload first CSV with rankings
- [ ] Verify salaries calculated correctly
- [ ] Test on golf app (golfer prices should show new salaries)

### Short Term (This Month)
- [ ] Establish weekly ranking update routine
- [ ] Monitor salary distribution (are top players too expensive?)
- [ ] Adjust formula based on user feedback
- [ ] Add ranking display to golfer profile pages

### Long Term (Next 3 Months)
- [ ] Sign up for DataGolf trial (when ready for automation)
- [ ] Set up Redis caching
- [ ] Create automated sync cron job
- [ ] Build ranking history charts
- [ ] Add "trending" indicators (📈 rising, 📉 falling)

---

## 💡 Pro Tips

1. **Update rankings weekly:** Monday mornings after OWGR updates
2. **Track changes:** Keep old CSVs to see how rankings evolved
3. **Test formula:** Use sample data before applying to live golfers
4. **Monitor distribution:** Aim for salary spread £10-£150
5. **Communicate changes:** Let users know when salaries update
6. **Cache aggressively:** 30-second cache = 99.8% cost savings
7. **Start free:** Manual CSV is perfect for testing business model
8. **Scale gradually:** Only pay for APIs when revenue justifies it

---

## 📞 Need Help?

- Database issues → Check Supabase logs
- CSV parsing errors → See error message in red box
- API provider problems → Review provider docs
- Formula adjustments → Test in staging first

---

**Last Updated:** January 2025  
**System Status:** ✅ Ready to use
