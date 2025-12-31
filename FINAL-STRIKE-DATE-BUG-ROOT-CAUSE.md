# Final Strike Wrong Date - Root Cause Analysis

## Summary
Final Strike competition has `start_at = 2025-12-30T09:00:00` (3 days ago) when it should be `2026-01-02T07:20:00` (Round 4 tee time, 3 days from now).

## Root Cause Identified

### The Bug Location
**File**: `apps/admin/src/app/tournaments/[id]/page.tsx`
**Lines**: 1173 (fallback logic) and 1235-1280 (auto-population)

### How It Happened

1. **Competition Type Template**: Final Strike has `round_start: 4` (should use Round 4 tee time)

2. **Admin Created Competition**: On Dec 31, 2025 at 09:44 UTC, admin added Final Strike to tournament

3. **Auto-Population Code Executed** (Lines 1235-1280):
   ```typescript
   const roundStart = selectedType.round_start; // = 4
   if (roundStart && tournament) {
     const teeTimeField = `round_${roundStart}_start`; // = 'round_4_start'
     const teeTime = tournament[teeTimeField]; // Should be 2026-01-02T07:20
     
     if (teeTime) {
       startAt = new Date(teeTime).toISOString().slice(0, 16);
     }
   }
   ```

4. **But There's a Fallback** (Line 1173):
   ```typescript
   start_at: tournament.start_date.slice(0, 16), // ← FALLBACK used tournament.start_date!
   ```

5. **What Happened**:
   - Tournament `start_date` = `2025-12-30T09:00:00` (Round 1, not Round 4!)
   - The auto-population logic at line 1235+ should have overridden this
   - BUT: The competition was created, then EDITED at 10:53 UTC
   - During the edit, the form may have shown the WRONG date from the initial fallback
   - Admin didn't notice and saved it with the wrong date

### Timeline Evidence
```
Created:  2025-12-31T09:44:55 UTC (initial creation - wrong date set)
Updated:  2025-12-31T10:53:39 UTC (edited ~1 hour later - wrong date persisted)
```

The competition was modified after creation, suggesting admin edited settings but didn't notice the wrong date.

## The Problem

### Issue 1: Misleading Fallback (Line 1173)
When "Add Competition from Template" is clicked, it initializes:
```typescript
start_at: tournament.start_date.slice(0, 16),
```

This uses Round 1 tee time as a fallback for ALL competitions, even those that should use Round 2, 3, or 4!

### Issue 2: Silent Auto-Population
Lines 1235-1280 DO correctly calculate from `round_${X}_start`, but:
- It only runs when competition type is selected from dropdown
- If the form is pre-filled (editing existing competition), the auto-population doesn't run
- Admin sees pre-filled date and doesn't realize it's wrong

## The Fix

### Immediate Data Fix
```sql
UPDATE tournament_competitions
SET start_at = '2026-01-02T07:20:00+00:00',
    reg_close_at = '2026-01-02T07:05:00.000Z'
WHERE id = '449cd8e8-5999-44c6-a809-55d977f2593f';
```

### Code Fix Required
**File**: `apps/admin/src/app/tournaments/[id]/page.tsx`

**Line 1173** - Remove misleading fallback:
```typescript
// BEFORE (WRONG):
start_at: tournament.start_date.slice(0, 16),

// AFTER (CORRECT):
start_at: '', // Let auto-population handle this based on round_start
```

**Alternative**: Calculate correctly at line 1173:
```typescript
// Get the selected type's round_start to determine which tee time to use
const selectedType = availableTypes.find(t => t.id === formData.competition_type_id);
const roundStart = selectedType?.round_start || 1;
const teeTimeField = `round_${roundStart}_start` as keyof typeof tournament;
const teeTime = tournament[teeTimeField];
start_at: teeTime ? new Date(teeTime).toISOString().slice(0, 16) : tournament.start_date.slice(0, 16),
```

## Prevention Strategy

### 1. Visual Indicator
Add warning text in UI when start_at is manually editable:
```tsx
<div style={{ color: '#ff6b6b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
  ⚠️ Managed by Lifecycle Manager - only edit for weather delays
</div>
```

### 2. Validation Warning
Show alert when admin manually changes start_at:
```typescript
if (competitionFormData.start_at !== calculatedStartAt) {
  console.warn('⚠️ Competition start time differs from lifecycle manager');
}
```

### 3. Read-Only Display (Recommended)
Make start_at read-only and calculate it server-side on every save:
- Display calculated value (not editable)
- Show "Calculated from Round X tee time" label
- Only allow editing via "Override for Weather Delay" checkbox

### 4. API-Level Validation
In `/api/tournaments/[id]/competitions` PUT/POST:
```typescript
// Always recalculate from tournament round tee times
const { data: compType } = await adminClient
  .from('competition_types')
  .select('round_start')
  .eq('id', competition_type_id)
  .single();

if (compType?.round_start) {
  const roundField = `round_${compType.round_start}_start`;
  const { data: tournament } = await adminClient
    .from('tournaments')
    .select(roundField)
    .eq('id', params.id)
    .single();
    
  if (tournament[roundField]) {
    start_at = tournament[roundField]; // FORCE correct value
    console.log(`✅ Auto-corrected start_at from lifecycle manager: ${start_at}`);
  }
}
```

## Files Requiring Changes

1. ✅ **Data Fix**: Run SQL update (immediate)
2. ⚠️ **Line 1173**: Remove or fix fallback in `apps/admin/src/app/tournaments/[id]/page.tsx`
3. 🎯 **Recommended**: Add server-side auto-correction in `apps/admin/src/app/api/tournaments/[id]/competitions/route.ts`
4. 🎨 **Nice-to-have**: Add UI warnings for manual edits

## Testing Checklist
After fix:
- [ ] Final Strike shows "REGISTRATION OPEN" not "LIVE"
- [ ] Create new competition → Verify start_at matches correct round tee time
- [ ] Edit existing competition → Verify start_at doesn't change unless tournament tee time changed
- [ ] Change tournament Round 4 tee time → Verify Final Strike auto-updates
