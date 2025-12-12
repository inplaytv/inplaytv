# Platform Utilities

Centralized utility functions for consistent behavior across the platform.

## Status Utils

```typescript
import { 
  normalizeStatus, 
  isLive, 
  isRegistrationOpen,
  getStatusLabel 
} from '@/lib';

// Normalize various status formats to standard
const status = normalizeStatus('in-play'); // Returns 'live'

// Check if competition is live
if (isLive(competition.status)) {
  // Show live indicator
}

// Check if can register (considers timing too)
if (isRegistrationOpen(competition.status, competition.reg_close_at)) {
  // Show register button
}

// Get user-friendly label
const label = getStatusLabel(competition.status); // "Live Now"
```

## Competition Utils

```typescript
import {
  isInPlayCompetition,
  isOne2OneTemplate,
  filterInPlayCompetitions,
  assertInPlayCompetition
} from '@/lib';

// Type guard - distinguishes InPlay from ONE 2 ONE
if (isInPlayCompetition(item)) {
  // This is a tournament competition
  console.log(item.competition_type_id); // ✅ Safe to access
}

if (isOne2OneTemplate(item)) {
  // This is a challenge template
  console.log(item.rounds_covered); // ✅ Safe to access
}

// Filter mixed arrays
const competitions = filterInPlayCompetitions(allItems);

// Assert type (throws if wrong)
assertInPlayCompetition(competition); // Throws if not InPlay
```

## Timing Utils

```typescript
import {
  canRegister,
  hasCompetitionStarted,
  getTimeUntilRegClose,
  formatDateTime
} from '@/lib';

// Check if user can register
if (canRegister(comp.status, comp.reg_close_at, comp.start_time)) {
  // Show registration form
}

// Check if competition has started
if (hasCompetitionStarted(comp.status, comp.start_time)) {
  // Show live scores
}

// Get countdown timer data
const timeLeft = getTimeUntilRegClose(comp.reg_close_at);
if (timeLeft) {
  console.log(`${timeLeft.hours}h ${timeLeft.minutes}m left`);
}

// Format dates consistently
const formatted = formatDateTime(comp.start_time);
```

## Benefits

✅ **Consistency** - One source of truth for status checks  
✅ **Type Safety** - TypeScript guards prevent mixing types  
✅ **Maintainability** - Change logic in one place  
✅ **Debugging** - Clear function names show intent  
✅ **Testing** - Easy to test in isolation  

## Migration Guide

### Before
```typescript
// ❌ Old way - inconsistent checks
if (comp.status === 'live' || comp.status === 'in-play' || comp.status === 'active') {
  // ...
}

if (comp.competition_type_id && !comp.rounds_covered) {
  // ...
}
```

### After
```typescript
// ✅ New way - clear and reliable
if (isLive(comp.status)) {
  // ...
}

if (isInPlayCompetition(comp)) {
  // ...
}
```
