# Leaderboard Player Structure Guide

## Overview
This guide ensures all players added to the leaderboard maintain the same unified 18-hole scorecard structure with premium glass morphism effects.

## Key Requirements

### 1. **Unified 18-Hole Structure**
- **Single Scorecard**: No separate Front Nine/Back Nine sections
- **Complete Layout**: Holes 1-18 in one continuous grid
- **Proper Totals**: OUT (holes 1-9), IN (holes 10-18), TOTAL (full round)

### 2. **Required CSS Classes**
- `holes-grid full-18`: For proper 22-column layout
- `scorecard-title`: "Complete 18-Hole Scorecard" header
- `out-cell`: Special styling for front 9 totals
- `in-cell`: Special styling for back 9 totals  
- `total-cell`: Final round totals

### 3. **Score Color Coding**
```html
<div class="hole-cell birdie">3</div>     <!-- 1 under par (green) -->
<div class="hole-cell eagle">3</div>      <!-- 2+ under par (gold) -->
<div class="hole-cell">4</div>            <!-- Par score (default) -->
<div class="hole-cell bogey">5</div>      <!-- Over par (red) -->
```

### 4. **Fantasy Points System**
- **Par**: 1.0 points
- **Birdie**: 2.5 points  
- **Eagle**: 4.0 points
- **Hole-in-one**: 8.0 points
- **Bogey**: 0.5 points

### 5. **Change Indicators**
```html
<!-- Positive Change (Green) -->
<div class="change-cell positive">
    <i class="fas fa-arrow-up"></i>
    +2
</div>

<!-- Negative Change (Red) -->  
<div class="change-cell negative">
    <i class="fas fa-arrow-down"></i>
    -1
</div>

<!-- No Change (Gray) -->
<div class="change-cell neutral">E</div>
```

## Implementation Checklist

When adding a new player:

### ✅ **Player Row Structure**
- [ ] Rank badge with proper styling
- [ ] Player photo and info
- [ ] Current score to par
- [ ] Round scores (R1, R2, R3, R4)
- [ ] Total strokes
- [ ] Position change indicator
- [ ] Fantasy points total
- [ ] Dropdown arrow

### ✅ **Dropdown Stats Section**
- [ ] Bogey Free Round (+5 pts)
- [ ] 3 Consecutive Birdies (+5 pts)
- [ ] Under 70 Strokes (+3 pts)
- [ ] Total Score summary
- [ ] Fantasy Points total

### ✅ **Complete 18-Hole Scorecard**
- [ ] Header with holes 1-18, OUT, IN, TOTAL
- [ ] Par row with all 18 hole pars
- [ ] Score row with all 18 hole scores
- [ ] Fantasy row with all 18 hole points
- [ ] Proper cell classes (out-cell, in-cell, total-cell)
- [ ] Color coding for scores (birdie, eagle, etc.)

### ✅ **JavaScript Integration**
- [ ] Unique player dropdown ID (player-X)
- [ ] Onclick handler: `togglePlayerDropdown('player-X')`
- [ ] Consistent with existing dropdown functionality

## File Locations

- **Template**: `leaderboard-player-template.html`
- **Main File**: `leaderboard.html`
- **CSS Styles**: `styles.css` (glass morphism effects included)

## CSS Dependencies

Ensure these styles are present in `styles.css`:

```css
.holes-grid.full-18 {
    grid-template-columns: auto repeat(9, 1fr) auto repeat(9, 1fr) auto auto;
    font-size: 0.85rem;
}

.hole-cell.out-cell,
.hole-cell.in-cell {
    background: rgba(20, 184, 166, 0.15);
    font-weight: 600;
    color: #14b8a6;
    border-left: 2px solid rgba(20, 184, 166, 0.3);
}

.scorecard-title {
    background: linear-gradient(135deg, #14b8a6, #0f766e);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
```

## Quality Assurance

Before adding to production:

1. **Visual Check**: Verify glass morphism effects display correctly
2. **Responsive Test**: Ensure mobile layout works properly  
3. **Data Validation**: Confirm all totals calculate correctly
4. **Interaction Test**: Verify dropdown functionality works
5. **Consistency Check**: Compare with existing players

## Notes

- **Glass Morphism**: All scorecard sections use advanced backdrop-filter effects
- **Performance**: 18-hole layout optimized for fast rendering
- **Accessibility**: Proper semantic HTML structure maintained
- **Mobile**: Responsive design handles overflow gracefully

This structure ensures consistency and maintains the premium visual quality across all leaderboard players.