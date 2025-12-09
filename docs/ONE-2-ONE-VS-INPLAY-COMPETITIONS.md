# ONE 2 ONE vs InPlay Competitions - Technical Guide

## Overview

The InPlay TV platform supports two distinct competition types with different architectures, workflows, and business logic.

---

## 🎯 Competition Types

### **InPlay Competitions** (Standard Tournaments)
- Multi-player fantasy golf competitions
- Players compete against entire field of entrants
- Fixed prize pool structure
- Tournament-based with multiple competition types (Gold, Platinum, Executive, etc.)

### **ONE 2 ONE Challenges** (Head-to-Head)
- Player vs Player challenges
- Winner takes all (minus admin fee)
- Custom entry fees per challenge
- Match-based system with Challenge Board

---

## 🗄️ Database Architecture

### InPlay Competitions

**Primary Table:** `tournament_competitions`
```sql
tournament_competitions
├── id (competition_id)
├── tournament_id
├── competition_type_id
├── entry_fee_pennies
├── prize_pool
├── entrants_cap
├── reg_open_at
├── reg_close_at
└── status
```

**Key Characteristics:**
- Single competition = entire tournament
- Created by admin in advance
- Fixed entry fee for all participants
- Static configuration

### ONE 2 ONE Challenges

**Primary Tables:** `competition_templates` + `competition_instances`

```sql
competition_templates (Template/Blueprint)
├── id
├── name (e.g., "Round 1 Only", "All 4 Rounds")
├── rounds_covered [1] or [1,2,3,4]
├── reg_close_round (1-4)
├── default_entry_fee_pennies
└── custom_fees_enabled

competition_instances (Individual Matches)
├── id (instance_id)
├── template_id
├── tournament_id
├── instance_number (1,2,3...)
├── entry_fee_pennies (can be custom)
├── status ('pending'|'open'|'full'|'active'|'completed'|'cancelled')
├── current_players (0-2)
├── max_players (2)
├── reg_close_at
├── start_at
├── end_at
└── created_at
```

**Key Characteristics:**
- Template = blueprint (e.g., "Round 1 Only")
- Instance = actual match between 2 players
- Multiple instances can exist from same template
- Dynamic creation as users create challenges
- Custom entry fees per match

---

## 🔄 Instance Status Flow

### ONE 2 ONE Status Lifecycle

```
'pending' → User created challenge but hasn't completed team yet
            ↓ (User clicks "Purchase Scorecard")
'open'    → Challenge visible on Challenge Board, waiting for opponent
            ↓ (Second player joins)
'full'    → 2/2 players, no more entries allowed
            ↓ (Tournament starts)
'active'  → Match in progress, scoring happening
            ↓ (Tournament ends)
'completed' → Final scores calculated, winner determined
```

**Special Cases:**
- `'pending'` instances are **INVISIBLE** on Challenge Board
- `'pending'` > 30 minutes → Deleted by cron job (abandoned)
- `'open'` past `reg_close_at` with < 2 players → Cancelled with refunds

### InPlay Competition Status

```
'draft'     → Admin creating competition
'open'      → Registration open
'closed'    → Registration closed, awaiting tournament start
'active'    → Tournament in progress
'completed' → Tournament finished
```

---

## 🎮 User Flow Comparison

### InPlay Competition Entry Flow

1. User browses tournament competitions
2. Selects competition type (Gold/Platinum/etc.)
3. Builds 6-player team (salary cap: £60,000)
4. Confirms purchase → Entry created with `status: 'submitted'`
5. Wallet debited immediately
6. Entry visible in "My Scorecards"

**API Endpoints:**
- `GET /api/tournaments` - List tournaments
- `GET /api/competitions/{competitionId}` - Get competition details
- `GET /api/competitions/{competitionId}/golfers` - Available players
- `POST /api/competitions/{competitionId}/entries` - Submit entry

### ONE 2 ONE Challenge Flow

1. User browses available tournaments
2. Opens ONE 2 ONE modal
3. Selects tournament from list
4. Chooses round template (R1 only, All 4 rounds, etc.)
5. Confirms selection → **Instance created with `status: 'pending'`** ⚠️
6. Redirected to team builder (same as InPlay)
7. Builds 6-player team (salary cap: £60,000)
8. Clicks "Purchase Scorecard" → **Instance activated to `status: 'open'`** ⚠️
9. Redirected to confirmation page
10. Confirms purchase → Entry created with `status: 'submitted'`, wallet debited
11. Challenge appears on Challenge Board
12. Other users can accept the challenge
13. Second player joins → Instance becomes `status: 'full'`

**Critical Difference:** Instance created BEFORE team is built, but only becomes visible AFTER activation.

