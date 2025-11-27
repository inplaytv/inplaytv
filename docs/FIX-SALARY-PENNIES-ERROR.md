# FIX: "Could not find salary_pennies column" Error

## What Happened?
You tried to upload golfers but got an error about "salary_pennies". This means the database needs to be updated first!

## What is "salary_pennies"?
It's just how we store money in the database:
- **£1.00 = 100 pennies**
- **£150.00 = 15000 pennies**
- Why? To avoid decimal rounding errors with money (computers are bad at decimals!)

---

## 🔧 Fix It Now (2 Minutes)

### Step 1: Open Supabase
1. Go to: https://supabase.com/dashboard
2. Click on your project
3. Click **SQL Editor** on the left sidebar

### Step 2: Run the Migration
1. Copy ALL the SQL from this file: `c:\inplaytv\scripts\migrations\add-golfer-rankings-fixed.sql`
2. Paste it into the SQL Editor
3. Click the big green **RUN** button
4. Wait for "Success!" message

### Step 3: Verify It Worked
At the bottom of the results, you should see something like:
```
total_golfers | golfers_with_rank | golfers_with_salary | min_salary_pennies | max_salary_pennies
     87       |         0         |         87          |       10000        |       10000
```

This means:
- ✅ All 87 golfers now have `salary_pennies` column
- ✅ Default salary: £100.00 (10000 pennies)
- ✅ Ready for ranking imports!

---

## ✅ Now Try Again

Go back to http://localhost:3002/golfers/groups and upload your CSV!

**What will happen:**
1. Golfers imported ✅
2. Rankings set (if in CSV) ✅
3. Salaries calculated automatically:
   - Rank 1 → £150.00 (15000 pennies)
   - Rank 50 → £143.40 (14340 pennies)
   - Rank 100 → £117.00 (11700 pennies)
   - No rank → £100.00 (10000 pennies - default)

---

## 💰 Understanding Pennies

| Pounds | Pennies | What It Means |
|--------|---------|---------------|
| £1.00  | 100     | Minimum we might use |
| £10.00 | 1000    | Formula minimum |
| £50.00 | 5000    | Mid-tier golfer |
| £100.00 | 10000  | Default salary |
| £150.00 | 15000  | Maximum (top ranked) |

**In Your CSV:**
You just provide the World Rank (like 1, 2, 3...) and we calculate the pennies automatically!

---

## 🎯 After Migration Works

Your CSV format:
```csv
First Name,Last Name,World Rank,Skill Rating
Scottie,Scheffler,1,12.5
Rory,McIlroy,2,11.8
Jon,Rahm,3,11.2
```

What happens:
- Scottie: Rank 1 → Salary auto-set to **15000 pennies** (£150.00)
- Rory: Rank 2 → Salary auto-set to **14955 pennies** (£149.55)
- Jon: Rank 3 → Salary auto-set to **14865 pennies** (£148.65)

You never see "pennies" - it's just internal database storage! 🎉

---

## ❓ Still Having Issues?

### Error: "relation golfers does not exist"
**Problem:** Golfers table doesn't exist yet  
**Solution:** Check you're on the right Supabase project

### Error: "permission denied"
**Problem:** SQL Editor doesn't have permission  
**Solution:** Make sure you're logged in as the project owner

### Migration runs but still errors
**Problem:** Schema cache needs refresh  
**Solution:** Restart your admin app: `pnpm dev:admin`

---

**Last Updated:** November 2025  
**File:** `scripts/migrations/add-golfer-rankings-fixed.sql`  
**Run Once:** Yes, just one time to set up the database
