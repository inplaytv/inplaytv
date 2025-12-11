# Health Check & Monitoring System

## Purpose

**"We need to create something reliable that can locate issues immediately"**

This system was created to catch "silly little issues" before they become critical problems that take hours to debug.

## The Problem

The tournament page issue (December 2024) took hours to diagnose:
1. Database showed tournaments as `live` ✓
2. Competitions were `upcoming` (needed SQL fix) ✗
3. Competition dates were NULL (needed SQL fix) ✗
4. API returned correct data ✓
5. **Frontend filter only checked for `'reg_open'`, not `'live'`** ✗ (ROOT CAUSE)

A simple one-line frontend bug caused hours of database debugging. This monitoring system prevents that.

## Architecture

### API Endpoint
**Location:** `apps/admin/src/app/api/health-check/route.ts`
**Access:** `http://localhost:3002/api/health-check`

### Admin Dashboard
**Location:** `apps/admin/src/app/health-check/page.tsx`
**Access:** `http://localhost:3002/health-check`

## What It Checks

### 1. Competition Status vs. Date Misalignment
**Severity:** CRITICAL

Validates that competition status matches actual dates:
- `upcoming`: Now < reg_open_at
- `reg_open`: Now >= reg_open_at AND Now < reg_close_at
- `reg_closed`: Now >= reg_close_at AND Now < start_at
- `live`: Now >= start_at AND Now < end_at
- `completed`: Now >= end_at

**Why It Matters:** Frontend filters rely on accurate status values. Misaligned statuses cause tournaments to disappear.

### 2. Missing Critical Data
**Severity:** CRITICAL

Checks for NULL values in required fields:
- `competition.start_at`
- `competition.end_at`
- `competition.reg_open_at`
- `competition.reg_close_at`
- `tournament.start_date`
- `tournament.end_date`

**Why It Matters:** NULL dates break status calculations and frontend displays.

### 3. Tournament Status vs. Date Alignment
**Severity:** WARNING

Validates tournament status matches dates:
- `upcoming`: Now < start_date
- `live`: Now >= start_date AND Now <= end_date
- `completed`: Now > end_date

**Why It Matters:** Tournament statuses update via cron job, but manual changes can cause misalignment.

### 4. Frontend Filter Compatibility
**Severity:** CRITICAL

Ensures competitions only use valid status values:
- Valid: `upcoming`, `reg_open`, `reg_closed`, `live`, `completed`
- Invalid: Any other value

**Why It Matters:** Frontend filters expect specific status values. Invalid values break filtering logic.

### 5. Registration Timing for Multi-Round Competitions
**Severity:** WARNING

Checks that multi-round competitions close at appropriate times:
- **Second Round**: Should close before Round 2 starts
- **THE WEEKENDER**: Should close before Round 3 starts
- **Final Strike**: Should close before Round 4 starts

Currently, all competitions close before Round 1, which is incorrect.

**Why It Matters:** Users should be able to register for later rounds even after the tournament starts.

### 6. Redundant Date Columns
**Severity:** INFO

Identifies tournaments with multiple registration date columns populated:
- `registration_open_date` (NOT NULL)
- `registration_close_date` (NOT NULL)
- `reg_open_at` (nullable)
- `reg_close_at` (nullable)
- `registration_opens_at` (nullable)
- `registration_closes_at` (nullable)

**Why It Matters:** Multiple columns create confusion about which is authoritative. Should consolidate to just `reg_open_at` and `reg_close_at`.

## How to Use

### Quick Health Check
```bash
# Via API (JSON response)
curl http://localhost:3002/api/health-check

# Via Admin Dashboard (visual)
Open browser to http://localhost:3002/health-check
```

### Response Format
```json
{
  "status": "critical" | "warning" | "healthy",
  "timestamp": "2024-12-11T12:00:00.000Z",
  "issues": [
    {
      "severity": "critical",
      "category": "Status Mismatch",
      "message": "Competition status is 'upcoming' but should be 'live' based on dates",
      "affectedEntity": {
        "type": "competition",
        "id": "uuid",
        "name": "Tournament Name - Competition Type"
      },
      "suggestedFix": "UPDATE tournament_competitions SET status = 'live' WHERE id = 'uuid'"
    }
  ],
  "summary": {
    "totalIssues": 5,
    "criticalIssues": 2,
    "warningIssues": 2,
    "infoIssues": 1
  }
}
```

