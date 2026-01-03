# Test 1: Create Event - Pre-Test Verification

## Current State: Ready for User Testing

### Database Schema Verification ✅

**clubhouse_events table**:
```sql
- id UUID PRIMARY KEY
- name TEXT NOT NULL
- slug TEXT UNIQUE NOT NULL
- description TEXT
- location TEXT
- start_date TIMESTAMPTZ NOT NULL
- end_date TIMESTAMPTZ NOT NULL
- registration_opens_at TIMESTAMPTZ NOT NULL
- registration_closes_at TIMESTAMPTZ NOT NULL
- status TEXT NOT NULL DEFAULT 'upcoming'
- is_visible BOOLEAN DEFAULT true
- created_at TIMESTAMPTZ DEFAULT NOW()
```

**clubhouse_competitions table**:
```sql
- id UUID PRIMARY KEY
- event_id UUID NOT NULL REFERENCES clubhouse_events(id)
- name TEXT NOT NULL
- description TEXT
- entry_credits INTEGER NOT NULL CHECK (entry_credits >= 0)
- prize_credits INTEGER CHECK (prize_credits >= 0)
- max_entries INTEGER NOT NULL DEFAULT 100
- opens_at TIMESTAMPTZ NOT NULL
- closes_at TIMESTAMPTZ NOT NULL
- starts_at TIMESTAMPTZ NOT NULL
- created_at TIMESTAMPTZ DEFAULT NOW()
- CONSTRAINT: closes_at > opens_at AND starts_at >= closes_at
```

### API Route Mapping ✅

**File**: apps/golf/src/app/api/clubhouse/events/route.ts

**POST /api/clubhouse/events**:

Step 1 - Create Event:
```typescript
form.name → clubhouse_events.name
form.name (slugified) → clubhouse_events.slug
form.description → clubhouse_events.description
form.location → clubhouse_events.location
form.start_date → clubhouse_events.start_date
form.end_date → clubhouse_events.end_date
form.registration_opens → clubhouse_events.registration_opens_at
form.registration_closes → clubhouse_events.registration_closes_at
```

Step 2 - Create Competition:
```typescript
event.id → clubhouse_competitions.event_id
form.name → clubhouse_competitions.name
form.description → clubhouse_competitions.description
form.entry_credits → clubhouse_competitions.entry_credits
form.max_entries → clubhouse_competitions.max_entries
form.registration_opens → clubhouse_competitions.opens_at
form.registration_closes → clubhouse_competitions.closes_at
form.start_date → clubhouse_competitions.starts_at
```

### Frontend Form Verification ✅

**File**: apps/golf/src/app/clubhouse/admin/events/create/page.tsx

**Form State**:
```typescript
{
  name: '',                    // → API body.name
  description: '',             // → API body.description
  location: '',                // → API body.location
  entry_credits: 100,          // → API body.entry_credits
  max_entries: 50,             // → API body.max_entries
  start_date: '',              // → API body.start_date
  end_date: '',                // → API body.end_date
  registration_opens: '',      // → API body.registration_opens
  registration_closes: '',     // → API body.registration_closes
}
```

**All fields have matching UI inputs**: ✅

### Changes Made in This Session

1. **Added location field to form** (apps/golf/src/app/clubhouse/admin/events/create/page.tsx)
   - Was in formData state but missing from UI
   - Now displays between Description and Entry Credits
   
2. **Added debug logging to API** (apps/golf/src/app/api/clubhouse/events/route.ts)
   - Logs incoming request body
   - Logs event creation success/failure
   - Logs competition creation success/failure
   - Logs any errors with full details

3. **Verified database tables exist** (check-clubhouse-schema.js)
   - All 5 tables confirmed accessible

### Test Data to Use

```
Name: Test Championship 2026
Description: Test event for system validation
Location: Augusta National Golf Club
Entry Credits: 100
Max Entries: 50
Start Date: 2026-01-10T09:00
End Date: 2026-01-13T18:00
Registration Opens: 2026-01-02T10:00
Registration Closes: 2026-01-09T23:59
```

### Expected Success Behavior

1. Form submits without errors
2. User redirected to /clubhouse/admin/events
3. Console shows:
   ```
   [Clubhouse Events API] Creating event: {...}
   [Clubhouse Events API] Event created: [UUID]
   [Clubhouse Events API] Competition created for event [UUID]
   ```
4. Database verification:
   ```sql
   SELECT * FROM clubhouse_events ORDER BY created_at DESC LIMIT 1;
   -- Should show: status = 'open', name = 'Test Championship 2026'
   
   SELECT * FROM clubhouse_competitions WHERE event_id = [event_id];
   -- Should show: entry_credits = 100, max_entries = 50
   ```

### Potential Issues to Watch

1. **Datetime format**: Browser sends `datetime-local` as `YYYY-MM-DDTHH:MM`, PostgreSQL expects TIMESTAMPTZ
   - API may need to convert to ISO 8601 with timezone
   
2. **Status trigger**: Check if `update_clubhouse_event_status()` trigger correctly sets status to 'open' or 'upcoming'
   
3. **Timing validation**: Competition constraint requires `closes_at > opens_at AND starts_at >= closes_at`
   - If dates are wrong, competition creation will fail

4. **Slug uniqueness**: If event name already used, slug collision will cause error

### Files NOT Changed

- Database schema (already deployed)
- RPC functions (already deployed)
- Triggers (already deployed)
- Other admin pages
- User-facing pages
- Type definitions in packages/clubhouse-shared

### Status: READY FOR USER TESTING

User will:
1. Navigate to http://localhost:3003/clubhouse/admin/events/create
2. Fill form with test data
3. Submit
4. Report exact result (success or specific error message)
5. If error, check terminal console logs for detailed error

Agent will:
- Wait for test results
- NOT make additional changes until user reports results
- Only fix what specific error indicates
- Document fix and retest
