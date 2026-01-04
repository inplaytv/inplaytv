# InPlayTV Fantasy Golf Platform - AI Coding Instructions

## Project Overview
Turborepo monorepo for a real-time fantasy golf platform with three Next.js apps: **golf** (player-facing game app), **web** (marketing/auth), and **admin** (tournament management). Uses Supabase (PostgreSQL), DataGolf API, Stripe for payments, and comprehensive email/notification system.

## Architecture

### Monorepo Structure
- **`apps/golf/`** - Main game app (Next.js 16, React 19, port 3003)
- **`apps/admin/`** - Admin dashboard (Next.js 14, React 18, port 3002)
- **`apps/web/`** - Marketing site (Next.js 14, React 18, port 3000)
- **`packages/scoring-service/`** - Shared TypeScript scoring logic with DataGolf adapter
- **`packages/shared/`** - Shared utilities and types
- **`scripts/`** - Database migrations, diagnostic tools, and setup scripts

### Dev Commands (PowerShell)
```powershell
pnpm install              # Install all dependencies (requires pnpm@9.0.0)
pnpm dev                  # Run all 3 apps in parallel
pnpm dev:golf             # Run golf app only (most common)
pnpm dev:admin            # Run admin app only
pnpm kill:ports           # Kill all node processes (use when ports stuck)
pnpm restart:golf         # Kill ports + restart golf app
```

**Note**: If `pnpm dev` hangs during install, use `pnpm install --no-frozen-lockfile`

## Database Architecture

### 🚨 CRITICAL: UNIFIED COMPETITION SYSTEM 🚨
**READ THIS FIRST - DO NOT SKIP**

**ONE TABLE FOR EVERYTHING**: Both InPlay and ONE 2 ONE use the SAME table: `tournament_competitions`

**There is NO `competition_instances` table. There is NO `instance_id` column. Everything uses `competition_id`.**

```typescript
tournament_competitions {
  competition_format: 'inplay' | 'one2one'  // ONLY way to distinguish types
  competition_type_id: UUID | NULL          // NOT NULL for InPlay, NULL for ONE 2 ONE
  rounds_covered: INTEGER[] | NULL          // NULL/optional for InPlay, REQUIRED for ONE 2 ONE
  status: 'draft' | 'reg_open' | 'live' | 'completed' | 'cancelled'  // SAME statuses for both
}
```

**InPlay** = Pre-created by admins (Full Course, Beat The Cut)
- `competition_format = 'inplay'`
- `competition_type_id IS NOT NULL`
- High player caps (50-1000)

**ONE 2 ONE** = User-created head-to-head challenges
- `competition_format = 'one2one'`
- `competition_type_id IS NULL`
- `rounds_covered` MUST be set (e.g., `[1]` for Round 1)
- Always exactly 2 players

**Entries for BOTH types**: `competition_entries.competition_id` → `tournament_competitions.id`

### Critical Tables & Relationships
- **`tournaments`** → **`tournament_golfers`** (junction) ← **`golfers`**
  - Only golfers in `tournament_golfers` are valid for that tournament
  - `tournament_golfers.status`: 'confirmed', 'withdrawn', 'cut'

- **`golfer_groups`** + **`golfer_group_members`** → Restrict available golfers per competition
  - `tournament_competitions.assigned_golfer_group_id` defines which golfers are valid

- **ALL Competitions**: `tournament_competitions` (InPlay AND ONE 2 ONE)
  - Linked via `competition_entries.competition_id`
  - Distinguished by `competition_format` field ONLY

- **Entries**: `competition_entries` → `competition_entry_picks` (6 golfers, 1 captain)

**Validation Rule**: When creating entries, always verify `golfer_id` exists in `golfer_group_members` where `group_id = competition.assigned_golfer_group_id`

Reference: `DATABASE-SCHEMA-REFERENCE.md` for complete schema details.

## Supabase Client Patterns

### Three Client Types (DO NOT MIX)
1. **Browser Client** (`createClient()` from `apps/golf/src/lib/supabaseClient.ts` or `apps/admin/src/lib/supabaseClient.ts`)
   - Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Client components only
   
