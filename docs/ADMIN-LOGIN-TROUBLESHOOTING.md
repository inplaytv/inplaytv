# Admin Login Troubleshooting Guide

## Issue: "Access denied. You must be an authorized admin."

### Most Common Causes:

1. **Admins table doesn't exist** - SQL migration not run
2. **User ID mismatch** - Using wrong user ID
3. **RLS blocking access** - Row Level Security preventing read
4. **Wrong database** - Adding to wrong Supabase project

---

## Step-by-Step Fix:

### 1. Verify SQL Migrations Are Run

Open [Supabase SQL Editor](https://supabase.com/dashboard/project/qemosikbhrnstcormhuz/sql/new) and run:

```sql
-- Check if admins table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'admins'
) as table_exists;
```

**If it returns `false`**, you need to run the migration:

```sql
-- Copy and paste contents of: docs/sql/2025-02-admins.sql
-- Then run it in SQL Editor
```

### 2. Find Your User ID

```sql
-- List all users
SELECT 
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC;
```

Copy the `id` (UUID) of your user account.

### 3. Add Yourself as Admin

```sql
-- Replace with your actual user ID from step 2
INSERT INTO public.admins(user_id) 
VALUES ('paste-your-uuid-here')
ON CONFLICT (user_id) DO NOTHING;
```

### 4. Verify It Worked

```sql
-- Should show your email and user_id
SELECT 
  a.user_id,
  u.email,
  a.created_at as admin_since
FROM public.admins a
JOIN auth.users u ON u.id = a.user_id;
```

### 5. Test Login Again

1. Go to http://localhost:3002/login
2. Sign in with your email/password
3. Open browser console (F12) to see debug logs
4. Check console for "Logged in user ID" and "Admin check result"

---

## Quick Debug Script

Run this in Supabase SQL Editor (replace email):

```sql
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Find user by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'YOUR-EMAIL@EXAMPLE.COM';  -- CHANGE THIS!
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with that email';
  END IF;
  
  -- Add as admin
  INSERT INTO public.admins(user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Verify
  RAISE NOTICE 'SUCCESS! User % (%) is now an admin', v_user_id, 
    (SELECT email FROM auth.users WHERE id = v_user_id);
END $$;

-- Check result
SELECT 
  a.user_id,
  u.email,
  a.created_at
FROM public.admins a
JOIN auth.users u ON u.id = a.user_id;
```

---

## Common Mistakes:

❌ **Using email instead of user_id**
```sql
-- WRONG:
INSERT INTO admins(user_id) VALUES ('user@email.com');
```

✅ **Use the UUID from auth.users**
```sql
-- CORRECT:
INSERT INTO admins(user_id) VALUES ('12345678-abcd-1234-abcd-123456789abc');
```

❌ **Adding admin before user signs up**
- User must exist in `auth.users` first
- Sign up in the golf app first, then add to admins table

❌ **Wrong Supabase project**
- Make sure you're in project: `qemosikbhrnstcormhuz`
- Check URL: `https://supabase.com/dashboard/project/qemosikbhrnstcormhuz`

---

## Still Not Working?

Check browser console (F12) for these logs:
- "Logged in user ID: ..." - This is the UUID to add to admins table
- "Admin check result: ..." - Should show your user_id if working
- "Admin check error: ..." - Will show RLS or table errors

Then run:
```sql
-- Check RLS policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'admins';

-- Try direct query as service role (should work regardless of RLS)
SELECT * FROM admins;
```
