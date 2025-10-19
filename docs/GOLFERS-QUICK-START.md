# 🎯 Quick Start - Tournament Golfers System

## ⚠️ FIRST: Run Database Migrations
**CRITICAL**: Open Supabase Dashboard → SQL Editor → Run these 2 files:
1. `scripts/2025-01-remove-unique-competition-constraint.sql`
2. `scripts/2025-01-tournament-golfers.sql`

See `docs/RUN-THESE-MIGRATIONS.md` for detailed instructions.

---

## 🎮 New Features

### 1. Golfers Master List
**URL**: `http://localhost:3002/golfers`

**What you can do**:
- ✅ View all golfers
- ✅ Add new golfers (first name, last name, image URL, external ID)
- ✅ Edit existing golfers
- ✅ Delete golfers
- ✅ See golfer avatars (image or initials)

**Sample Data**: 5 pro golfers included (Tiger Woods, Rory McIlroy, Jon Rahm, Scottie Scheffler, Brooks Koepka)

---

### 2. Assign Golfers to Tournaments
**Location**: Tournament edit page `/tournaments/[id]` → "Tournament Golfers" section

**What you can do**:
- ✅ See all golfers assigned to this tournament
- ✅ Add golfers from dropdown (shows only available golfers)
- ✅ Remove golfers from tournament
- ✅ Warning if no golfers assigned

**⚠️ Important**: Tournament must have golfers before going live!

---

## 🚀 Quick Test Flow

1. **Run migrations** (see above)

2. **View sample golfers**:
   - Go to `http://localhost:3002/golfers`
   - You should see 5 golfers

3. **Add golfer to tournament**:
   - Go to any tournament edit page
   - Scroll to "Tournament Golfers" section
   - Click "Add Golfer"
   - Click a golfer from dropdown
   - ✅ Golfer added!

4. **Create your own golfer**:
   - Go to `/golfers`
   - Click "Add Golfer"
   - Fill in first name and last name
   - (Optional) Add image URL and external ID
   - Click "Create Golfer"
   - ✅ Now you can add them to tournaments!

---

## 📁 Files Created

### Database
- `scripts/2025-01-tournament-golfers.sql` - Creates golfers tables

### API Routes
- `apps/admin/src/app/api/golfers/route.ts` - Master golfers CRUD
- `apps/admin/src/app/api/tournaments/[id]/golfers/route.ts` - Tournament golfers

### UI Pages
- `apps/admin/src/app/golfers/page.tsx` - Master golfers page
- `apps/admin/src/app/tournaments/[id]/page.tsx` - Updated with golfers section

### Documentation
- `docs/RUN-THESE-MIGRATIONS.md` - Migration instructions
- `docs/TOURNAMENT-GOLFERS-COMPLETE.md` - Full implementation details
- `docs/GOLFERS-QUICK-START.md` - This file!

---

## 🎨 UI Screenshots (What to Expect)

### Golfers Page
```
┌────────────────────────────────────────────────┐
│ Golfers                    [+ Add Golfer]      │
│ Manage golfers who can be added to tournaments │
├────────────────────────────────────────────────┤
│ Name           | Image  | External ID | Actions│
│ Brooks Koepka  | [IMG]  | —          | [Edit] [Delete]
│ Jon Rahm       | [IMG]  | —          | [Edit] [Delete]
│ Rory McIlroy   | [IMG]  | —          | [Edit] [Delete]
│ Scottie Scheff | [IMG]  | —          | [Edit] [Delete]
│ Tiger Woods    | [IMG]  | —          | [Edit] [Delete]
└────────────────────────────────────────────────┘
```

### Tournament Golfers Section
```
┌────────────────────────────────────────────────┐
│ Tournament Golfers    [Manage All] [+ Add]     │
│ 3 golfers assigned                             │
├────────────────────────────────────────────────┤
│ [IMG] Tiger Woods        [Remove]              │
│ [IMG] Rory McIlroy       [Remove]              │
│ [IMG] Jon Rahm           [Remove]              │
└────────────────────────────────────────────────┘
```

---

## ⚡ Coming Soon (Not Yet Implemented)

- CSV bulk import
- API integration for external golfer data
- Image upload (currently must provide URL)
- Validation to prevent 'live' status without golfers

---

## 🐛 Troubleshooting

**Can't access `/golfers` page**:
- Did you run the migrations?
- Is admin app running on port 3002?
- Check browser console for errors

**"This golfer is already added to this tournament"**:
- You can't add the same golfer twice
- Remove first, then re-add

**Can't delete golfer**:
- Golfer must not be assigned to any tournaments
- Remove from all tournaments first

**No golfers showing**:
- Run migration: `2025-01-tournament-golfers.sql`
- Check Supabase dashboard → Table Editor → golfers

---

**Status**: ✅ Ready to test!
**Documentation**: See `TOURNAMENT-GOLFERS-COMPLETE.md` for full details
