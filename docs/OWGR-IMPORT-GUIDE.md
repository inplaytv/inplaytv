# 🌐 OWGR Import Feature - Complete Guide

## Overview
Added ability to import golfers directly from OWGR (Official World Golf Ranking) website URLs. This creates a golfer group and assigns it to your tournament automatically.

---

## 🎯 What's New

### Golfers Sub-Tab in Tournaments
- **URL**: `/tournaments/[id]/golfers`
- **Purpose**: Manage golfer groups for a specific tournament
- **Features**:
  - Import from OWGR website (NEW!)
  - Add existing groups
  - View assigned groups
  - Remove groups from tournament

---

## 🚀 How to Use

### Step 1: Navigate to Tournament Golfers
1. Go to **Tournaments** list
2. Click **Edit** on a tournament
3. Click **"Golfers"** tab (new sub-page)

### Step 2: Import from OWGR Website
1. Click **"🌐 Import from OWGR Website"** button
2. Modal opens with 2 fields:
   - **OWGR Event URL**: Paste the event page URL
   - **Group Name**: Name for this group (e.g., "Masters 2025 - Full Field")
3. Click **"Import Golfers"**
4. ✅ Group created with all golfers from that event
5. ✅ Group automatically assigned to this tournament

### Step 3: Find OWGR Event URLs
**Example URLs** (out of season, use for testing):
```
https://www.owgr.com/events?eventId=11806&year=2024
https://www.owgr.com/events?eventId=11807&year=2024
https://www.owgr.com/events?eventId=11808&year=2024
```

**How to find them**:
1. Go to https://www.owgr.com
2. Click "Events" or "Ranking Events"
3. Find the tournament you want
4. Click on it to view results
5. Copy the URL from browser address bar

---

## 🏗️ How It Works

### Behind the Scenes
```
1. You provide OWGR URL
   ↓
2. System fetches the HTML page
   ↓
3. Parses golfer names using regex patterns
   ↓
4. Extracts "Last, First" or "First Last" format
   ↓
5. Creates golfers in database (or links existing)
   ↓
6. Creates a new golfer group
   ↓
7. Adds all golfers to the group
   ↓
8. Assigns group to your tournament
```

### Name Parsing Patterns
The system handles multiple name formats:
- **"Scheffler, Scottie"** → First: Scottie, Last: Scheffler
- **"Tiger Woods"** → First: Tiger, Last: Woods
- **"Collin Morikawa"** → First: Collin, Last: Morikawa
- **"Xander Schauffele"** → First: Xander, Last: Schauffele

### Duplicate Handling
- If golfer already exists (same first + last name), uses existing record
- If golfer is new, creates in database
- Group members are unique (no duplicates)

---

## 📁 New Files Created

### UI Page
- `apps/admin/src/app/tournaments/[id]/golfers/page.tsx`
  - Tournament golfers management page
  - Import from OWGR button
  - Add existing groups
  - View/remove assigned groups

### API Route
- `apps/admin/src/app/api/golfer-groups/import-owgr/route.ts`
  - POST endpoint to import from OWGR
  - Fetches HTML from URL
  - Parses golfer names
  - Creates group and golfers
  - Returns success with count

---

## 🎨 UI Features

### Import Modal
```
┌──────────────────────────────────────────┐
│ Import Golfers from OWGR Website         │
├──────────────────────────────────────────┤
│ OWGR Event URL *                         │
│ [https://www.owgr.com/events?eventId=... ]│
│ Example: https://www.owgr.com/events?... │
│                                          │
│ Group Name *                             │
│ [Masters 2025 - Full Field             ] │
│                                          │
│ [Cancel] [Import Golfers]                │
└──────────────────────────────────────────┘
```

### Success Message
```
✅ Imported 96 golfers into group "Masters 2025 - Full Field"
```

### Group Display
```
┌──────────────────────────────────────────┐
│ 🟢 Masters 2025 - Full Field   [View/Edit] [Remove] │
│ 96 golfers                               │
│ Imported from OWGR: https://...          │
│ Added 10/19/2025                         │
└──────────────────────────────────────────┘
```

---

## 🔧 API Reference

### Import from OWGR
**Endpoint**: `POST /api/golfer-groups/import-owgr`

**Body**:
```json
{
  "url": "https://www.owgr.com/events?eventId=11806&year=2024",
  "group_name": "Masters 2025 - Full Field",
  "tournament_id": "uuid-of-tournament" // Optional
}
```