**API Endpoints:**
- `POST /api/one-2-one/join` - Create/join instance
- `POST /api/one-2-one/instances/{instanceId}/activate` - Activate pending instance ⚠️
- `GET /api/one-2-one/templates/{tournamentId}` - Get available templates
- `GET /api/one-2-one/all-open-challenges` - Challenge Board (status='open' only)
- `GET /api/user/my-entries?one2one=true` - User's ONE 2 ONE matches

---

## 🔑 Key Technical Differences

| Feature | InPlay Competitions | ONE 2 ONE Challenges |
|---------|-------------------|---------------------|
| **Table** | `tournament_competitions` | `competition_instances` |
| **Identification** | `competition_id` | `instance_id` |
| **Detection Flag** | N/A | `is_one_2_one: true` (in API response) |
| **Entry Fee** | Fixed per competition | Variable per instance |
| **Max Players** | Unlimited (up to `entrants_cap`) | Always 2 |
| **Instance Creation** | Pre-created by admin | Dynamically created by users |
| **Status Before Team Built** | N/A (no entry until submitted) | `'pending'` (hidden) |
| **Visibility Logic** | All open competitions visible | Only `status='open'` instances visible |
| **Navigation Warning** | Only if lineup selected | Always (prevents orphaned instances) |
| **Cleanup** | Manual admin action | Automatic cron job |

---

## 🚨 Critical Implementation Details

### 1. Detecting ONE 2 ONE Competitions

**DO NOT** rely on `competition_type` field or table name detection.

**CORRECT METHOD:**
```typescript
// In API response from /api/competitions/{competitionId}
const isOne2One = competition?.is_one_2_one === true;
```

**Where It's Set:**
```typescript
// apps/golf/src/app/api/competitions/[competitionId]/route.ts
// Lines 96-119 for competition_instances
return {
  ...instanceData,
  is_one_2_one: true  // ← Critical flag
}
```

### 2. Preventing Orphaned Instances

**Problem:** User creates instance but abandons team builder before submitting.

**Solution:** Two-phase activation

```typescript
// Phase 1: Create with status='pending' (invisible)
POST /api/one-2-one/join
Response: { instanceId, isNew: true }

// Phase 2: Activate when team built (visible)
if (competition?.is_one_2_one) {
  await fetch(`/api/one-2-one/instances/${instanceId}/activate`, {
    method: 'POST'
  });
}
```

**Where Activated:**
- `apps/golf/src/app/build-team/[competitionId]/page.tsx`
- Line 472-483 in `submitLineup()` function
- Called BEFORE navigating to confirmation page

### 3. Challenge Board Filtering

**MUST** only show `status='open'` instances:

```typescript
// ✅ CORRECT
const { data } = await supabase
  .from('competition_instances')
  .select('*')
  .eq('status', 'open')  // ← Critical filter
  .eq('tournament_id', tournamentId);

// ❌ WRONG - will show pending instances
const { data } = await supabase
  .from('competition_instances')
  .select('*')
  .eq('tournament_id', tournamentId);
```

### 4. Navigation Warning

**InPlay:** Warn only if lineup has selections
```typescript
const hasSelection = lineup.some(slot => slot.golfer !== null);
```

**ONE 2 ONE:** Always warn (even without selections)
```typescript
const shouldWarn = competition?.is_one_2_one || hasSelection;
```

**Reason:** Prevents orphaned `'pending'` instances that waste database space.

### 5. Entry Creation Safeguard

**Protection against bypassing activation:**

```typescript
// apps/golf/src/app/api/competitions/[competitionId]/entries/route.ts
// Lines 78-83

if (status === 'submitted' && instanceData.status === 'pending') {
  return NextResponse.json(
    { error: 'Challenge must be activated before submitting.' },
    { status: 400 }
  );
}
```

This prevents entries being created for `'pending'` instances if user somehow bypasses the UI flow.

---

## 🧹 Cleanup & Maintenance

### Automatic Cleanup (Cron Job)

**Endpoint:** `/api/one-2-one/cron/cancel-unfilled`

**Runs:** Every minute (Vercel Cron)

**Actions:**
1. **Delete** `'pending'` instances > 30 minutes old (abandoned team builders)
2. **Cancel** `'open'` instances past `reg_close_at` with < 2 players
3. **Refund** any entry fees for cancelled matches

**Configuration:**
```json
// apps/golf/vercel.json
{
  "crons": [{
    "path": "/api/one-2-one/cron/cancel-unfilled",
    "schedule": "* * * * *"
  }]
}
```

**Environment Variable:**
```
CRON_SECRET=your-secure-random-string
```

### Manual Cleanup

**Script:** `scripts/cleanup-pending-instances.sql`

**Use Cases:**
- Testing/development cleanup
- Emergency cleanup before cron job enabled
- Manual intervention for stuck instances

**Safe to Run:** Only deletes instances with NO entries.

---

## 📊 Database Queries

### Get All User's Competitions (Both Types)

