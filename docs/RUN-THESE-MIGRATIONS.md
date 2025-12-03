# 🚨 CRITICAL: Database Migrations Required

You need to run these SQL migrations in your Supabase Dashboard SQL Editor **before testing the new features**.

## Migration 3: Add updated_at to Golfers (CRITICAL)
**Status**: ✅ **COMPLETED** (2025-12-03) - Required for world rankings sync

**File**: `docs/migrations/2025-12-03-add-updated-at-to-golfers.sql`

**What it does**: Adds `updated_at` column to golfers table, required by database trigger for golfer updates. Enables world rankings sync feature.

**Steps**:
1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `docs/migrations/2025-12-03-add-updated-at-to-golfers.sql`
4. Click "Run"
5. ✅ Should see: "Success. No rows returned"

**Note**: This migration has already been run on production. Only needed for new environments.

---

## Migration 1: Remove Unique Constraint (CRITICAL)
**Status**: ⚠️ **BLOCKING** - Without this, you cannot add multiple competitions of the same type with different fees

**File**: `scripts/2025-01-remove-unique-competition-constraint.sql`

**What it does**: Allows you to add the same competition type multiple times to a tournament with different entry fees (e.g., Full Course £10 and Full Course £50).

**Steps**:
1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `scripts/2025-01-remove-unique-competition-constraint.sql`
4. Click "Run"
5. ✅ Should see: "Success. No rows returned"

---

## Migration 2: Create Golfers Tables (NEW FEATURE)
**Status**: ✨ **NEW** - Required for golfers management

**File**: `scripts/2025-01-tournament-golfers.sql`

**What it does**: Creates the golfers database and tournament_golfers junction table. Includes 5 sample pro golfers.

**Steps**:
1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `scripts/2025-01-tournament-golfers.sql`
4. Click "Run"
5. ✅ Should see: "Success. No rows returned" (tables and sample data created)

---

## After Running Migrations

### New Features Available:
1. **Multiple Same-Type Competitions**: You can now add "Full Course" multiple times with different entry fees (£10, £50, etc.)
2. **Golfers Management**: 
   - Visit `/golfers` to manage master golfer list
   - Add/edit/delete golfers with first name, last name, image URL, external ID
   - On tournament edit page, assign golfers to tournaments
   - ⚠️ **Tournaments must have golfers before going live** (validation coming soon)

### Sample Golfers Included:
After running Migration 2, you'll have these golfers available:
- Tiger Woods
- Rory McIlroy
- Jon Rahm
- Scottie Scheffler
- Brooks Koepka

### Next Steps:
1. Test adding multiple competitions with same type but different fees
2. Visit `/golfers` to see the sample golfers
3. Edit a tournament and add golfers to it
4. Try creating your own custom golfers

---

## Verification Checklist

After running both migrations:
- [ ] Can add multiple "Full Course" competitions to same tournament
- [ ] Can access `/golfers` page
- [ ] Can see 5 sample golfers
- [ ] Can create new golfers
- [ ] Can add golfers to tournaments
- [ ] Can remove golfers from tournaments
- [ ] Warning shows when tournament has no golfers

---

## Troubleshooting

**Migration 1 fails with "constraint does not exist"**:
- ✅ This is fine! It means the constraint was never created or already removed.

**Migration 2 fails with "relation already exists"**:
- ⚠️ Tables already exist. Run this instead:
  ```sql
  DROP TABLE IF EXISTS public.tournament_golfers;
  DROP TABLE IF EXISTS public.golfers;
  ```
  Then run the migration again.

**Cannot access /golfers page**:
- Check console for errors
- Verify migrations ran successfully
- Ensure admin app is running on port 3002

---

## Future Features (Not Yet Implemented)
- CSV import for bulk golfer uploads
- API integration for external golfer data
- Image upload for golfer photos
- Validation to prevent tournament from going live without golfers
