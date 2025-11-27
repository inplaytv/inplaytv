# Ranking System - CSV Upload Page

## Quick Access

**Admin Panel:** http://localhost:3002/rankings/upload

## What You Can Do

Upload a CSV file with golfer rankings and watch salaries automatically calculate based on:
- **World Rank** - Higher rank = higher salary
- **Skill Rating** - DataGolf skill estimate (bonus)
- **Form Rating** - Recent performance indicator

## Usage

1. **Start Admin App:**
   ```powershell
   cd c:\inplaytv
   pnpm dev:admin
   ```

2. **Open Upload Page:**
   - Navigate to: http://localhost:3002/rankings/upload

3. **Upload CSV:**
   - Use sample file: `docs/examples/sample-rankings.csv`
   - Or create your own with columns: `name, world_rank, skill_rating, form_rating, country`

4. **Preview & Apply:**
   - Click "Parse CSV"
   - Review matched golfers and salary changes
   - Click "Apply Changes" to update database

## CSV Format

```csv
name,world_rank,skill_rating,form_rating,country
Scottie Scheffler,1,12.5,95,USA
Rory McIlroy,2,11.8,88,NIR
Jon Rahm,3,11.2,92,ESP
```

**Alternative format with split names:**
```csv
first_name,last_name,world_rank,skill_rating,country
Scottie,Scheffler,1,12.5,USA
Rory,McIlroy,2,11.8,NIR
```

## Features

✅ **Smart Matching** - Handles "Tiger Woods" or "Woods, Tiger"  
✅ **Preview Changes** - See old salary → new salary before applying  
✅ **Statistics** - Shows matched, not found, and golfers with changes  
✅ **History Tracking** - All changes logged to `golfer_ranking_history`  
✅ **Audit Trail** - Sync logs in `ranking_sync_logs`  

## Salary Formula

```typescript
baseSalary = max(£10.00, £150.00 - (rank * £0.45))
skillBonus = skillRating * £3.00
totalSalary = min(£150.00, max(£10.00, baseSalary + skillBonus))
```

**Examples:**
- Rank 1, Skill 12.5 → **£150.00** (max cap)
- Rank 50, Skill 5.3 → **£143.40**
- Rank 100, Skill 4.0 → **£117.00**

## Database Tables Updated

- `golfers` - Rankings, skill ratings, salaries
- `golfer_ranking_history` - Historical changes
- `ranking_sync_logs` - Upload audit logs

## Troubleshooting

### "Not Found" for all golfers
- Check CSV format matches examples above
- Verify golfer names match database (check Supabase)

### Salaries not updating
- Make sure you clicked "Apply Changes" not just "Parse CSV"
- Check browser console (F12) for errors

### Import errors
- Restart admin app: `pnpm dev:admin`
- Check environment variables are set

## Documentation

- **Quick Start:** `docs/RANKING-SYSTEM-QUICKSTART.md`
- **Complete Guide:** `docs/RANKING-SYSTEM-COMPLETE.md`
- **Provider Comparison:** `docs/GOLF-DATA-PROVIDERS.md`

## Sample Data

Test with: `docs/examples/sample-rankings.csv` (50 golfers)

---

**Status:** ✅ Production Ready  
**Port:** 3002  
**Cost:** £0/month (manual uploads)
