# QUICK START: Sync Golfers with Auto-Group Creation

## Single Command Workflow

```
Click "Sync from DataGolf" → Everything happens automatically!
```

---

## What Gets Created Automatically

### 1. Golfers (in database)
- ✅ Creates new golfers from DataGolf
- ✅ Reuses existing golfers
- ✅ Updates tournament_golfers links

### 2. Golfer Group
- ✅ Name: "{Tournament Name} - Field"
- ✅ Slug: "{tournament-slug}-field"
- ✅ All golfers added to group

### 3. Competition Links
- ✅ Finds all tournament competitions
- ✅ Links group to each competition
- ✅ Team builder instantly ready

---

## Success Message You'll See

```
✅ Successfully synced 156 golfers!
📊 12 new, 144 existing
👥 Golfer group: "BMW Australian PGA Championship - Field"
🔗 Linked to 3 competition(s)
✨ Team builder is now ready!
```

---

## Before You Start (One-Time Setup)

1. **Run database migration:**
   ```sql
   -- In Supabase SQL Editor:
   -- Run: scripts/add-tour-to-tournaments.sql
   ```

2. **Set tournament tour types:**
   ```sql
   -- European Tour events:
   UPDATE tournaments SET tour = 'euro' 
   WHERE name LIKE '%BMW Australian PGA%';
   
   -- PGA Tour events already default to 'pga'
   ```

---

## Testing

1. Open admin → Tournaments → BMW Australian PGA Championship
2. Click "Manage Golfers"
3. Click "Sync from DataGolf"
4. Wait 10 seconds
5. See success message
6. Navigate to any competition → Team Builder
7. All 156 golfers available instantly!

---

## Supported Tours

| Tour | Parameter | Auto-Detected |
|------|-----------|---------------|
| PGA Tour | `pga` | ✅ Yes |
| European Tour (DP World) | `euro` | ✅ Yes |
| Korn Ferry Tour | `kft` | ✅ Yes |
| LIV Golf | `alt` | ✅ Yes |

---

## No More Manual Steps!

❌ **OLD WAY:**
1. Sync golfers (3 min)
2. Click "Create Group" (1 min)
3. Name the group (30 sec)
4. Navigate to Elite Competition (30 sec)
5. Assign group to Elite (1 min)
6. Navigate to Gold Competition (30 sec)
7. Assign group to Gold (1 min)
8. Navigate to Platinum Competition (30 sec)
9. Assign group to Platinum (1 min)
**Total: 8-10 minutes**

✅ **NEW WAY:**
1. Click "Sync from DataGolf"
**Total: 10 seconds**

---

## Re-Syncing (Field Updates)

Just click "Sync from DataGolf" again!

The system will:
- Add any new golfers
- Keep existing golfers
- Update the group
- Re-link to competitions

Safe to run multiple times. No duplicates created.

---

## Questions?

See full documentation: `docs/AUTOMATED-GOLFER-GROUP-SYNC.md`
