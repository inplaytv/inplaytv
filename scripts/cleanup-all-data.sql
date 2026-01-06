-- Complete cleanup of all tournaments, competitions, and entries
-- Run this in Supabase SQL Editor



















































































































































✅ **RESOLVED** - All competitions have correct format, tournaments loading properly## Status- `apply-competition-format-fix.js` - Script used to fix existing data- `.github/copilot-instructions.md` - Updated with unified system documentation- `scripts/cleanup-all-data.sql` - Updated with notes about removed tables- `VERIFICATION-REPORT-2026-01-05.md` - Details of unified system migration## Related Files   ```   }     // ... other fields     competition_format: 'inplay' | 'one2one'; // Required   interface TournamentCompetition {   ```typescript3. **Type Safety**: TypeScript types should enforce this field:   ```   ALTER COLUMN competition_format SET NOT NULL;   ALTER TABLE tournament_competitions    ```sql2. **Database Constraint** (recommended): Add NOT NULL constraint:1. **AI Tournament Creator**: Now automatically sets `competition_format: 'inplay'`### Automated Checks:## Prevention for Future- Should allow entry into competitions with open registration- Should show competition counts- Should display tournament cardsVisit http://localhost:3003/tournaments### Frontend Verification:```# - Dubai Invitational (7 competitions)# - The American Express (7 competitions)# - Sony Open in Hawaii (7 competitions)# Should return JSON with tournaments array containing:curl http://localhost:3003/api/tournaments# Test tournaments endpoint```bash### API Verification:```-- NULL: 0  ✅-- inplay: 21-- Result:GROUP BY competition_format;FROM tournament_competitions SELECT competition_format, COUNT(*) -- Check all competitions have format set```sql### Database Verification:## Verification Steps- Reference to migration report- Where the correct information is- Why it was wrong- What was removedReplaced conflicting documentation with clear explanation of:### Added Historical Note:**Reason**: This section contradicted the unified system documented at the top of the file**Section Removed**: "ONE 2 ONE vs InPlay Competitions - Two Completely Separate Systems"  **File**: `.github/copilot-instructions.md`  ### Removed Obsolete Section:## Documentation Cleanup- **Format field**: Distinguishes competition types- **One foreign key**: `competition_id` (no more `instance_id`)- **One table for all**: `tournament_competitions`### Current Architecture:- Entries used `instance_id` for ONE 2 ONE- ONE 2 ONE used separate `competition_instances` table- InPlay used `tournament_competitions` table### Previous Architecture (Obsolete):  - `'one2one'` = User-created head-to-head challenges  - `'inplay'` = Admin-created competitions (Full Course, Beat The Cut, etc.)- **Only distinguishing factor**: `competition_format` field- **Both InPlay AND ONE 2 ONE** use the SAME table: `tournament_competitions`The `competition_format` column is **critical** for the unified competition system where:### Why This Field Exists:## Architecture Context: Unified Competition System**Result**: ✅ All 21 competitions now have `competition_format = 'inplay'`**Action**: Updated all existing competitions with NULL format to 'inplay'  **Script**: `apply-competition-format-fix.js`  ### Data Migration:```  });    // ... other fields    competition_format: 'inplay',  // ← ADDED THIS LINE    entry_fee_pennies: comp.entryFeePennies,    competition_type_id: compType.id,    tournament_id: tournament.id,  .insert({  .from('tournament_competitions')const { data: competition, error: compError } = await supabaseAdmin// After (field now set):  });    // ... other fields    entry_fee_pennies: comp.entryFeePennies,    competition_type_id: compType.id,    tournament_id: tournament.id,  .insert({  .from('tournament_competitions')const { data: competition, error: compError } = await supabaseAdmin// Before (missing field):```typescript**Change**: Added `competition_format: 'inplay'` to competition creation**Line**: 167  **File**: `apps/admin/src/app/api/ai/create-tournament/route.ts`  ### Code Changes:## The Fix   - Tournaments created before the fix had NULL values   - The AI tournament creator was not setting this field when creating tournaments   - The `competition_format` column exists in the schema (required for unified system)4. **Why NULL Values Existed**: 3. **Empty Results**: The query returned 0 competitions → API returned 404 → Frontend showed empty page2. **NULL Values in Database**: All 21 competitions across 3 tournaments had `competition_format = NULL`   ```   .eq('competition_format', 'inplay')   ```typescript1. **API Filter Requirements**: The tournaments API endpoint at `apps/golf/src/app/api/tournaments/route.ts` line 123 filters competitions by:### Detailed Explanation:**Missing `competition_format` field values in `tournament_competitions` table**## Root CauseTournaments were not appearing on the `/tournaments` page despite existing in the database with correct visibility settings.## Problem Summary--
-- IMPORTANT: This script uses the UNIFIED COMPETITION SYSTEM
-- Both InPlay and ONE 2 ONE competitions are stored in tournament_competitions table
-- distinguished by the competition_format column ('inplay' or 'one2one')
--
-- REMOVED REFERENCES (Jan 2026):
-- - competition_entry_picks table (deleted during schema unification)
-- - competition_instances table (unified into tournament_competitions)
-- - instance_id column (all entries now use competition_id)
--
-- See VERIFICATION-REPORT-2026-01-05.md for migration details

-- Start transaction
BEGIN;

-- Delete all competition entries (cascades to picks automatically)
DELETE FROM competition_entries;

-- Delete all competitions (both InPlay and ONE 2 ONE use tournament_competitions)
DELETE FROM tournament_competitions;

-- Delete tournament golfers junction table
DELETE FROM tournament_golfers;

-- Delete all tournaments
DELETE FROM tournaments;

-- Reset sequences if needed (optional)
-- ALTER SEQUENCE tournaments_id_seq RESTART WITH 1;
-- ALTER SEQUENCE tournament_competitions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE competition_entries_id_seq RESTART WITH 1;

COMMIT;

-- Verify cleanup
SELECT 'Tournaments' as table_name, COUNT(*) as count FROM tournaments
UNION ALL
SELECT 'Tournament Competitions', COUNT(*) FROM tournament_competitions
UNION ALL
SELECT 'Competition Entries', COUNT(*) FROM competition_entries
UNION ALL
SELECT 'Tournament Golfers', COUNT(*) FROM tournament_golfers;
