# Issues Addressed - Status Update

## Issue 1: Featured Competitions "Failed to fetch" ✅ 

### Root Cause
The database columns (`is_featured`, `featured_order`, `featured_message`) don't exist yet in your Supabase database.

### Solution
**You need to run the SQL migration:**

1. Go to your Supabase Dashboard
2. Open SQL Editor
3. Copy and paste this SQL:

```sql
-- File: scripts/2025-01-featured-competitions.sql

ALTER TABLE tournament_competitions 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_order INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS featured_message TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_tournament_competitions_featured 
ON tournament_competitions(is_featured, featured_order) 
WHERE is_featured = true;

COMMENT ON COLUMN tournament_competitions.is_featured IS 'Whether this competition should be featured on the main page';
COMMENT ON COLUMN tournament_competitions.featured_order IS 'Display order for featured competitions (1 = top, 2 = second, etc)';
COMMENT ON COLUMN tournament_competitions.featured_message IS 'Optional message to display on featured card (e.g., "Only 50 spots left!", "New tournament!")';
```

4. Click "Run"
5. Refresh the Featured Competitions page

### What I Added
- Better error handling in the API to tell you if columns are missing
- The error message will now say: "Database schema needs update. Run featured competitions migration."

---

## Issue 2: Golfers Section in Competition Edit ✅ EXPLAINED

### This is by Design (Not a Bug)
Golfers are managed at the **Tournament** level, not the **Competition** level.

**Why?**
- A tournament has ONE set of golfers (e.g., "Masters 2025" has the Masters field)
- Multiple competitions can exist for the same tournament (Full Course, Beat the Cut, etc.)
- All competitions within a tournament share the same golfer pool

**Where to Manage Golfers:**
1. Go to **Tournaments** → Click **Edit** on a tournament
2. Scroll down to the **Golfer Groups** section
3. Assign golfer groups to the tournament
4. ALL competitions in that tournament will use those golfers

**When You Edit a Competition:**
- You're editing competition-specific settings (entry fee, cap, status, dates)
- You don't edit golfers because they're inherited from the parent tournament

---

## Issue 3: CSV Filename Update Error ⏳ NEEDS MORE INFO

### What I Found
The tournament update API (`PUT /api/tournaments/[id]`) properly returns JSON, so it should work.

### Possible Causes:
1. **You're updating the wrong field** - There's no `golfers_csv_filename` field in the tournaments table
2. **You're trying to update something else** - Can you clarify what you're trying to rename?

### Questions to Help Debug:
1. **Where** are you trying to change the CSV filename?
   - Tournament edit page?
   - Golfer groups page?
   - Import golfers page?

2. **What** are you clicking/editing when you get the error?
   - Screenshot would help

3. **When** does the error appear?
   - After uploading a CSV?
   - When renaming something?
   - When saving the tournament?

### Likely Scenario:
If you're trying to rename a golfer group after importing from CSV:
- Go to **Tournaments** → **Tournament Golfers**
- Edit the group name there
- The CSV file itself isn't stored - just the golfers extracted from it

---

## Status Summary

| Issue | Status | Action Required |
|-------|--------|----------------|
| Featured Competitions "Failed to fetch" | ✅ Fixable | Run SQL migration in Supabase |
| Golfers not in Competition edit | ✅ Expected | Manage golfers at Tournament level |
| CSV filename update error | ⏳ Need info | Provide more details on what you're trying to do |

---

## Next Steps

### Immediate (To Fix Featured):
1. Run the SQL migration above in Supabase
2. Refresh admin panel → Featured Competitions
3. Should now see your competitions
4. Mark 2 as featured (positions 1 & 2)

### For Golfers:
- They're correctly managed at tournament level
- Each competition inherits the tournament's golfers
- This is the correct architecture

### For CSV Issue:
- Need more details from you about what you're trying to rename
- Share a screenshot or describe the exact steps that trigger the error
