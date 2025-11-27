# Golfer Groups & Ranking Management

## 🎯 Primary Import Page

**Main Page:** http://localhost:3002/golfers/groups

This is your **main page** for managing golfers, groups, and rankings all in one place!

## What You Can Do

### 1. Import Golfers with Rankings
Upload CSV files that:
- Create new golfers
- Assign them to groups (for tournaments)
- **Automatically calculate salaries** based on World Rank + Skill Rating
- Track all changes in history

### 2. Update Rankings & Salaries
When you import a CSV with ranking data:
- New golfers → Created with calculated salary
- Existing golfers → Rankings updated, salary recalculated
- All changes logged to `golfer_ranking_history`

### 3. Manage Groups
- Create groups for tournaments (e.g., "Masters 2025 - Full Field")
- Assign golfers to groups
- Use groups in competitions

---

## 📋 CSV Format

### Full Import (Recommended)
Create golfers + set rankings + calculate salaries all at once:

```csv
First Name,Last Name,World Rank,Skill Rating
Scottie,Scheffler,1,12.5
Rory,McIlroy,2,11.8
Jon,Rahm,3,11.2
Viktor,Hovland,4,10.9
Xander,Schauffele,5,10.7
```

**Columns:**
- `First Name` - Required
- `Last Name` - Required
- `World Rank` - Optional (but needed for salary calculation)
- `Skill Rating` - Optional (adds bonus to salary)

### Simple Import (Without Rankings)
Just create golfers without rankings:

```csv
First Name,Last Name
Tiger,Woods
Rory,McIlroy
Scottie,Scheffler
```

Later use `/rankings/upload` to add rankings.

---

## 💰 How Salaries Calculate

When you provide `World Rank` and optionally `Skill Rating`:

```typescript
baseSalary = max(£10.00, £150.00 - (rank * £0.45))
skillBonus = skillRating * £3.00
totalSalary = min(£150.00, max(£10.00, baseSalary + skillBonus))
```

**Examples:**
- Rank 1, Skill 12.5 → **£150.00** (max cap)
- Rank 10, Skill 10.0 → **£149.55 - £4.50 + £30.00 = £145.05**
- Rank 50, Skill 5.3 → **£127.50 + £15.90 = £143.40**
- Rank 100, Skill 4.0 → **£105.00 + £12.00 = £117.00**
- Rank 200, No skill → **£60.00**

---

## 🚀 Quick Start

### Step 1: Download Sample CSV
Click "Download Template" button on the page to get a properly formatted CSV.

### Step 2: Add Your Golfers
Edit the CSV with your tournament golfers:
- Get rankings from DataGolf, OWGR, or your source
- Add World Rank column for automatic salary calculation
- Optionally add Skill Rating for salary bonus

### Step 3: Import
1. Click "Import CSV"
2. Choose your CSV file
3. Enter group name (e.g., "US Open 2025 - Full Field")
4. Click "Import"

### Step 4: See Results
- ✅ New golfers created (if not already in database)
- ✅ Rankings set on all golfers
- ✅ Salaries calculated automatically
- ✅ Group created with all golfers assigned
- ✅ Changes logged to history

---

## 🔄 Two Ways to Manage Rankings

### Option 1: Import via Golfers/Groups (Recommended)
**Use when:** Creating tournament groups OR updating rankings for a tournament

**URL:** http://localhost:3002/golfers/groups

**What it does:**
- Creates new golfers if they don't exist
- Updates rankings for existing golfers
- Creates a group for tournament management
- Perfect for tournament setup

**Format:**
```csv
First Name,Last Name,World Rank,Skill Rating
Scottie,Scheffler,1,12.5
```

### Option 2: Rankings Upload Page
**Use when:** Bulk updating rankings for existing golfers only

**URL:** http://localhost:3002/rankings/upload

