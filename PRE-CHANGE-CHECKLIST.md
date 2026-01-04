# Pre-Change Verification Checklist

**STOP! Before modifying ANY code, complete this checklist:**

## 1. Identify System
- [ ] What system am I working on? (InPlay / ONE 2 ONE / Clubhouse)
- [ ] Does the file path match? (`/tournaments/` vs `/one-2-one/` vs `/clubhouse/`)
- [ ] Are the tables correct? (Use `packages/shared/src/system-types.ts`)

## 2. Find ALL References
```bash
# Search for the exact thing you're changing
grep -r "exactVariableName" apps/
grep -r "table_name" apps/

# Example: Before renaming a variable
grep -r "registrationOpens" apps/admin/src/app/clubhouse/
```

## 3. Check Database Schema Match
```bash
# Before changing API code, verify schema has the columns
grep "column_name" scripts/clubhouse/01-create-schema.sql
# Or check the actual Supabase schema
```

## 4. Verify Isolation
```bash
# Ensure clubhouse changes don't affect other systems
grep -r "clubhouse" apps/golf/src/app/tournaments/
grep -r "clubhouse" apps/golf/src/app/one-2-one/

# Ensure InPlay changes don't affect clubhouse
grep -r "tournament_competitions" apps/golf/src/app/clubhouse/
```

## 5. Review the Plan
- [ ] Read the relevant section in SYSTEMATIC-FIX-PLAN.md or CLUBHOUSE-SYSTEM-PLAN.md
- [ ] Am I on the correct step?
- [ ] Does this change align with the plan?

## 6. Make ONE Change at a Time
- [ ] Change only what's needed for THIS specific issue
- [ ] Test the change immediately
- [ ] Don't combine multiple unrelated changes

## 7. After Making Changes
- [ ] Search for the old value to ensure no orphaned references
- [ ] Check if dev server still runs
- [ ] Verify no console errors

---

## System Boundaries Reference

### InPlay System
- **Tables**: `tournament_competitions`, `competition_entries`, `competition_entry_picks`
- **Paths**: `/tournaments/`, `/api/tournaments/`
- **Discriminator**: `competition_type_id IS NOT NULL`

### ONE 2 ONE System  
- **Tables**: `competition_instances`, `competition_entries` (shared), `competition_entry_picks` (shared)
- **Paths**: `/one-2-one/`, `/api/one-2-one/`
- **Discriminator**: `instance_id IS NOT NULL` in entries

### Clubhouse System
- **Tables**: ALL start with `clubhouse_*`
- **Paths**: `/clubhouse/`, `/api/clubhouse/`
- **Discriminator**: Table prefix = guaranteed isolation

---

**If unsure, STOP and ask the user first.**