2. **Server Client** (`createServerClient()` from `apps/golf/src/lib/supabaseServer.ts` or `apps/admin/src/lib/supabaseServer.ts`)
   - Uses HTTP-only cookies for auth
   - API routes, server components
   - Inherits user session automatically
   
3. **Admin Client** (`createAdminClient()` from `apps/admin/src/lib/supabaseAdminServer.ts`)
   - Uses `SUPABASE_SERVICE_ROLE_KEY`
   - Admin operations only (bypasses RLS)
   - **NEVER expose service role key to browser**
   - Only available in admin app

### Environment Variables (Required in Each App)
```bash
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Public anon key
SUPABASE_SERVICE_ROLE_KEY=        # Admin key (server-only!)
DATAGOLF_API_KEY=                 # DataGolf API access
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=    # Stripe publishable key (pk_test_...)
STRIPE_SECRET_KEY=                # Stripe secret (server-only! sk_test_...)
STRIPE_WEBHOOK_SECRET=            # Stripe webhook signature verification
NEXT_PUBLIC_SITE_URL=             # Base URL (http://localhost:3003 or production)
NEXT_PUBLIC_STRIPE_ENABLED=       # Optional: 'false' forces demo mode
```

**Demo Mode**: If Stripe keys are missing, wallet top-ups use demo mode (no real payments). Perfect for staging/QA.

## Middleware & Site Access Control

Both `apps/golf/src/middleware.ts` and `apps/web/src/middleware.ts` check `site_settings` table for maintenance mode:
- **'live'**: Normal operation
- **'coming_soon'**: Redirects to coming soon page (admins bypass)
- **'maintenance'**: Shows maintenance page (admins bypass)

Admin bypass: Checks `admins` table for `user_id`. Middleware caches mode for 30s (golf) or no cache (web for instant updates).

## DataGolf Integration

- **Setup**: `.\scripts\setup-datagolf-key.ps1 -ApiKey "dg-your-key"`
- **Test**: `node scripts/test-datagolf-connection.js`
- **Sync APIs**: 
  - `/api/sync-datagolf-salaries` - Update golfer salaries
  - `/api/sync-datagolf-rankings` - Update world rankings
  - Auto-called during tournament creation

See `DATAGOLF-QUICKSTART.md` and `DATAGOLF-INTEGRATION-PLAN.md`

## Tournament Lifecycle & Registration Timing

### Lifecycle Manager (Source of Truth)
Admin manages via `/apps/admin/src/app/tournament-lifecycle/`:
- **Tournament Statuses**: upcoming → registration_open → in_progress → completed
- **Registration Windows**: Sets `tournaments.registration_opens_at` and `registration_closes_at`
- **Round Tee Times**: Sets `round1_tee_time`, `round2_tee_time`, `round3_tee_time`, `round4_tee_time`
- **Automated Transitions**: `/api/tournaments/auto-update-statuses` (cron job)

### Competition Timing (Auto-Derived from Lifecycle)
**CRITICAL**: Competitions do NOT have independent registration windows:
- `tournament_competitions.reg_open_at` → Inherits from `tournaments.registration_opens_at`
- `tournament_competitions.reg_close_at` → Auto-calculated as `start_at - 15 minutes`
- `tournament_competitions.start_at` → Set from appropriate round tee time (e.g., Round 1 for Full Course)
- `tournament_competitions.end_at` → Set from tournament end date

**Competition Settings UI** shows registration as read-only (sourced from lifecycle manager). Only start/end times are editable (for weather delays).

**Backend Auto-Calculation**: `/api/tournaments/[id]/competitions/route.ts` fetches tournament registration times and auto-populates competition fields on save.

See `TOURNAMENT-LIFECYCLE-MANAGER.md` for complete workflow.

## Wallet System & Payments

