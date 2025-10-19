# Tournament Manager - UI Improvements

## Changes Made

### 1. Entry Fee in Pounds (£)
**Problem**: Admins had to calculate pennies (e.g., entering "1000" for £10.00)

**Solution**: 
- Changed input field to accept pounds with 2 decimal places
- Label: "Entry Fee (£) *"
- Placeholder: "e.g., 10.00"
- Step: 0.01 (allows pence precision)
- Backend: Still saves as pennies in database (multiplied by 100)
- Display: All lists show prices in pounds using `formatPennies()` helper

**Example**:
- Admin enters: `10.00`
- Saved in DB: `1000` (pennies)
- Displayed: `£10.00`

### 2. Prize Pool Calculator in Add Competition Form
**Problem**: Admin couldn't visualize potential earnings when setting up a competition

**Solution**: 
- Added real-time prize pool calculator that appears when entry fee is entered
- Shows 3 scenarios: 50, 100, and 200 entrants
- Displays for each scenario:
  - **Prize Pool** (large, green highlight)
  - Gross revenue
  - Admin fee
- Updates automatically as entry fee changes
- Uses tournament's admin fee percentage
- Visual design: Green gradient box with 3-column grid

**Display**:
```
💰 Prize Pool Calculator
┌─────────────────┬─────────────────┬─────────────────┐
│  50 Entrants    │  100 Entrants   │  200 Entrants   │
│  £450.00        │  £900.00        │  £1,800.00      │
│  Gross: £500    │  Gross: £1,000  │  Gross: £2,000  │
│  Admin Fee: £50 │  Admin Fee: £100│  Admin Fee: £200│
└─────────────────┴─────────────────┴─────────────────┘
Based on 10% admin fee • Entry: £10.00
```

### 3. Auto-populate Competition Dates from Tournament
**Problem**: When adding a competition, start/end fields were blank

**Solution**:
- When clicking "Add Competition", automatically populate:
  - **Competition Start** → Tournament Start Date
  - **Competition End** → Tournament End Date
- This triggers the auto-calculation of Registration Close (15 mins before start)
- Admin can still override these dates if needed

**Flow**:
1. Click "Add Competition"
2. Form opens with pre-filled dates from parent tournament
3. Registration Close auto-fills as (Competition Start - 15 minutes)
4. Admin can adjust or proceed with defaults

## Files Modified

### `apps/admin/src/app/tournaments/[id]/page.tsx`
- Changed `entry_fee_pennies` state to `entry_fee_pounds`
- Added conversion logic in `handleAddCompetition()`:
  - Converts pounds to pennies before API call
  - Rounds to nearest penny
- Updated `handleEditCompetition()` to convert pennies to pounds when loading
- Added prize pool calculator component in competition form
- Added date pre-population when opening "Add Competition" form

### Data Conversion Logic
```typescript
// When submitting (UI → API)
entry_fee_pennies: Math.round(parseFloat(entry_fee_pounds) * 100)

// When loading (API → UI)  
entry_fee_pounds: (entry_fee_pennies / 100).toFixed(2)
```

## Benefits

1. **Easier Data Entry**: Admins think in pounds, not pennies
2. **Visual Feedback**: See potential earnings before creating competition
3. **Faster Setup**: Dates pre-fill from tournament context
4. **Error Prevention**: Less chance of decimal mistakes
5. **Better UX**: Real-time prize calculations help with pricing decisions

## Technical Notes

- Database schema unchanged (still stores pennies)
- All API endpoints unchanged (still expect/return pennies)
- Only UI layer converts between pounds and pennies
- Prize calculator uses existing `calculatePrizePool()` function
- Maintains British English: "Prize Pool" not "Prize Pool"
- Inline styles maintained for consistency

## Testing Checklist

- [ ] Enter £10.00, verify saves as 1000 pennies
- [ ] Edit competition, verify shows £10.00 not 1000
- [ ] Prize calculator updates when changing entry fee
- [ ] Prize calculator shows correct admin fee percentage
- [ ] Dates auto-fill when adding competition
- [ ] Registration close auto-calculates from pre-filled start time
- [ ] Manual override still works for all fields