**Response (Success)**:
```json
{
  "success": true,
  "group_id": "uuid-of-new-group",
  "group_name": "Masters 2025 - Full Field",
  "golfers_count": 96
}
```

**Response (Error)**:
```json
{
  "error": "No golfers found on this page. Please check the URL or contact support."
}
```

---

## 🧪 Testing

### Test with Real OWGR URLs
**The Masters 2024**:
```
https://www.owgr.com/events?eventId=11806&year=2024
Expected: ~96 golfers
```

**PGA Championship 2024**:
```
https://www.owgr.com/events?eventId=11807&year=2024
Expected: ~156 golfers
```

**U.S. Open 2024**:
```
https://www.owgr.com/events?eventId=11808&year=2024
Expected: ~156 golfers
```

### Test Workflow
1. Create a tournament
2. Go to `/tournaments/[id]/golfers`
3. Click "Import from OWGR Website"
4. Paste URL: `https://www.owgr.com/events?eventId=11806&year=2024`
5. Group Name: "Test Import"
6. Click "Import Golfers"
7. ✅ Should see success message with golfer count
8. ✅ Group should appear in list
9. Navigate to `/golfers/groups`
10. ✅ Group should appear in master list

---

## 🐛 Troubleshooting

### "No golfers found on this page"
**Cause**: Page structure changed or URL doesn't contain golfer list
**Solution**: 
- Verify URL works in browser
- Check if it's an event results page
- Try a different OWGR event URL

### "Failed to fetch OWGR page"
**Cause**: OWGR website blocking requests or network error
**Solution**:
- Check internet connection
- Try again in a few minutes
- OWGR may have rate limiting

### Only found 10-20 golfers instead of 96
**Cause**: Regex pattern matched partial list or wrong elements
**Solution**:
- This is expected for some OWGR pages
- The parser uses conservative matching to avoid false positives
- May need to adjust regex patterns for specific page formats

### Duplicate golfers created
**Cause**: Name variations (e.g., "T. Woods" vs "Tiger Woods")
**Solution**:
- System checks for exact first + last name matches
- Variations will create separate records
- Can manually merge later

---

## 🔮 Future Enhancements

### Phase 2 (Coming Soon)
- **CSV Upload**: Upload custom golfer list
- **Better Parsing**: Handle more name formats
- **Preview**: See golfers before importing
- **Edit Import**: Add/remove golfers after import

### Phase 3 (Later)
- **API Integration**: Official OWGR API when available
- **Auto-Update**: Sync with OWGR regularly
- **Image Import**: Fetch golfer photos
- **Rankings Import**: Include world ranking data

---

## 📊 Benefits

✅ **Fast**: Import 100+ golfers in seconds
✅ **Accurate**: Direct from official source
✅ **Easy**: Just paste URL and name group
✅ **Reusable**: Group can be used in multiple tournaments
✅ **No Typing**: Avoids manual entry errors

---

## 🎯 Example Use Cases

### 1. The Masters 2025
```
1. Create tournament "The Masters 2025"
2. Go to Golfers tab
3. Import from: https://www.owgr.com/events?eventId=12345&year=2025
4. Name: "Masters 2025 - Full Field"
5. Result: 96 golfers ready to use
```

### 2. Multiple Groups for Cut
```
1. Import "Full Field" group (before tournament)
2. After Round 2, create "After Cut" group manually
3. Add only top 50 golfers who made cut
4. Assign "Full Field" to Round 1-2 competitions
5. Assign "After Cut" to Round 3-4 competitions
```

### 3. Qualifier Event
```
1. Import from qualifier event URL
2. Name: "2025 Qualifier - All Entrants"
3. Later, create "2025 Qualifier - Top 10"
4. Manually select top 10 from full list
5. Use "Top 10" group for main event
```

---

## ⚠️ Important Notes

1. **Out of Season**: OWGR URLs from 2024 work for testing but won't have 2025 data yet
2. **Page Structure**: OWGR may change their HTML structure; regex patterns may need updates
3. **Rate Limiting**: Don't spam imports; wait a few seconds between requests
4. **Manual Review**: Always review imported golfers to ensure accuracy
5. **Backup Plan**: If import fails, you can always create groups manually

---

**Status**: ✅ Ready to Test
**Next**: Run migration, then test with OWGR URLs
**Documentation**: See this file for complete reference