### Wallet Architecture
**CRITICAL**: All balance changes MUST go through `wallet_apply()` RPC function:
```sql
-- Function signature
wallet_apply(
  change_cents INTEGER,  -- Positive for credit, negative for debit
  reason TEXT,           -- Audit trail (e.g., "topup:stripe", "entry:full-course")
  target_user_id UUID    -- Optional, defaults to auth.uid()
) RETURNS INTEGER        -- New balance in cents
```

### Tables (SELECT-only via RLS)
- **`wallets`** - Current balance only (`balance_cents`)
- **`wallet_transactions`** - Immutable audit log (all changes with `balance_after_cents`)
- **`wallet_external_payments`** - Stripe/demo payment tracking (idempotency via `provider_payment_id` UNIQUE)

### Payment Flows

**Stripe Top-Up** (`/wallet` page):
1. User clicks "Top Up Wallet" → `/api/stripe/create-checkout-session`
2. Redirect to Stripe Checkout (or demo modal if keys missing)
3. Stripe webhook → `/api/stripe/webhook` → Verify signature → `wallet_apply(amount, 'topup:stripe')`
4. Record in `wallet_external_payments` with `provider='stripe'`

**Entry Purchase** (`/api/competitions/[id]/entries` POST):
1. Validate sufficient funds via `wallets.balance_cents`
2. Call `deduct_from_wallet()` RPC (wraps `wallet_apply()` with negative amount)
3. Create `competition_entries` record ONLY after successful deduction
4. Never create entry before payment succeeds

**Refunds** (automatic for unfilled ONE 2 ONE challenges):
- Cron job: `/api/one-2-one/cron/cancel-unfilled` (runs hourly)
- Cancels instances with < 2 players after registration closes
- Calls `wallet_apply(entry_fee_paid, 'refund:challenge-cancelled')` per entry
- Updates entry status to `'cancelled'`

**Demo Mode**:
- Activated when `STRIPE_SECRET_KEY` missing or `NEXT_PUBLIC_STRIPE_ENABLED=false`
- Uses `/api/stripe/demo-simulate` to fake payment
- Records in `wallet_external_payments` with `provider='demo'`
- Perfect for QA without real Stripe

### Payment Validation Pattern
```typescript
// Check balance before purchase
const { data: wallet } = await supabase
  .from('wallets')
  .select('balance_cents')
  .eq('user_id', user.id)
  .single();

if (wallet.balance_cents < entryFeePennies) {
  return NextResponse.json({ error: 'Insufficient funds' }, { status: 402 });
}

// Deduct via RPC (atomic)
const { data: result, error } = await supabase.rpc('deduct_from_wallet', {
  p_user_id: user.id,
  p_amount_cents: entryFeePennies,
  p_reason: `Entry: ${competitionName}`
});

if (error?.message?.includes('Insufficient funds')) {
  return NextResponse.json({ error: 'Insufficient funds' }, { status: 402 });
}

// NOW safe to create entry
const { data: entry } = await supabase.from('competition_entries').insert({...});
```

## User Profiles & Display Names

### Profile System
**Tables**: `profiles` (extends `auth.users`)
- `first_name` TEXT - User's first name (required at signup)
- `last_name` TEXT - User's last name (required at signup)
- `username` TEXT UNIQUE - 3+ characters (required at signup)
- `display_name` TEXT GENERATED COLUMN - Auto-computed as:
  - `"First Last"` if both names exist
  - `username` if names missing
  - `"User [id-prefix]"` as final fallback

**Signup Flow** (`apps/web/src/app/(auth)/signup/page.tsx`):
1. Collect: first_name, last_name, username, email, password
2. Create auth user
3. Create profile with all three name fields
4. `display_name` auto-generated by database

**Always use `display_name`** in:
- Leaderboards (`/api/competitions/[id]/leaderboard`)
- User menus (avatar dropdown)
- Admin panels (user lists)
- Challenge boards

## Notification System

### Notification Types
- **Tee Times Available** - Auto-sent when DataGolf sync completes
- **Registration Closing** - Cron job checks hourly, notifies 1-2 hours before close
- **Tournament/Competition Live** - (Future enhancement)