**What it does:**
- Only updates existing golfers (doesn't create new ones)
- Shows preview of changes before applying
- Detailed diff view (old salary → new salary)
- Better for weekly ranking refreshes

**Format:**
```csv
name,world_rank,skill_rating,form_rating,country
Scottie Scheffler,1,12.5,95,USA
```

---

## 📊 Workflow Examples

### Example 1: Setting Up a New Tournament

1. **Get Tournament Field**
   - Download field from PGA Tour website
   - Or get from DataGolf/OWGR

2. **Format as CSV**
   ```csv
   First Name,Last Name,World Rank,Skill Rating
   Scottie,Scheffler,1,12.5
   Rory,McIlroy,2,11.8
   ... (all tournament golfers)
   ```

3. **Import Full Field**
   - Go to `/golfers/groups`
   - Click "Import CSV"
   - Group name: "Masters 2025 - Full Field"
   - Import

4. **After Cut (Optional)**
   - Create second CSV with golfers who made cut
   - Import as "Masters 2025 - After Cut"

5. **Assign to Tournament**
   - Go to tournament admin page
   - Assign "Full Field" group
   - Competitions can now use these golfers

### Example 2: Weekly Ranking Update

**If you want to update all golfers' salaries:**

1. Get latest rankings from DataGolf/OWGR
2. Format as CSV with all active golfers
3. Go to `/rankings/upload` (dedicated ranking update page)
4. Upload CSV
5. Preview shows old → new salaries
6. Apply changes

**Or update via tournament import:**

1. When importing new tournament
2. Include latest rankings in CSV
3. Golfers already in database get updated automatically
4. New golfers get created with current rankings

---

## 🎯 Best Practices

### For Tournament Setup
✅ Use `/golfers/groups` import  
✅ Include World Rank + Skill Rating in CSV  
✅ Create separate groups for "Full Field" and "After Cut"  
✅ Name groups clearly: "[Tournament] - [Stage]"  

### For Regular Updates
✅ Update rankings weekly (Monday after OWGR updates)  
✅ Use `/rankings/upload` for bulk updates to existing golfers  
✅ Keep old CSVs to track historical changes  
✅ Check Supabase logs if imports fail  

### CSV Best Practices
✅ Always include header row  
✅ Use proper capitalization for names  
✅ Double-check World Rank values (1-500 range)  
✅ Skill Rating usually 0-15 (DataGolf scale)  
✅ Test with small CSV first (5-10 golfers)  

---

## 🔍 Troubleshooting

### Import says "0 new golfers" but I expected some
**Reason:** Golfers already exist in database (from previous import)

**Solution:** This is normal! Existing golfers get their rankings updated instead of being created again.

### Salaries not calculating
**Reason:** World Rank column missing or empty

**Solution:** Make sure CSV has `World Rank` column with valid numbers (1-500)

### CSV import fails
**Common causes:**
- Corrupted file (re-save as CSV UTF-8)
- Wrong delimiter (use commas, not semicolons)
- Missing header row
- Special characters in names

**Solution:** Download template, copy your data carefully

### Golfers created but no rankings
**Reason:** World Rank column was empty or not included

**Solution:** 
1. Go to `/rankings/upload`
2. Upload rankings-only CSV
3. Salaries will calculate for matched golfers

---

## 📈 What Gets Logged

Every import creates entries in:

### `golfers` table
- New golfers created
- Rankings updated on existing golfers
- Salaries calculated/updated
- `last_ranking_update` timestamp set
- `ranking_source` set to 'manual'

### `golfer_groups` table
- New group created with your name
- Description shows import summary

### `golfer_group_members` table
- All golfers assigned to the group

### `golfer_ranking_history` table
- Snapshot of each golfer's rankings at import time
- Old rank → new rank
- Old salary → new salary
- Timestamp and source

### `ranking_sync_logs` table
- Summary of import operation
- How many golfers updated
- Success/failure status
- Metadata (group name, counts, etc.)

---

## 🎓 Quick Reference

| Task | Page | Action |
|------|------|--------|
| **Import tournament golfers** | `/golfers/groups` | Click "Import CSV" |
| **Update existing rankings** | `/rankings/upload` | Upload CSV, preview, apply |
| **View golfer groups** | `/golfers/groups` | See all groups and counts |
| **Edit group golfers** | `/golfers/groups/[id]` | Click "View" on a group |
| **Check ranking history** | Supabase → `golfer_ranking_history` | SQL queries |
| **View import logs** | Supabase → `ranking_sync_logs` | See all imports |

---

## 🔗 Related Pages

- **Main Import:** `/golfers/groups` ← **You are here!**
- **Rankings Only:** `/rankings/upload` - Update existing golfers
- **Tournaments:** `/tournaments` - Assign groups to tournaments
- **Documentation:** `docs/RANKING-SYSTEM-QUICKSTART.md`

---

## 💡 Pro Tips

1. **Import with rankings from the start** - Saves time later
2. **Use descriptive group names** - "Masters 2025 - Full Field" not just "Masters"
3. **Create "After Cut" groups** - For Sunday competitions with fewer golfers
4. **Update rankings weekly** - Keep salaries current with latest OWGR
5. **Download template** - Always start from the template to avoid format issues
6. **Test first** - Try with 5-10 golfers before importing 156-golfer field
7. **Keep CSVs** - Save your import files for reference

---

**Page:** http://localhost:3002/golfers/groups  
**Purpose:** Create golfers, assign to groups, calculate salaries  
**Cost:** £0/month (manual CSV imports)  
**Status:** ✅ Ready to use
