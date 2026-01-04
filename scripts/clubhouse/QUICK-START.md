# 🚀 Quick Start: Clubhouse DataGolf Integration

## 30-Second Overview

Clubhouse events can link to InPlay tournaments to automatically get golfers from DataGolf syncs. No code duplication, single source of truth.

## 🔧 Setup (One-Time)

### 1. Apply Database Migration (2 minutes)
```powershell
# Open SQL file
.\scripts\clubhouse\apply-tournament-linking-migration.ps1

# Copy SQL shown, paste into Supabase SQL Editor, run
```

**SQL to run**:
```sql
ALTER TABLE clubhouse_events 
ADD COLUMN linked_tournament_id UUID 
REFERENCES tournaments(id) ON DELETE SET NULL;

CREATE INDEX idx_clubhouse_events_linked_tournament 
ON clubhouse_events(linked_tournament_id);

COMMENT ON COLUMN clubhouse_events.linked_tournament_id IS 
'Optional link to InPlay tournament for automatic golfer sync from DataGolf';
```

### 2. Verify Installation
```powershell
.\scripts\clubhouse\test-datagolf-integration.ps1
```
Should show ✅ for all tests.

## 📖 Usage

### Create Linked Event
1. Admin → Clubhouse → Create Event
2. Fill in event details
3. **NEW**: Select tournament from dropdown
4. Save → All 5 competitions created

### Edit Event
1. Admin → Clubhouse → Events → Edit
2. **NEW**: Change linked tournament dropdown
3. Save → Group assignment updates

### Sync Tournament (Triggers Auto-Link)
1. Admin → Tournaments → Select tournament
2. Click "Sync Golfers from DataGolf"
3. Console shows:
   ```
   ✅ 156 golfers synced
   ✅ Golfer group created
   ✅ Linked to 3 InPlay competitions
   🔗 Found 1 linked Clubhouse events
   ✅ Auto-assigned to 5 Clubhouse competitions
   ```

### User Experience
User opens Clubhouse event → Sees golfers from DataGolf sync → Builds team

## 🎯 Key Files Modified

| File | Change |
|------|--------|
| `clubhouse_events` table | Added `linked_tournament_id` column |
| `apps/admin/.../create/page.tsx` | Tournament dropdown |
| `apps/admin/.../edit/page.tsx` | Tournament dropdown |
| `/api/clubhouse/events/route.ts` | Accept linked_tournament_id |
| `/api/clubhouse/events/[id]/route.ts` | Return linked_tournament_id |
| `/api/tournaments/[id]/sync-golfers/route.ts` | Check & assign to linked events |

## 🔍 Console Output to Watch For

**When syncing InPlay tournament**:
```
🔄 Syncing golfers for tournament abc-123...
📡 DataGolf field-updates response: 156 golfers
✅ Upserted 156 golfers
👥 Creating/updating golfer group...
✅ Created new group: def-456
🔗 Linking group to tournament competitions...
✅ Linked group to 3 competitions
🏡 Checking for linked Clubhouse events...        ← NEW
🔗 Found 1 linked Clubhouse events                ← NEW
✅ Auto-assigned golfer group to 5 Clubhouse competitions  ← NEW
   • Masters Clubhouse Championship              ← NEW
```

## ⚡ Quick Commands

```powershell
# Apply migration
cd scripts\clubhouse
.\apply-tournament-linking-migration.ps1

# Test installation
.\test-datagolf-integration.ps1

# View full docs
notepad CLUBHOUSE-DATAGOLF-INTEGRATION.md

# Commit changes
git add .
git commit -m "feat: Clubhouse DataGolf integration (Option A)"
git push origin main
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Dropdown empty | Check active InPlay tournaments exist (`upcoming`, `registration_open`, `in_progress` status) |
| Golfers not syncing | Check console output during InPlay sync for "🏡 Checking..." messages |
| Column error | Apply migration: `.\apply-tournament-linking-migration.ps1` |
| Manual groups not working | Set dropdown to "None" to use manual golfer group assignment |

## 💡 Pro Tips

1. **Link before sync**: Create clubhouse event with linked tournament BEFORE running DataGolf sync
2. **Multiple events**: Multiple clubhouse events can link to same tournament
3. **Manual override**: Set dropdown to "None" to use custom golfer groups
4. **Unlinking**: Change dropdown to "None" or delete tournament to unlink (safe, reverts to manual)

## 📚 Full Documentation

- **Complete Guide**: `scripts/clubhouse/CLUBHOUSE-DATAGOLF-INTEGRATION.md`
- **Implementation Summary**: `scripts/clubhouse/IMPLEMENTATION-SUMMARY.md`
- **Salary System**: `scripts/clubhouse/SALARY-SYSTEM.md`
- **Test Script**: `scripts/clubhouse/test-datagolf-integration.ps1`

## ✅ Success Checklist

- [ ] Migration applied in Supabase
- [ ] Test script shows all ✅
- [ ] Tournament dropdown visible in create/edit
- [ ] Can select tournament from dropdown
- [ ] InPlay sync shows "🏡 Checking for linked Clubhouse events"
- [ ] Team builder shows correct golfers
- [ ] No TypeScript errors
- [ ] Changes committed to git

---

**Status**: ✅ Ready for testing  
**Risk**: LOW (fully backward compatible)  
**Next**: Apply migration → Test → Commit → Deploy