### Implementation
**Bell Icon** (`apps/golf/src/components/NotificationBell.tsx`):
- Real-time via Supabase subscriptions
- Unread count badge
- Dropdown with last 20 notifications
- Click to mark read + navigate

**Cron Job** (`/api/notifications/check-closing`):
- Runs every hour (Vercel cron or external scheduler)
- Finds competitions closing in 1-2 hours
- Sends only to users who haven't entered
- Marks `notified_closing = true` to prevent spam

**User Preferences** (`notification_preferences` table):
- `tee_times_available` - Default TRUE
- `registration_closing` - Default TRUE
- Editable in profile settings

**Database Function** (`notify_tee_times_available()`):
- Called from admin sync API after DataGolf update
- Bulk inserts notifications for all users with preference enabled

## Email Management (Admin)

### Admin Email Panel (`/apps/admin/src/app/email/`)
- **Inbox** - View form submissions with internal notes
- **Outbox** - Track sent emails with delivery status
- **Compose** - Send emails with template support
- **Templates** - Manage pre-made templates with variable substitution (%%%variable%%%)
- **Contacts** - Track contact list with form/email history

### Tables
- `email_templates` - Reusable email templates with categories
- `email_outbox` - All sent emails tracking (status: sent/delivered/bounced)
- `email_inbox` - Form submissions (status: unread/read/replied)
- `contacts` - Contact database with tags and activity tracking
- `email_activity` - Delivery tracking (opened, clicked, bounced)

### Waitlist System
**Public Form** (`apps/web/src/app/coming-soon`):
- Auto-sends welcome email via template
- Records in `waitlist_entries` table
- Tracks in email outbox

**Admin Launch Tool** (`/waitlist` in admin):
- View all waitlist entries
- Send bulk launch notifications
- Individual email links

**See**: `EMAIL-SYSTEM-COMPLETE.md` and `WAITLIST-EMAIL-SYSTEM-SETUP.md`

## Styling Conventions

- **CSS Modules**: Every page has co-located `.module.css` (e.g., `page.tsx` + `lobby.module.css`)
- **Dark Theme**: Primary colors in admin, vibrant gradients in golf app
- **Import Pattern**: `import styles from './component-name.module.css'`
- **Glassmorphic Cards**: Semi-transparent backgrounds with backdrop blur (common in admin)

## API Route Patterns

All API routes in `apps/golf/src/app/api/`:
- `export const dynamic = 'force-dynamic'` for real-time data
- Server client for authenticated requests: `const supabase = await createServerClient()`
- Admin client for privileged operations: `const supabaseAdmin = createAdminClient()`
- Always validate user auth before mutations: `const { data: { user }, error } = await supabase.auth.getUser()`

## Common Debugging Scripts (Root Directory)

Root contains many `.js`/`.ps1` diagnostic scripts:
- `check-database.js` - Verify DB schema
- `check-tournament-golfers.js` - Validate tournament golfer assignments
- `test-supabase-connection.js` - Test DB connectivity
- `diagnose-*.js` - Various troubleshooting scripts
- `check-*.ps1` - PowerShell diagnostic tools
- `fix-*.sql` - SQL migration scripts (apply via Supabase SQL Editor)
- `setup-*.ps1` - Environment setup scripts

**Load env pattern**: `require('dotenv').config({ path: './apps/golf/.env.local' })`

### Script Categories

**Database Inspection**:
- `check-database.js` - Schema verification
- `check-tournament-columns.js` - Column existence checks
- `check-golfers-schema.js` - Golfer table structure
- `quick-db-check.js` - Fast health check

**Data Validation**:
- `check-tournament-golfers.js` - Validate junction table
- `check-entries.js` - Entry data integrity
- `check-one2one-instances.sql` - Challenge instance status
- `diagnose-golfer-visibility.js` - Golfer group issues

**DataGolf Integration**:
- `test-datagolf-connection.js` - API connectivity
- `check-datagolf-fields.js` - Field structure validation
- `sync-dunhill-scores.js` - Manual score sync
- `get-datagolf-events.ps1` - Fetch available tournaments

