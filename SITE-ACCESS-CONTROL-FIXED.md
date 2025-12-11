# Site Access Control - FIXED ✅

## What Was Fixed

The homepage access control system is now fully functional. The admin can control all public access through **Admin → Settings → Site Settings**.

## How It Works

### 3 Modes Available:

1. **🟢 Live Mode** (Default)
   - Website fully operational
   - All features accessible
   - Users can sign up, login, play

2. **🚀 Coming Soon Mode**
   - Shows "Coming Soon" splash page
   - All public access redirected
   - Only admins can access the site

3. **🔧 Maintenance Mode**
   - Shows "Under Maintenance" page
   - All public access blocked
   - Only admins can access the site

## Implementation Details

### 1. Database Setup

The `site_settings` table stores the maintenance mode:

```sql
-- Run in Supabase SQL Editor if not already created
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES ('maintenance_mode', 'live')
ON CONFLICT (setting_key) DO NOTHING;
```

### 2. Middleware Enforcement

**Web App** (`apps/web/src/middleware.ts`):
- Checks `site_settings` table for current mode
- Verifies if user is admin (admins bypass restrictions)
- Redirects non-admins to `/coming-soon` or `/maintenance`
- Caches the mode check for performance

**Golf App** (`apps/golf/src/middleware.ts`):
- Same logic as web app
- Redirects to web app's maintenance pages

### 3. Admin Control Panel

**Location**: Admin → Settings → Site

**Features**:
- One-click mode switching
- Visual status indicators
- Real-time updates
- Clear descriptions of each mode

### 4. Special Pages Created

**Coming Soon Page** (`apps/web/src/app/coming-soon/page.tsx`):
- Beautiful gradient design
- "Launching soon" message
- Countdown placeholder
- Mobile responsive

**Maintenance Page** (`apps/web/src/app/maintenance/page.tsx`):
- Professional maintenance notice
- Service unavailable warning
- Contact information
- Dark themed design

## How to Use

### For Admins:

1. **Navigate to Settings**:
   - Login to Admin Panel (port 3002)
   - Click "Settings" in sidebar
   - Click "Site" submenu

2. **Change Mode**:
   - Click on desired mode (Live/Coming Soon/Maintenance)
   - Change takes effect immediately
   - All users see the change within seconds

3. **Admin Access**:
   - Admins can always access all apps
   - No restrictions apply to admin users
   - Test the site in any mode

### For Testing:

```bash
# 1. Set to Coming Soon mode in admin panel
# 2. Open new incognito window
# 3. Visit http://localhost:3000
# Expected: See "Coming Soon" page

# 4. Set to Maintenance mode
# 5. Refresh incognito window
# Expected: See "Under Maintenance" page

# 6. Set back to Live mode
# 7. Refresh
# Expected: See normal homepage
```

## Security Features

✅ **Admin-Only Control**: Only admins can change site mode  
✅ **Admin Bypass**: Admins always have full access  
✅ **Immediate Effect**: Changes apply instantly  
✅ **Database Persistent**: Settings survive server restarts  
✅ **Per-Request Check**: Middleware checks on every request  
✅ **Fallback Safety**: Defaults to "live" if database unavailable  

## Architecture

```
┌─────────────────────────────────────────┐
│  User visits site (any app)             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Middleware intercepts request          │
│  - Checks site_settings table           │
│  - Gets maintenance_mode value          │
└──────────────┬──────────────────────────┘
               │
               ▼
        ┌──────┴──────┐
        │  Is Admin?  │
        └──────┬──────┘
         Yes ┌─┴─┐ No
             │   │
             ▼   ▼
        ┌────┴───┴────┐
        │   Is Live?  │
        └────┬───┬────┘
         Yes │   │ No
             ▼   ▼
        ┌────┴───┴──────────────┐
        │  Allow │ Redirect to  │
        │ Access │ Coming Soon  │
        │        │ or Maint.    │
        └─────────────────────────┘
```

## Files Modified

1. ✅ `apps/web/src/middleware.ts` - Added maintenance mode checking
2. ✅ `apps/golf/src/middleware.ts` - Added maintenance mode checking
3. ✅ `apps/web/src/app/coming-soon/page.tsx` - New coming soon page
4. ✅ `apps/web/src/app/maintenance/page.tsx` - New maintenance page
5. ✅ `apps/admin/src/app/settings/site/page.tsx` - Already existed (working)
6. ✅ `apps/admin/src/app/api/settings/site/route.ts` - Already existed (working)

## API Endpoints

### Get Site Settings
```typescript
GET /api/settings/site
Response: { maintenance_mode: 'live' | 'coming-soon' | 'maintenance' }
```

### Update Site Settings
```typescript
PUT /api/settings/site
Body: { maintenance_mode: 'live' | 'coming-soon' | 'maintenance' }
Response: { success: true, maintenance_mode: '...' }
```

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Performance Notes

- Middleware checks database on each request
- Consider adding caching/Redis for high traffic
- Admin checks are fast (indexed table lookup)
- Default fallback prevents outages

## Troubleshooting

**Issue**: Changes not taking effect
- **Solution**: Clear browser cache, try incognito mode

**Issue**: Admins being blocked
- **Solution**: Verify user is in `admins` table

**Issue**: Site stuck in maintenance
- **Solution**: Update directly in Supabase SQL Editor:
  ```sql
  UPDATE site_settings 
  SET setting_value = 'live' 
  WHERE setting_key = 'maintenance_mode';
  ```

**Issue**: Database connection error
- **Solution**: Check SUPABASE_SERVICE_ROLE_KEY is set correctly

## Next Steps

Optional enhancements:
- [ ] Add scheduled maintenance windows
- [ ] Email notifications when mode changes
- [ ] Whitelist specific IPs in maintenance mode
- [ ] Custom maintenance messages per mode
- [ ] Maintenance mode history/audit log