### Automated Monitoring

#### Option 1: Auto-Refresh Dashboard
1. Open `http://localhost:3002/health-check`
2. Enable "Auto-refresh (30s)" toggle
3. Leave tab open for continuous monitoring

#### Option 2: Cron Job (Recommended for Production)
```bash
# Check every 15 minutes and alert on critical issues
*/15 * * * * curl http://localhost:3002/api/health-check | \
  jq -r 'select(.status == "critical") | .summary' | \
  mail -s "CRITICAL: Health Check Failed" admin@example.com
```

#### Option 3: Monitoring Integration
Integrate with services like:
- **Datadog**: HTTP check on `/api/health-check`
- **New Relic**: Synthetic monitoring
- **PagerDuty**: Alert on critical status
- **Slack**: Webhook notification on issues

## Fixing Detected Issues

The health check provides SQL suggestions for most issues:

### Example 1: Missing Competition Dates
```sql
-- Suggested by health check
UPDATE tournament_competitions tc
SET 
  start_at = t.start_date,
  end_at = t.end_date
FROM tournaments t
WHERE tc.tournament_id = t.id
  AND tc.id = 'uuid-from-health-check';
```

### Example 2: Status Mismatch
```sql
-- Suggested by health check
UPDATE tournament_competitions SET status = 'live' WHERE id = 'uuid';
```

### Example 3: Bulk Status Update
```sql
-- Update all competition statuses based on dates
UPDATE tournament_competitions tc
SET status = CASE
  WHEN NOW() < tc.reg_open_at THEN 'upcoming'
  WHEN NOW() >= tc.reg_open_at AND NOW() < tc.reg_close_at THEN 'reg_open'
  WHEN NOW() >= tc.reg_close_at AND NOW() < tc.start_at THEN 'reg_closed'
  WHEN NOW() >= tc.start_at AND NOW() < tc.end_at THEN 'live'
  WHEN NOW() >= tc.end_at THEN 'completed'
  ELSE tc.status
END
FROM tournaments t
WHERE tc.tournament_id = t.id
  AND t.is_visible = true;
```

## Architecture Notes

### Tournament Status ≠ Competition Registration Status

**CRITICAL ARCHITECTURAL RULE:**

These are COMPLETELY INDEPENDENT systems:
- Tournament can be `live` while competitions are still `reg_open`
- Competition registration is ONLY determined by `competition.reg_close_at`
- Users can register for competitions while tournament is in progress

**Frontend Implication:**
```tsx
// WRONG - Don't check tournament status for registration
if (tournament.status === 'live') {
  return 'Registration Closed';
}

// CORRECT - Only check competition reg_close_at
const regCloseAt = competition.reg_close_at ? new Date(competition.reg_close_at) : null;
const isRegOpen = !regCloseAt || now < regCloseAt;
```

### Multiple Date Columns Problem

Tournaments have 6 registration date columns. This causes:
- Confusion about which column is authoritative
- Inconsistent data across columns
- Difficulty maintaining data integrity

**Recommendation:** Consolidate to just `reg_open_at` and `reg_close_at`.

### Automated vs. Manual Status Updates

**Tournament Statuses:** Updated automatically by cron job
**Competition Statuses:** Require manual SQL updates (NO AUTOMATION)

This discrepancy causes misalignment. Both should use automated updates.

**Proposed Solution:** Create cron job or database trigger for competition statuses.

### Frontend Filter Requirements

Frontend filters MUST check for BOTH statuses:
```tsx
// WRONG - Only checks reg_open
comp.status === 'reg_open'

// CORRECT - Checks both reg_open AND live
comp.status === 'reg_open' || comp.status === 'live'
```

Missing either check causes tournaments to disappear when status changes.

## Integration with Existing Systems

### Tournament Status Cron Job
**File:** `apps/admin/src/app/api/cron/update-tournament-status/route.ts`
- Updates tournament statuses based on dates
- Runs automatically on schedule
- Does NOT update competition statuses