**Tournament Management**:
- `check-tournament-setup.js` - Complete tournament validation
- `check-tournament-status.js` - Status consistency
- `verify-all-tournaments-timing.sql` - Registration window checks
- `comprehensive-timing-check.js` - Full timing validation

**Cleanup & Fixes**:
- `delete-competition-entries.js` - Bulk entry deletion
- `cleanup-*.sql` - Various cleanup scripts
- `fix-*.sql` - Migration scripts for schema fixes
- `nuclear-*.sql` - Emergency reset scripts (use with caution!)

### Migration Scripts (`/scripts/`)
Organized by date and purpose:
- `2025-01-*.sql` - Schema migrations (run in Supabase SQL Editor)
- `migrations/` - Versioned migration files
- `setup-*.ps1` - PowerShell setup automation
- `apply-*.js` - JavaScript migration runners

**Always check `scripts/` directory** before creating new migrations - may already exist!

## Key Documentation Files

- `DATABASE-SCHEMA-REFERENCE.md` - Complete DB schema
- `TOURNAMENT-LIFECYCLE-MANAGER.md` - Admin tournament management
- `DATAGOLF-QUICKSTART.md` - External API integration
- `SITE-ACCESS-CONTROL-FIXED.md` - Maintenance mode system
- `EMAIL-SYSTEM-COMPLETE.md` - Email management system
- `NOTIFICATION-SYSTEM-SETUP.md` - User notifications & cron jobs
- `USER-NAMES-IMPLEMENTATION.md` - Profile & display name system
- `WALLET-TOPUP-IMPLEMENTATION.md` - Stripe integration & demo mode
- `ONE-2-ONE-REFUND-SYSTEM.md` - Automatic refund logic
- Root `.md` files document historical fixes and features (reference for patterns)

## ONE 2 ONE vs InPlay Competitions

### Two Completely Separate Systems
**CRITICAL**: These are **mutually exclusive** competition types with different data models:

| Feature | InPlay Competitions | ONE 2 ONE Challenges |
|---------|-------------------|---------------------|
| **Table** | `tournament_competitions` | `competition_instances` |
| **Entry Link** | `competition_id` (NOT NULL) | `instance_id` (NOT NULL) |
| **Constraint** | `instance_id` MUST be NULL | `competition_id` MUST be NULL |
| **Players** | Unlimited (up to `entrants_cap`) | Exactly 2 (head-to-head) |
| **Creation** | Admin pre-creates | User-triggered, auto-spawn |
| **Team Size** | 6 golfers + 1 captain | 6 golfers + 1 captain (same) |
| **Detection** | `competition_type_id` NOT NULL | `rounds_covered` NOT NULL |
| **URL Pattern** | `/tournaments/[slug]` | `/one-2-one/[slug]` |

### Entry Creation Flow Differences

**InPlay (Standard):**
1. User selects competition from list
2. Builds 6-golfer team in team builder
3. Submits entry → `competition_entries` created with `competition_id`
4. Entry immediately active

**ONE 2 ONE (Challenge-based):**
1. User selects tournament + round template
2. System creates `competition_instances` record with `status: 'pending'`
3. User builds 6-golfer team
4. Clicks "Purchase Scorecard" → Instance activated to `status: 'open'`
5. Submits entry → `competition_entries` created with `instance_id`
6. Challenge appears on Challenge Board
7. Second player joins → Instance becomes `status: 'full'`, auto-spawns next instance

### Code Detection Pattern
```typescript
// Type guards in apps/golf/src/lib/competition-utils.ts
function isInPlayCompetition(item: any): boolean {
  return item.competition_type_id !== null && item.rounds_covered === undefined;
}

function isOne2OneTemplate(item: any): boolean {
  return item.rounds_covered !== null && item.competition_type_id === undefined;
}

// Database query pattern
const { data: entry } = await supabase
  .from('competition_entries')
  .select('*')
  .eq(isOne2One ? 'instance_id' : 'competition_id', id);
```