```sql
-- InPlay Competitions
SELECT 
  ce.id as entry_id,
  tc.id as competition_id,
  t.name as tournament_name,
  ct.name as competition_type,
  ce.status,
  ce.entry_fee_paid,
  'inplay' as type
FROM competition_entries ce
JOIN tournament_competitions tc ON ce.competition_id = tc.id
JOIN tournaments t ON tc.tournament_id = t.id
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE ce.user_id = $1
  AND ce.status IN ('submitted', 'active', 'completed')

UNION ALL

-- ONE 2 ONE Challenges
SELECT 
  ce.id as entry_id,
  ci.id as competition_id,
  t.name as tournament_name,
  ct.name as template_name,
  ce.status,
  ce.entry_fee_paid,
  'one2one' as type
FROM competition_entries ce
JOIN competition_instances ci ON ce.competition_id = ci.id
JOIN tournaments t ON ci.tournament_id = t.id
JOIN competition_templates ct ON ci.template_id = ct.id
WHERE ce.user_id = $1
  AND ce.status IN ('submitted', 'active', 'completed')
ORDER BY entry_id DESC;
```

### Challenge Board Query (Open Challenges)

```sql
SELECT 
  ci.id,
  ci.instance_number,
  ci.entry_fee_pennies,
  ci.current_players,
  ci.max_players,
  ci.created_at,
  ct.name as template_name,
  ct.rounds_covered,
  t.name as tournament_name,
  t.start_date,
  u.display_name as creator_name
FROM competition_instances ci
JOIN competition_templates ct ON ci.template_id = ct.id
JOIN tournaments t ON ci.tournament_id = t.id
LEFT JOIN competition_entries ce ON ce.competition_id = ci.id
LEFT JOIN profiles u ON ce.user_id = u.user_id
WHERE ci.status = 'open'  -- ⚠️ Critical filter
  AND ci.tournament_id = $1
  AND ci.current_players < ci.max_players
ORDER BY ci.created_at DESC;
```

---

## 🐛 Common Issues & Debugging

### Issue: Challenges not appearing on Challenge Board

**Possible Causes:**
1. Instance status is `'pending'` (team not built yet)
2. Instance status is `'full'` (2 players already)
3. Query not filtering by tournament correctly
4. User's own challenges are being filtered out

**Debug:**
```sql
-- Check instance status
SELECT id, status, current_players, created_at 
FROM competition_instances 
WHERE tournament_id = '<tournament-id>'
ORDER BY created_at DESC;
```

### Issue: Duplicate instances created

**Possible Causes:**
1. User double-clicked "Confirm Selection" button
2. Button not disabled during API call

**Solution:** Button already has `disabled` logic and loading state
```typescript
disabled={joiningTemplate !== null || isClosed || !selectedTemplate}
```

### Issue: Orphaned instances with no entries

**Possible Causes:**
1. User abandoned team builder before completion
2. Cron job not running
3. Cron job secret misconfigured

**Solution:**
- Run manual cleanup script: `cleanup-pending-instances.sql`
- Verify cron job is enabled in Vercel
- Check `CRON_SECRET` environment variable

### Issue: Entry fee mismatch

**Possible Causes:**
1. Instance `entry_fee_pennies` not matching template default
2. Custom entry fee was set
3. Database not updated during instance creation

**Debug:**
```sql
-- Compare template vs instance fees
SELECT 
  ci.id,
  ci.entry_fee_pennies as instance_fee,
  ct.default_entry_fee_pennies as template_fee,
  ci.entry_fee_pennies - ct.default_entry_fee_pennies as difference
FROM competition_instances ci
JOIN competition_templates ct ON ci.template_id = ct.id
WHERE ci.id = '<instance-id>';
```

---

## 🚀 Production Deployment Checklist

### Environment Variables
- [ ] `CRON_SECRET` - Set securely for cron job authentication
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Required for cron job
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Public Supabase URL

### Vercel Configuration
- [ ] Enable cron job in `apps/golf/vercel.json`
- [ ] Verify cron endpoint is accessible
- [ ] Test cron authentication with secret

### Database
- [ ] Verify `competition_templates` table has default templates
- [ ] Check `status` column exists on `competition_instances`
- [ ] Confirm foreign key relationships are intact

### Testing Checklist
- [ ] Create ONE 2 ONE challenge and abandon (should be pending)
- [ ] Complete ONE 2 ONE challenge (should be open)
- [ ] Verify Challenge Board shows only open challenges
- [ ] Test navigation warning on team builder
- [ ] Confirm entry submission blocked for pending instances
- [ ] Wait 30 minutes, verify cron deletes pending instances
- [ ] Test refund flow for cancelled challenges

### Monitoring
- [ ] Set up logging for cron job executions
- [ ] Monitor for `'pending'` instances > 30 minutes
- [ ] Track orphaned instances without entries
- [ ] Alert on failed activation API calls