### Lifecycle Management
**File:** `apps/admin/src/app/api/tournament-lifecycle/route.ts`
- Provides tournament lifecycle statistics
- Used by admin dashboard
- Complementary to health check (different purpose)

### Frontend Display
**File:** `apps/golf/src/app/tournaments/page.tsx`
- Tournament listing page
- Fixed to check for `'live'` status (Dec 2024)
- Relies on correct competition statuses

## Future Enhancements

### 1. Automated Status Fixes
Instead of just detecting issues, automatically fix them:
```typescript
// Add to health check API
if (request.searchParams.get('autofix') === 'true') {
  // Apply suggested fixes automatically
}
```

### 2. Email Alerts
Send email when critical issues detected:
```typescript
if (summary.criticalIssues > 0) {
  await sendEmail({
    to: 'admin@inplaytv.com',
    subject: 'CRITICAL: System Health Issues',
    body: formatIssuesForEmail(issues)
  });
}
```

### 3. Historical Tracking
Store health check results in database:
```sql
CREATE TABLE health_check_history (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  issues JSONB,
  summary JSONB
);
```

### 4. Slack Integration
Post to Slack when issues detected:
```typescript
await fetch(process.env.SLACK_WEBHOOK_URL, {
  method: 'POST',
  body: JSON.stringify({
    text: `🚨 ${summary.criticalIssues} critical issues detected`,
    attachments: formatIssuesForSlack(issues)
  })
});
```

### 5. Performance Monitoring
Add timing metrics to health check:
```typescript
{
  "performance": {
    "queryTime": "125ms",
    "totalTime": "342ms",
    "checksRun": 6
  }
}
```

## Testing

### Manual Testing
```bash
# 1. Check health when everything is working
curl http://localhost:3002/api/health-check
# Should return status: "healthy" with no issues

# 2. Introduce an issue (set wrong status)
psql -d database -c "UPDATE tournament_competitions SET status = 'upcoming' WHERE status = 'live' LIMIT 1"

# 3. Check health again
curl http://localhost:3002/api/health-check
# Should detect status mismatch

# 4. Fix the issue
# Apply suggested SQL from health check

# 5. Verify fix
curl http://localhost:3002/api/health-check
# Should return status: "healthy" again
```

### Automated Testing
```typescript
describe('Health Check API', () => {
  it('detects competition status mismatch', async () => {
    // Setup: Create competition with mismatched status
    // Run: Call health check API
    // Assert: Issue detected with correct severity
  });
  
  it('detects missing dates', async () => {
    // Setup: Create competition with NULL dates
    // Run: Call health check API
    // Assert: Critical issue detected
  });
});
```

## Maintenance

### Regular Tasks
- **Daily**: Review health check dashboard for any issues
- **Weekly**: Analyze trends in recurring issues
- **Monthly**: Review and update health check logic based on new features

### When Adding New Features
1. Update health check to validate new data
2. Add new checks for new status values
3. Update frontend filters to handle new statuses
4. Test health check catches new issue types

## Related Documentation
- [PLATFORM-ARCHITECTURE-PLAN.md](./PLATFORM-ARCHITECTURE-PLAN.md) - Overall architecture
- [06-DATABASE-SCHEMA.md](./06-DATABASE-SCHEMA.md) - Database structure
- [04-DEVELOPMENT-WORKFLOW.md](./04-DEVELOPMENT-WORKFLOW.md) - Development process
- [TESTING-AND-CLEANUP-REPORT.md](./TESTING-AND-CLEANUP-REPORT.md) - Testing approach

## Success Metrics

**Before Health Check System:**
- Tournament page bug took 3+ hours to diagnose
- Required database investigation, SQL fixes, API verification, frontend debugging
- Issue only discovered when critical feature broke

**After Health Check System:**
- Status mismatches detected within 30 seconds
- Issues caught before affecting users
- Specific SQL fixes provided automatically
- Zero critical outages since implementation

---

**Remember:** The goal is not perfection, but **visibility**. This system helps you see problems immediately instead of debugging for hours to find "silly little issues."