### Critical Validation Rule
**NEVER** set both `competition_id` and `instance_id` on same entry - database constraint will fail:
```sql
CHECK (
  (competition_id IS NOT NULL AND instance_id IS NULL) OR
  (competition_id IS NULL AND instance_id IS NOT NULL)
)
```

## Scoring Service Package

### Purpose
`packages/scoring-service/` provides a **provider-agnostic** scoring adapter for fetching live tournament data. Currently implements DataGolf, designed for easy migration to SportsRadar or other providers.

### Architecture
```
scoring-service/src/index.ts
├── ScoringAdapter interface (provider contract)
├── DataGolfAdapter (current implementation)
├── TournamentScores types (normalized format)
└── Retry logic with exponential backoff
```

### When to Use
**Import in API routes only** - scoring service is server-side only:
```typescript
import { DataGolfAdapter } from '@inplaytv/scoring-service';

// Example: Fetch live scores
const adapter = new DataGolfAdapter(process.env.DATAGOLF_API_KEY!);
const scores = await adapter.fetchLiveScores(tournamentId, supabase);
```

### Key Types
```typescript
interface TournamentScores {
  tournament: { id, name, currentRound, status, lastUpdate };
  scores: PlayerRoundScore[]; // Array of golfer scores
}

interface PlayerRoundScore {
  golfer: { id, dgId, name, country };
  rounds: { round1?, round2?, round3?, round4? };
  position?: string;
  totalScore?: number;
  toPar?: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'withdrawn' | 'cut';
}
```

### DataGolf Integration Points
- **Live Scores**: `/api/fantasy/calculate-scores` - Real-time scoring during tournaments
- **Field Sync**: `/api/sync-datagolf-salaries` - Update golfer salaries before tournament
- **Rankings**: `/api/sync-datagolf-rankings` - Update world rankings
- **Historical Data**: Used for completed tournaments via `historical-raw-data` endpoint

### Provider Migration Pattern
To switch providers, create new adapter implementing `ScoringAdapter` interface:
```typescript
class SportsRadarAdapter implements ScoringAdapter {
  async fetchLiveScores(tournamentId: string, supabase: SupabaseClient): Promise<TournamentScores> {
    // Implement SportsRadar API calls
    // Return same TournamentScores format
  }
}
```

## 🛑 THREE SEPARATE SYSTEMS - CRITICAL ISOLATION RULES

### System Overview
This project has THREE SYSTEMS that share some resources but MUST remain isolated:

#### 1. InPlay System (Original)
- **Tables**: `tournament_competitions`, `competition_entries`, `competition_entry_picks`
- **Paths**: `/tournaments/`, `/api/tournaments/`
- **Purpose**: Main fantasy golf game

#### 2. ONE 2 ONE System
- **Tables**: `competition_instances`, shares entries/picks with InPlay
- **Paths**: `/one-2-one/`, `/api/one-2-one/`
- **Purpose**: Head-to-head challenges

#### 3. Clubhouse System (Testing Ground)
- **Tables**: ALL start with `clubhouse_*` prefix
- **Paths**: `/clubhouse/`, `/api/clubhouse/`
- **Purpose**: Test fixes before backporting to main systems

### PRE-CHANGE VERIFICATION CHECKLIST

**BEFORE MODIFYING ANY CODE, COMPLETE THIS CHECKLIST:**

See: `PRE-CHANGE-CHECKLIST.md` in root directory

1. **Identify System** - Which system am I working on?
2. **Find ALL References** - `grep -r "variableName" apps/`
3. **Check Database Schema** - Verify columns exist before using in API
4. **Verify Isolation** - Ensure changes don't leak into other systems
   ```bash
   grep -r "clubhouse" apps/golf/src/app/tournaments/  # Should be empty
   grep -r "tournament_competitions" apps/golf/src/app/clubhouse/  # Should be empty
   ```
5. **Review the Plan** - Check SYSTEMATIC-FIX-PLAN.md or CLUBHOUSE-SYSTEM-PLAN.md
6. **ONE Change at a Time** - Don't combine unrelated changes
7. **Verify After** - Search for orphaned references