---

## 📝 Code References

### Critical Files

**ONE 2 ONE Modal & Challenge Creation:**
- `apps/golf/src/app/one-2-one/[slug]/page.tsx`
  - Line 147: Sets `joiningTemplate` state
  - Lines 825-835: Tournament selection (preserves round selection)
  - Lines 1036-1080: Confirm button with loading states

**Team Builder (Shared):**
- `apps/golf/src/app/build-team/[competitionId]/page.tsx`
  - Lines 83-102: Navigation warning with ONE 2 ONE detection
  - Lines 472-483: Instance activation call for ONE 2 ONE
  - Line 455-502: `submitLineup()` function

**Confirmation Page (Shared):**
- `apps/golf/src/app/build-team/[competitionId]/confirm/page.tsx`
  - Lines 95-145: `confirmPurchase()` function
  - Submits entry with `status: 'submitted'`

**API Endpoints:**
- `apps/golf/src/app/api/one-2-one/join/route.ts`
  - Line 136: Creates instance with `status: 'pending'`
- `apps/golf/src/app/api/one-2-one/instances/[instanceId]/activate/route.ts`
  - Changes `'pending'` → `'open'`
- `apps/golf/src/app/api/competitions/[competitionId]/entries/route.ts`
  - Lines 62-87: Fetches instance data and validates status
  - Lines 208-235: Increments `current_players` on submission

**Cron Job:**
- `apps/golf/src/app/api/one-2-one/cron/cancel-unfilled/route.ts`
  - Lines 26-59: Deletes pending instances > 30 minutes
  - Lines 61-150: Cancels unfilled open instances

---

## 🎓 Best Practices

### 1. Always Use `is_one_2_one` Flag
```typescript
// ✅ DO THIS
if (competition?.is_one_2_one) {
  // ONE 2 ONE specific logic
}

// ❌ DON'T DO THIS
if (competitionId.includes('instance')) {
  // Brittle and unreliable
}
```

### 2. Filter by Status in Queries
```typescript
// ✅ Challenge Board - only show open
.eq('status', 'open')

// ✅ My Matches - show active matches
.in('status', ['open', 'active'])

// ❌ Don't forget status filter
.select('*') // Shows pending, cancelled, everything
```

### 3. Handle Both Competition Types
```typescript
// Many endpoints support BOTH types
const compRes = await fetch(`/api/competitions/${competitionId}`);
const comp = await compRes.json();

// Check type before applying ONE 2 ONE logic
if (comp.is_one_2_one) {
  // Specific to ONE 2 ONE
} else {
  // Standard InPlay competition
}
```

### 4. Test Abandonment Scenarios
```typescript
// Simulate user abandoning team builder
// 1. Create challenge (pending)
// 2. Close browser
// 3. Wait 30 minutes
// 4. Verify cron deleted it
// 5. Verify it never appeared on Challenge Board
```

---

## 📞 Support & Troubleshooting

### Logs to Check

**Supabase Logs:**
- Table: `competition_instances` - Look for stuck `'pending'`
- Table: `competition_entries` - Verify status progression

**Application Logs:**
- Search for: `"🎯 Activating ONE 2 ONE instance"`
- Search for: `"🧹 Cleaning up abandoned pending instances"`
- Look for activation errors

**Vercel Logs:**
- Check cron job executions
- Verify cron secret authentication

### Health Check Queries

```sql
-- Pending instances > 30 minutes (should be 0 if cron is working)
SELECT COUNT(*) 
FROM competition_instances 
WHERE status = 'pending' 
  AND created_at < NOW() - INTERVAL '30 minutes';

-- Open challenges per tournament
SELECT 
  t.name,
  COUNT(*) as open_challenges
FROM competition_instances ci
JOIN tournaments t ON ci.tournament_id = t.id
WHERE ci.status = 'open'
GROUP BY t.name;

-- Entry fee mismatch check
SELECT * FROM competition_instances ci
JOIN competition_templates ct ON ci.template_id = ct.id
WHERE ci.entry_fee_pennies != ct.default_entry_fee_pennies
  AND ct.custom_fees_enabled = false;
```

---

## 🔐 Security Considerations

1. **Cron Job:** Requires `CRON_SECRET` bearer token
2. **Instance Activation:** User must be authenticated
3. **Entry Submission:** Blocked if instance is `'pending'`
4. **Wallet Deduction:** Only happens on final confirmation, not instance creation

---

## 📅 Version History

- **v1.0** - Initial ONE 2 ONE implementation
- **v2.0** - Added `'pending'` status to prevent orphaned visible challenges
- **v2.1** - Added automatic cleanup cron job
- **v2.2** - Added safeguard against pending instance submissions

---

*This document should be shared with all developers working on the competition system. Keep it updated as the architecture evolves.*
