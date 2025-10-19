# 📸 Visual Guide - What You'll See

## Before Running Migration
❌ **Golfers tab won't work** - You'll get database errors

---

## After Running Migration

### 1. Tournament Edit Page - New Navigation

When you click "Edit" on a tournament, you'll see:

```
┌─────────────────────────────────────────────────────────┐
│ ← Back to Tournaments                                   │
│                                                          │
│ The Masters 2025                                         │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐  ┌──────────────┐              │
│ │ 📋 Details &        │  │ ⛳ Golfers   │              │
│ │    Competitions     │  │              │              │
│ │   (highlighted)     │  │              │              │
│ └─────────────────────┘  └──────────────┘              │
├─────────────────────────────────────────────────────────┤
│ Basic Information                                        │
│ Tournament Name: [The Masters 2025]                     │
│ Slug: [masters-2025]                                    │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

### 2. Click "⛳ Golfers" Tab

You'll see:

```
┌─────────────────────────────────────────────────────────┐
│ ← Back to Tournaments                                   │
│                                                          │
│ Tournament Golfers                                       │
├─────────────────────────────────────────────────────────┤
│ ┌──────────────────┐  ┌─────────────────────┐          │
│ │ 📋 Details &     │  │ ⛳ Golfers          │          │
│ │    Competitions  │  │   (highlighted)     │          │
│ └──────────────────┘  └─────────────────────┘          │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🌐 Import from OWGR Website                         │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ + Add Existing Group                                │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Manage All Groups                                   │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Assigned Golfer Groups (0)                              │
│                                                          │
│ No golfer groups assigned yet                           │
│ Click "Import from OWGR Website" to create a group...  │
└─────────────────────────────────────────────────────────┘
```

### 3. Click "🌐 Import from OWGR Website"

Modal appears:

```
┌──────────────────────────────────────────────────┐
│ Import Golfers from OWGR Website                 │
├──────────────────────────────────────────────────┤
│                                                  │
│ OWGR Event URL *                                 │
│ ┌──────────────────────────────────────────────┐ │
│ │ https://www.owgr.com/events?eventId=...     │ │
│ └──────────────────────────────────────────────┘ │
│ Example: https://www.owgr.com/events?...         │
│                                                  │
│ Group Name *                                     │
│ ┌──────────────────────────────────────────────┐ │
│ │ Masters 2024 - Full Field                   │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│              [Cancel]  [Import Golfers]          │
└──────────────────────────────────────────────────┘
```

### 4. After Successful Import

```
┌─────────────────────────────────────────────────────────┐
│ ✅ Imported 96 golfers into group "Masters 2024 - Full" │
├─────────────────────────────────────────────────────────┤
│ Assigned Golfer Groups (1)                              │
│                                                          │
│ ┌───────────────────────────────────────────────────┐   │
│ │ 🟢 Masters 2024 - Full Field    [View/Edit] [Remove]│
│ │ 96 golfers                                        │   │
│ │ Imported from OWGR: https://www.owgr.com/...      │   │
│ │ Added 10/19/2025                                  │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 5. Click "View/Edit" on a Group

(This page needs to be created, but the link is there)

---

## Navigation Flow

```
Tournaments List
    │
    ├─→ Edit Tournament
    │   ├─→ 📋 Details & Competitions Tab (default)
    │   │   └─→ Tournament info, Add competitions, etc.
    │   │
    │   └─→ ⛳ Golfers Tab (NEW!)
    │       ├─→ Import from OWGR
    │       ├─→ Add Existing Group
    │       └─→ View Assigned Groups
    │
    └─→ Golfers (future page)
        └─→ Manage All Groups
```

---

## Color Code

### Navigation Tabs
- **Active tab**: Blue background, white text
- **Inactive tab**: Gray background, gray text

### Buttons
- **🌐 Import from OWGR**: Green (primary action)
- **+ Add Existing Group**: Blue (secondary action)
- **Manage All Groups**: Purple (navigation)
- **View/Edit**: Blue (action)
- **Remove**: Red (danger)

### Groups
Each group has a color indicator:
- 🟢 **Green** - Imported from OWGR
- 🟡 **Gold** - After-cut groups
- 🔵 **Blue** - Championship groups
- 🔴 **Red** - Elite/special groups

---

## Step-by-Step Visual Walkthrough

### Step 1: Start Here
```
Your Admin Dashboard
    ↓
Tournaments (click)
    ↓
List of Tournaments
    ↓
[Edit] button on any tournament (click)
```

### Step 2: You're Now Here
```
Tournament Edit Page
    ↓
See 2 tabs at top:
├─ 📋 Details & Competitions (currently showing)
└─ ⛳ Golfers (click this!)
```

### Step 3: Golfers Tab
```
Tournament Golfers Page
    ↓
3 buttons visible:
├─ 🌐 Import from OWGR Website (click this!)
├─ + Add Existing Group
└─ Manage All Groups
```

### Step 4: Import Modal
```
Import from OWGR Website Modal
    ↓
2 fields to fill:
├─ OWGR Event URL (paste test URL)
└─ Group Name (type a name)
    ↓
Click [Import Golfers]
    ↓
Wait 5-10 seconds...
    ↓
✅ Success message!
```

### Step 5: See Result
```
Back on Golfers Tab
    ↓
Group now appears in list:
    🟢 [Your Group Name]
    96 golfers
    [View/Edit] [Remove]
```

---

## Test URLs Reference

Copy and paste these into the "OWGR Event URL" field:

### The Masters 2024
```
https://www.owgr.com/events?eventId=11806&year=2024
```
Expected: ~96 golfers

### PGA Championship 2024
```
https://www.owgr.com/events?eventId=11807&year=2024
```
Expected: ~156 golfers

### U.S. Open 2024
```
https://www.owgr.com/events?eventId=11808&year=2024
```
Expected: ~156 golfers

---

## What Each Button Does

### 🌐 Import from OWGR Website
- Opens modal
- You paste OWGR event URL
- You name the group
- System fetches golfers from website
- Creates group automatically
- Assigns to this tournament

### + Add Existing Group
- Shows dropdown of groups you've already created
- Click a group to assign it to this tournament
- Instant - no modal

### Manage All Groups
- Takes you to master groups page (to be created)
- View all groups across all tournaments
- Create/edit/delete groups

### View/Edit (on a group)
- Takes you to group details page (to be created)
- See all golfers in this group
- Add/remove individual golfers
- Edit group name/description

### Remove (on a group)
- Removes group from THIS tournament only
- Group still exists in master list
- Can be re-added later

---

## Common Questions

**Q: What happens if I remove a group?**
A: It's only removed from this tournament. The group and its golfers still exist in the system.

**Q: Can I add the same group to multiple tournaments?**
A: Yes! That's the whole point. Create once, use many times.

**Q: What if OWGR import fails?**
A: Check the URL is correct, try a different event, or create groups manually.

**Q: Can I edit golfers after importing?**
A: Yes, click "View/Edit" on the group (page to be created).

**Q: Where do I see all my groups?**
A: Click "Manage All Groups" (page to be created) or go to `/golfers/groups`.

---

**Ready to try?** Go run the migration then refresh your admin app!