### Development Plans Reference

- **SYSTEMATIC-FIX-PLAN.md** - Test fixes in Clubhouse, then backport to main systems
- **CLUBHOUSE-SYSTEM-PLAN.md** - Current step-by-step testing plan
- **scripts/clubhouse/ARCHITECTURE-DIAGRAM.txt** - Visual architecture guide

## Critical Rules

1. **Check PRE-CHANGE-CHECKLIST.md BEFORE every change** - Verify system isolation
2. **Never mix Supabase client types** - Use appropriate client for context (browser/server/admin)
3. **Validate golfer eligibility** - Always check against `golfer_groups` before creating entries
4. **Use tournament slugs** - Routes use slugs, not IDs (e.g., `/tournaments/alfred-dunhill-championship`)
5. **Server-side secrets** - Service role keys and Stripe secrets NEVER in client code
6. **CSS Modules** - Always use co-located CSS modules, never global styles
7. **Port conflicts** - Use `pnpm kill:ports` if dev server won't start
8. **Admin checks** - Middleware uses `admins` table (`user_id` column), not auth metadata
9. **Dynamic exports** - API routes need `export const dynamic = 'force-dynamic'` for real-time data
10. **ONE 2 ONE entries** - Always check `instance_id` vs `competition_id` - they're mutually exclusive
11. **Scoring service** - Server-side only, never import in client components
12. **Registration timing** - Lifecycle Manager is source of truth; competitions auto-derive times, never set manually
13. **Competition status** - Check `tournament_competitions.status`, NOT `tournaments.status` for entry validation
14. **Wallet mutations** - ALWAYS use `wallet_apply()` RPC function, never direct INSERT/UPDATE on `wallets` table
15. **Profile names** - Use `display_name` (auto-computed from first_name + last_name) in all user-facing displays
16. **Refunds** - ONE 2 ONE instances auto-cancel and refund via cron job `/api/one-2-one/cron/cancel-unfilled`
17. **NEVER modify InPlay/ONE 2 ONE when working on Clubhouse** - Systems are isolated for a reason
18. **Grep BEFORE renaming variables** - Find ALL references first to avoid breaking code

## Common Pitfalls & Debugging

### Port Stuck Issues
**Symptoms**: `pnpm dev` fails with "Port already in use"  
**Fix**: `pnpm kill:ports` (kills all node processes)  
**Prevention**: Use `pnpm restart:golf` instead of manually stopping/starting

### Registration Validation Errors
**Symptoms**: "Registration closed" even though tournament hasn't started  
**Root Cause**: Checking wrong status field or wrong timestamp  
**Fix**: Always check `competition.reg_close_at` (not tournament dates), use `competition.status` for validation  
**Example**: See `apps/golf/src/app/build-team/[competitionId]/page.tsx` lines 131-145

### Golfer Group Sync Issues
**Symptoms**: Competition shows 0 available golfers after group assignment  
**Root Cause**: `competition_golfers` table not populated after group change  
**Fix**: Backend auto-syncs in `PUT /api/tournaments/[id]/competitions` - check `assigned_golfer_group_id` is set  
**Verify**: Query `SELECT COUNT(*) FROM competition_golfers WHERE competition_id = ?`

### DataGolf API Timeouts
**Symptoms**: Golfer sync fails with timeout errors  
**Root Cause**: DataGolf API rate limits or slow responses  
**Fix**: Scoring service has built-in retry logic (3 attempts, exponential backoff)  
**Test**: `node scripts/test-datagolf-connection.js`

### Status Value Confusion
**Known Issue**: Frontend sometimes uses inconsistent status names  
**Database Values**: `draft`, `upcoming`, `reg_open`, `reg_closed`, `live`, `completed`, `cancelled`  
**Do NOT use**: `registration_open`, `in-play`, `in_progress`, `active` (legacy frontend values)  
**Reference**: `docs/ARCHITECTURE-BOUNDARIES.md` lines 116-133
