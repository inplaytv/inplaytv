# Notification System Setup Guide

## Overview

The notification system alerts users about important tournament and competition events:
- ⏰ **Tee Times Available** - When DataGolf tee times are synced
- ⚠️ **Registration Closing** - 1-2 hours before competition registration closes
- 🟢 **Registration Open** - When new competitions open (future enhancement)
- 🏌️ **Tournament Live** - When tournaments start (future enhancement)
- 🔴 **Competition Live** - When competitions go live (future enhancement)

## Database Setup

### Step 1: Run the main migration

```sql
-- Run this in Supabase SQL Editor
-- File: NOTIFICATION-SYSTEM-MIGRATION.sql
```

This creates:
- `notifications` table with RLS policies
- `notification_preferences` table for user settings
- Database functions for sending notifications
- Indexes for performance

### Step 2: Add notified_closing column

```sql
-- Run this in Supabase SQL Editor
-- File: ADD-NOTIFIED-CLOSING-COLUMN.sql
```

This adds the `notified_closing` flag to track which competitions have been notified.

## Features

### 1. Tee Times Available Notifications ✅

**Trigger:** Automatically sent when DataGolf tee times are synced via the "Sync DataGolf" button.

**Location:** `apps/admin/src/app/api/tournaments/[id]/sync-golfers/route.ts` (lines 187-197)

**How it works:**
1. Admin clicks "Sync DataGolf" button
2. API fetches tee times from DataGolf
3. Updates tournament round times
4. Calls `notify_tee_times_available()` function
5. Function sends notification to all users with preference enabled
6. Auto-calculates competition registration times

**Recipients:** All users with `tee_times_available` preference = TRUE

### 2. Registration Closing Notifications ✅

**Trigger:** Cron job checks every hour for competitions closing soon.

**Location:** `apps/admin/src/app/api/notifications/check-closing/route.ts`

**How it works:**
1. Cron job calls `/api/notifications/check-closing` every hour
2. Finds competitions closing in 1-2 hours
3. Sends notifications only to users who haven't entered yet
4. Marks competition as `notified_closing = true` to prevent spam

**Recipients:** Users who:
- Have `registration_closing` preference = TRUE
- Have NOT entered the competition yet
- Are onboarded

### 3. Notification Bell UI ✅

**Location:** `apps/golf/src/components/NotificationBell.tsx`

**Features:**
- Shows unread count badge (🔔 with red number)
- Real-time updates via Supabase subscriptions
- Dropdown panel with last 20 notifications
- "Mark all read" button
- Click notification to mark as read and navigate
- Time ago formatting (e.g., "5m ago", "2h ago")
- Icons based on notification type

**Integrated in:** Golf app header (top right, between logo and user menu)

## Cron Job Setup

### Option 1: Vercel Cron Jobs (Recommended)

Add to `vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/notifications/check-closing",
      "schedule": "0 * * * *"
    }
  ]
}
```

This runs every hour on the hour (e.g., 1:00, 2:00, 3:00, etc.)

### Option 2: External Cron Service

Use a service like Cron-job.org, EasyCron, or GitHub Actions:

**URL:** `https://admin.inplay.tv/api/notifications/check-closing`  
**Method:** POST  
**Schedule:** `0 * * * *` (every hour)  
**Headers:** 
```
Authorization: Bearer YOUR_CRON_SECRET
Content-Type: application/json
```

Set `CRON_SECRET` environment variable in Vercel for security.

### Option 3: Manual Testing (Development)

Test locally by calling the endpoint:

```bash
curl -X POST http://localhost:3002/api/notifications/check-closing \
  -H "Content-Type: application/json"
```

## Environment Variables

Add to `.env.local` and Vercel:

```bash
# Optional: Secure your cron endpoint
CRON_SECRET=your-random-secret-here

# Required: Supabase credentials (should already exist)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## User Preferences

Users can control which notifications they receive. Default preferences (all enabled):

```typescript
{
  tee_times_available: true,
  registration_closing: true,
  registration_closing_hours: 1, // Alert X hours before
  registration_open: true,
  tournament_live: true,
  competition_live: true
}
```

**Future Enhancement:** Create a preferences page in the golf app where users can toggle these settings.

## Testing

### Test Tee Times Notification

1. Go to admin app: `http://localhost:3002/tournament-lifecycle`
2. Click "Manage" on any tournament
3. Click "Sync from DataGolf" in the registration modal
4. Check golf app notifications bell (should show new notification)

### Test Registration Closing Notification

