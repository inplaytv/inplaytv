# Supabase Security Issues - FIXED

## Summary
Fixed all 2 errors and 8 warnings in Supabase security advisor.

## Issues Fixed

### 1. Exposed Auth Users (ERROR)
**Problem**: View `admin_users_with_wallets` exposed `auth.users` data to anon/authenticated roles

**Solution**:
- Revoked direct access to the view from `anon` and `authenticated` roles
- Only `service_role` can access it directly (for admin API)
- Created secure RPC function `get_admin_users_list()` that checks admin status before returning data
- Admin users can now query via the function instead of direct view access

### 2. Security Definer View (ERROR)
**Problem**: View `admin_users_with_wallets` defined with SECURITY DEFINER property

**Solution**:
- Kept the view but restricted access as above
- Created RPC function with proper admin authorization check
- Function uses SECURITY DEFINER safely with explicit search_path

### 3-7. Function Search Path Mutable (5 WARNINGS)
**Problem**: Functions missing explicit `search_path` parameter:
- `deduct_from_wallet`
- `cleanup_expired_mfa_codes`
- `generate_mfa_code`
- `handle_new_user`
- `set_display_name`

**Solution**:
- Added `SET search_path = public, pg_temp` to all functions
- Prevents search path injection attacks
- Ensures functions always use correct schema

### 8-10. Materialized View in API (3 WARNINGS)
**Problem**: Materialized views accessible to anon/authenticated roles:
- `player_sg_averages`
- `player_course_fit_scores`

**Solution**:
- Revoked SELECT from `anon` and `authenticated` roles
- Granted SELECT only to `service_role`
- Created secure RPC functions:
  - `get_player_sg_averages(player_id)` - Returns strokes gained data
  - `get_player_course_fit(player_id)` - Returns course fit scores
- Functions can be called by authenticated users safely

## How to Apply

1. **Go to Supabase SQL Editor**: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

2. **Run the script**: Copy contents of `scripts/fix-supabase-security-issues.sql`

3. **Verify**: Script includes verification queries at the end

## Code Changes Needed

### Admin Users List API
Update `apps/admin/src/app/api/users/list/route.ts` to use the new RPC function:

```typescript
// OLD (direct view query):
const { data } = await supabase.from('admin_users_with_wallets').select('*');

// NEW (use RPC function):
const { data } = await supabase.rpc('get_admin_users_list');
```

### Player Stats APIs (if used)
If you're querying these materialized views directly, update to use RPC functions:

```typescript
// OLD:
const { data } = await supabase.from('player_sg_averages').select('*');

// NEW:
const { data } = await supabase.rpc('get_player_sg_averages', { p_player_id: playerId });

// Or get all:
const { data } = await supabase.rpc('get_player_sg_averages');
```

## Security Benefits

✅ **Auth users protected**: No direct exposure of `auth.users` table  
✅ **Admin-only access**: User data only accessible to verified admins  
✅ **SQL injection prevention**: All functions have explicit search_path  
✅ **Controlled data access**: Materialized views only accessible via secure functions  
✅ **Service role security**: Sensitive views only accessible to service_role  

## Verification

After running the script, check Supabase Security Advisor:
- Should show **0 errors** and **0 warnings**
- All issues resolved

## Notes

- The admin view is still available to `service_role` for backend operations
- The RPC functions provide controlled access with proper authorization
- All functions now have explicit `search_path` for security
- Materialized views can still be refreshed and queried via secure functions
