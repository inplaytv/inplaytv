# Competition Types Safeguard

## ⚠️ CRITICAL: Two Separate Competition Systems

### **InPlay Competitions** (Traditional Fantasy)
- **Tables**: `competitions`, `competition_entrants`, `competition_entries`
- **Identifier**: `competition_id` field
- **Type Field**: `competition_types.name` (e.g., "Full Course", "Beat The Cut")
- **Players**: Multiple players (6-120 depending on type)
- **Prize Structure**: Prize pool divided among top finishers
- **Entry Flow**: `/tournaments` → Select competition type → `/build-team` → `competition_entrants` created

### **ONE 2 ONE Challenges** (Head-to-Head)
- **Tables**: `competition_instances`, `competition_templates`, `competition_entries`
- **Identifier**: `instance_id` field
- **Type Field**: `is_one_2_one: true` on competition_instances
- **Players**: Exactly 2 players (1v1)
- **Prize Structure**: Winner takes all (minus admin fee)
- **Entry Flow**: `/one-2-one/[slug]` → Create/Accept challenge → `/build-team` → `competition_entries` created

## 🛡️ Safeguards in Code

### **1. API Endpoints Must Check Competition Type**
```typescript
// ❌ WRONG - Queries both types
const { data } = await supabase.from('competition_entries').select('*');

// ✅ CORRECT - Filters by type
const { data: inplayEntries } = await supabase
  .from('competition_entries')
  .select('*, tournament_competitions!inner(*)')
  .eq('tournament_competitions.is_one_2_one', false);

const { data: one2oneEntries } = await supabase
  .from('competition_entries')
  .select('*, tournament_competitions!inner(*)')
  .eq('tournament_competitions.is_one_2_one', true);
```

### **2. Always Use Field Identifiers**
```typescript
// InPlay uses: competition_id
if (entry.competition_id && !entry.instance_id) {
  // This is InPlay
}

// ONE 2 ONE uses: instance_id
if (entry.instance_id && !entry.competition_id) {
  // This is ONE 2 ONE
}
```

### **3. Database Schema Differences**
```sql
-- InPlay competitions table structure
competitions: {
  id,
  tournament_id,
  competition_type_id,
  max_entrants,
  entry_fee_pennies,
  is_one_2_one: false (or NULL)
}

-- ONE 2 ONE instances table structure
competition_instances: {
  id,
  tournament_id,
  template_id,
  max_players: 2,
  current_players,
  status: 'pending' | 'open' | 'full',
  is_one_2_one: true (implied by table)
}
```

## 🚨 Common Mistakes to Avoid

### Mistake 1: Mixing Queries
```typescript
// ❌ This returns BOTH InPlay and ONE 2 ONE
fetch('/api/competitions/${id}/entrants')

// ✅ Be explicit about which type
if (isOne2One) {
  fetch('/api/one-2-one/instance/${instanceId}')
} else {
  fetch('/api/competitions/${competitionId}/entrants')
}
```

### Mistake 2: Wrong Table Joins
```typescript
// ❌ WRONG - competition_entrants is for InPlay only
supabase.from('competition_instances')
  .select('*, competition_entrants(*)')

// ✅ CORRECT - competition_entries is for ONE 2 ONE
supabase.from('competition_instances')
  .select('*, competition_entries(*)')
```

### Mistake 3: Confusing Entry Types
```typescript
// InPlay: competition_entrants (tracks all players in a competition)
// ONE 2 ONE: competition_entries (tracks individual picks)
```

## ✅ Checklist Before Making Changes

- [ ] Am I working with InPlay or ONE 2 ONE?
- [ ] Am I using the correct table? (`competitions` vs `competition_instances`)
- [ ] Am I using the correct identifier? (`competition_id` vs `instance_id`)
- [ ] Do my queries filter by `is_one_2_one` flag?
- [ ] Am I joining to the correct related tables?
- [ ] Have I tested that InPlay still works after changes?
- [ ] Have I tested that ONE 2 ONE still works after changes?

## 🔍 Quick Reference

| Feature | InPlay | ONE 2 ONE |
|---------|--------|-----------|
| Main Table | `competitions` | `competition_instances` |
| Entry Tracking | `competition_entrants` | `competition_entries` |
| ID Field | `competition_id` | `instance_id` |
| Player Count | 6-120 | Exactly 2 |
| Status Field | `status` on tournament_competitions | `status` on competition_instances |
| Challenge Board | No | Yes (shows open challenges) |
| Prize Pool | Divided | Winner takes all |

## 📝 Naming Conventions

- **InPlay URLs**: `/tournaments`, `/competitions`, `/leaderboard`
- **ONE 2 ONE URLs**: `/one-2-one/[slug]`, `/one-2-one/challenge/[id]`
- **InPlay Components**: `CompetitionCard`, `LeaderboardTable`, `EntrantsList`
- **ONE 2 ONE Components**: `ChallengeBoard`, `ChallengeView`, `TeamLineup`