1. Create a competition with `reg_close_at` set to 1.5 hours from now
2. Call the cron endpoint:
   ```bash
   curl -X POST http://localhost:3002/api/notifications/check-closing
   ```
3. Check golf app notifications bell

### Test Real-Time Updates

1. Open golf app in two browser tabs
2. In tab 1, keep notifications bell closed
3. In Supabase SQL Editor, manually insert a notification:
   ```sql
   INSERT INTO notifications (user_id, type, title, message, link)
   VALUES (
     'your-user-id',
     'registration_closing',
     'Test Notification',
     'This is a test message',
     '/tournaments'
   );
   ```
4. Tab 1 should instantly show the new notification without refresh

## API Endpoints

### POST `/api/notifications/check-closing`
**Purpose:** Check for competitions closing soon and send notifications  
**Auth:** Optional Bearer token (CRON_SECRET)  
**Schedule:** Every hour  
**Returns:**
```json
{
  "success": true,
  "message": "Sent 25 notifications for 3 competitions",
  "total_notified": 25,
  "competitions_checked": 3,
  "results": [...]
}
```

## Database Queries

### Get user's unread notifications
```sql
SELECT * FROM notifications
WHERE user_id = 'user-id'
AND read = FALSE
ORDER BY created_at DESC;
```

### Get notification stats
```sql
SELECT 
  type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE read = TRUE) as read_count,
  COUNT(*) FILTER (WHERE read = FALSE) as unread_count
FROM notifications
WHERE user_id = 'user-id'
GROUP BY type;
```

### Find competitions needing notification
```sql
SELECT 
  tc.*,
  t.name as tournament_name,
  ct.name as competition_name
FROM tournament_competitions tc
JOIN tournaments t ON t.id = tc.tournament_id
JOIN competition_types ct ON ct.id = tc.competition_type_id
WHERE tc.status = 'reg_open'
AND tc.reg_close_at BETWEEN NOW() + INTERVAL '1 hour' AND NOW() + INTERVAL '2 hours'
AND (tc.notified_closing IS NULL OR tc.notified_closing = FALSE);
```

## Troubleshooting

### Notifications not appearing
1. Check if database migration ran successfully
2. Verify RLS policies are enabled
3. Check browser console for Supabase errors
4. Verify user has `notification_preferences` row (auto-created on first login)

### Cron job not running
1. Check Vercel deployment logs
2. Verify `vercel.json` is committed to Git
3. Test endpoint manually with curl
4. Check for 401 errors (CRON_SECRET mismatch)

### Duplicate notifications
1. Check if `notified_closing` flag is being set properly
2. Verify cron job isn't running too frequently
3. Check for race conditions in parallel executions

## Future Enhancements

1. **Notification Preferences UI** - Settings page where users can toggle notification types
2. **Email Notifications** - Send critical notifications via email (Resend/SendGrid)
3. **Push Notifications** - Browser push API for desktop/mobile alerts
4. **Notification Groups** - Collapse multiple similar notifications
5. **Notification History** - Archive and search old notifications
6. **Admin Dashboard** - View notification stats and logs
7. **Custom Alerts** - Let users set custom time thresholds
8. **Tournament Following** - Notify users about specific tournaments they follow

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Notification Flow                        │
└─────────────────────────────────────────────────────────────┘

1. TEE TIMES AVAILABLE:
   Admin clicks "Sync DataGolf" 
   → sync-golfers API 
   → notify_tee_times_available() 
   → Insert notifications for all users
   → Real-time subscription triggers
   → Notification bell updates

2. REGISTRATION CLOSING:
   Cron job (hourly)
   → check-closing API
   → Query competitions closing in 1-2h
   → notify_registration_closing()
   → Insert notifications for non-entered users
   → Set notified_closing = true
   → Real-time subscription triggers
   → Notification bell updates

3. NOTIFICATION BELL:
   User opens golf app
   → AuthContext loads session
   → NotificationBell component mounts
   → Load last 20 notifications
   → Subscribe to real-time updates
   → Show badge with unread count
   → Click to open dropdown
   → Click notification to mark read + navigate
```

## Summary

✅ Database schema created  
✅ Tee times notifications integrated  
✅ Registration closing API created  
✅ Notification bell UI built  
✅ Real-time subscriptions working  
⏳ Cron job needs setup in Vercel  
⏳ User preferences UI (future)  
⏳ Email notifications (future)  

The system is ready to use! Just need to:
1. Run the SQL migrations in Supabase
2. Set up the cron job in Vercel
3. Test both notification types
