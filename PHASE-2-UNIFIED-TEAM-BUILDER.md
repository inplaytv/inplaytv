# Phase 2: Unified Team Builder Implementation Plan

## Current Status
✅ **Phase 1 Complete**: `unified-competition.ts` created with utility functions (7/9 tests passing)

## Phase 2 Goal
Create a truly unified team builder that:
1. Works for BOTH InPlay competitions AND ONE 2 ONE challenges
2. Supports CREATE mode (new entry) and EDIT mode (modify existing)
3. Uses unified utilities from Phase 1
4. Validates edit eligibility (can't edit after tee-off)

## Current Team Builder Analysis
**File**: `apps/golf/src/app/build-team/[competitionId]/page.tsx` (1563 lines)

### What's Already Good ✅
- Fetches competition via `/api/competitions/${competitionId}` 
- Checks `reg_close_at` for registration deadline (correct!)
- Has `existingEntryId` state variable
- Loads existing draft entries via `/api/competitions/${competitionId}/my-entry`
- Has ONE 2 ONE flag: `is_one_2_one?: boolean`

### What Needs Updating 🔧

#### 1. **Use Unified Competition Detection**
```typescript
// CURRENT: Uses is_one_2_one flag
competition?.is_one_2_one

// NEEDED: Use unified utilities
import { getCompetitionType, isInPlayCompetition, isOne2OneInstance } from '@/lib/unified-competition';
const compType = getCompetitionType(competition);
```

#### 2. **Use Unified Golfer Fetching**
```typescript
// CURRENT: Fetches via custom endpoint
const golfersRes = await fetch(`/api/competitions/${competitionId}/golfers`);

// NEEDED: Use unified function
import { fetchAvailableGolfers } from '@/lib/unified-competition';
const golfers = await fetchAvailableGolfers(competitionId, supabase);
```

#### 3. **Add Edit Mode Support**
```typescript
// NEEDED: Check URL params for entryId
const searchParams = useSearchParams();
const editEntryId = searchParams.get('entryId');
const isEditMode = !!editEntryId;

// NEEDED: Validate edit eligibility
import { canEditEntry } from '@/lib/unified-competition';
if (isEditMode) {
  const canEdit = await canEditEntry(editEntryId, supabase);
  if (!canEdit) {
    setError('Cannot edit - competition has started');
    return;
  }
}
```

#### 4. **Update API Endpoints**
```typescript
// CURRENT: POST /api/competitions/[id]/entries (create only)

// NEEDED: 
// - POST /api/competitions/[id]/entries (create)
// - PUT /api/entries/[entryId] (edit)
// Both should use unified entry building functions
```

#### 5. **Add "Edit Scorecard" Button to My Entries**
Create button in My Entries page that links to:
```
/build-team/{competitionId}?entryId={entryId}
```

## Implementation Steps

### Step 1: Update Team Builder to Use Unified Utilities (30 min)
- Import unified functions
- Replace competition type detection
- Replace golfer fetching
- Add edit mode URL param handling

### Step 2: Add Edit Validation (15 min)
- Check `canEditEntry()` before loading
- Show error if competition started
- Block save if tee-off passed

### Step 3: Create Edit API Endpoint (20 min)
- `PUT /api/entries/[entryId]`
- Validate ownership
- Validate tee-off time
- Update entry + picks in transaction

### Step 4: Update My Entries Page (15 min)
- Add "Edit Scorecard" button next to each entry
- Only show if `canEditEntry()` returns true
- Link to team builder with `?entryId=` param

### Step 5: Test Both Flows (20 min)
- Create new InPlay entry
- Edit InPlay entry
- Create new ONE 2 ONE entry
- Edit ONE 2 ONE entry
- Verify can't edit after tee-off

## Expected Outcome
Single team builder component that:
- ✅ Detects InPlay vs ONE 2 ONE automatically
- ✅ Works in CREATE and EDIT modes
- ✅ Fetches correct golfers for both types
- ✅ Prevents editing after tee-off
- ✅ Uses unified utilities throughout

## Files to Modify
1. `apps/golf/src/app/build-team/[competitionId]/page.tsx` (refactor to use unified utils)
2. `apps/golf/src/app/api/entries/[entryId]/route.ts` (NEW - edit endpoint)
3. `apps/golf/src/app/my-entries/page.tsx` (add Edit button)
4. No changes needed to `unified-competition.ts` (already has all needed functions)

## Estimated Time: 2 hours
