# Clubhouse System - Setup Checklist

## ✅ Completed Steps

### 1. Project Structure
- [x] Created monorepo structure
- [x] Set up `packages/clubhouse-shared` package
- [x] Set up `apps/clubhouse-admin` (port 3004)
- [x] Set up `apps/clubhouse` (port 3005)

### 2. Shared Package (`@inplaytv/clubhouse-shared`)
- [x] Created `constants.ts` - Status values & display mappings
- [x] Created `types.ts` - TypeScript interfaces for all entities
- [x] Created `validation.ts` - Business rule validators
- [x] Created `utils.ts` - Display formatting utilities
- [x] Set up package exports

### 3. Database Schema
- [x] Created `scripts/clubhouse-schema.sql` with:
  - [x] 5 tables (events, competitions, wallets, transactions, entries)
  - [x] Auto status update trigger
  - [x] Auto timing sync trigger
  - [x] Atomic credit grant RPC function
  - [x] Atomic entry creation RPC function
  - [x] Database constraints for all business rules

### 4. Next.js Apps Configuration
- [x] Created package.json for both apps
- [x] Created tsconfig.json for both apps
- [x] Created next.config.js for both apps
- [x] Created tailwind.config.js for both apps
- [x] Created postcss.config.js for both apps
- [x] Set up Supabase client utilities

### 5. Basic UI Structure
- [x] Created home pages for both apps
- [x] Created layouts with navigation
- [x] Added Tailwind CSS styling
- [x] Created environment file templates

### 6. Dependencies
- [x] Installed all npm packages
- [x] Configured workspace dependencies

### 7. Documentation
- [x] Created CLUBHOUSE-QUICK-START.md guide
- [x] Created startup script (start-clubhouse.ps1)
- [x] Created this checklist

## 📋 Next Steps (To Do)

### 1. Environment Setup
- [ ] Copy `.env.example` files to `.env.local`
- [ ] Add Supabase credentials to both `.env.local` files
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (admin only)

### 2. Database Setup
- [ ] Run `.\scripts\setup-clubhouse-db.ps1` to create tables and functions
- [ ] Verify tables created in Supabase dashboard
- [ ] Test database triggers manually

### 3. Admin App Development
- [ ] Create `/events/new` page - Event creation form
- [ ] Create `/events` page - Event list
- [ ] Create `/events/[id]` page - Event details
- [ ] Create `/credits` page - Credit grant interface
- [ ] Create API route: `POST /api/events` - Create event
- [ ] Create API route: `POST /api/credits` - Grant credits

### 4. User App Development
- [ ] Create `/events` page - Browse events
- [ ] Create `/events/[id]` page - Event details with competitions
- [ ] Create `/events/[id]/competitions/[compId]/enter` - Entry form
- [ ] Create `/wallet` page - Wallet balance & transactions
- [ ] Create API route: `GET /api/events` - List events
- [ ] Create API route: `POST /api/entries` - Create entry
- [ ] Create API route: `GET /api/wallet` - Get wallet balance

### 5. Testing Phase 1 - Basic Functionality
- [ ] Start both development servers
- [ ] Create first test event
- [ ] Verify status is automatically set
- [ ] Grant credits to test user
- [ ] Verify wallet balance updates

### 6. Testing Phase 2 - Status Automation
- [ ] Create event with future registration date
- [ ] Change dates to trigger status changes
- [ ] Verify competitions auto-sync timing
- [ ] Test all 4 status transitions (upcoming → open → active → completed)

### 7. Testing Phase 3 - Entry System
- [ ] Enter competition with valid team
- [ ] Verify atomic credit deduction
- [ ] Test insufficient credits scenario
- [ ] Test duplicate entry rejection
- [ ] Test invalid team scenarios (5 golfers, captain not in team)

### 8. Testing Phase 4 - Edge Cases
- [ ] Test concurrent entries (race conditions)
- [ ] Test event cancellation & refunds
- [ ] Test competition filled scenario
- [ ] Test registration closed scenario

### 9. Documentation & Analysis
- [ ] Document test results for each scenario
- [ ] Identify patterns that work perfectly
- [ ] Note any issues or improvements needed
- [ ] Create backport plan with step-by-step instructions

### 10. Backport Preparation
- [ ] Run 2-3 real events end-to-end
- [ ] Confirm zero manual interventions needed
- [ ] Document proven patterns
- [ ] Create migration guide for main InPlay system

## 🎯 Success Criteria

Before backporting to main system, verify:

- [ ] **Status automation works**: Event status updates automatically based on dates
- [x] **Competition sync works**: Competition timing calculated correctly in API (trigger-based sync removed - see CLUBHOUSE-TIMING-TRIGGER-ANALYSIS.md)
- [ ] **Atomic operations work**: Credits deduct atomically with entry creation
- [ ] **Constraints work**: Invalid data rejected by database
- [ ] **No manual scripts needed**: Zero interventions for 3 consecutive events
- [ ] **Clear error messages**: All failure cases have user-friendly messages
- [ ] **Race conditions prevented**: Concurrent operations handled correctly

## 🚀 Quick Commands

```powershell
# Install dependencies
pnpm install

# Run database setup
.\scripts\setup-clubhouse-db.ps1

# Start both apps
.\start-clubhouse.ps1

# Or start individually:
cd apps/clubhouse-admin
pnpm dev  # Admin on port 3004

cd apps/clubhouse
pnpm dev  # User on port 3005
```

## 📊 Current Status

**Phase**: Infrastructure Complete ✅
**Next**: Environment setup & database initialization
**Blocking**: Need Supabase credentials in .env.local files

## 🔗 Related Documents

- [CLUBHOUSE-SYSTEM-PLAN.md](./CLUBHOUSE-SYSTEM-PLAN.md) - Complete architecture plan
- [SYSTEMATIC-FIX-PLAN.md](./SYSTEMATIC-FIX-PLAN.md) - 7 problems with test/backport strategy
- [CLUBHOUSE-QUICK-START.md](./CLUBHOUSE-QUICK-START.md) - Setup & testing guide

## 📝 Notes

### Key Architectural Decisions
1. **Status automation via triggers** - No HTTP calls that can fail
2. **Atomic operations via RPC** - Entry + payment is one transaction
3. **Database constraints** - Invalid data impossible
4. **Simple status values** - Only 4 values, no confusion
5. **Whole number credits** - No penny conversion complexity

### Why This Approach Works
- **Single source of truth**: Constants package prevents divergence
- **Database-driven**: Automation happens at data layer, not API layer
- **Fail-safe**: Constraints prevent invalid state
- **Observable**: Transaction log provides full audit trail
- **Testable**: Can verify each piece independently

### Backport Strategy
Test here first → Document what works → Incrementally backport → Keep rollback ready

This ensures we don't break production while fixing fundamental issues.
