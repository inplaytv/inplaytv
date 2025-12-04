# ONE 2 ONE Competition System

## Overview

ONE 2 ONE is a head-to-head matchmaking system where users compete in 2-player competitions across different tournament rounds.

## Competition Types

| Type | Rounds Covered | Registration Closes | Description |
|------|---------------|---------------------|-------------|
| **All 4 Rounds** | R1, R2, R3, R4 | After R1 starts | Full tournament competition |
| **Round 1** | R1 only | After R1 starts | Single round competition |
| **Round 2** | R2 only | After R2 starts | Single round competition |
| **Round 3** | R3 only | After R3 starts | Single round competition |
| **Round 4** | R4 only | After R4 starts | Single round competition |

## Architecture: Competition Instances

### Core Concept

Instead of one competition that fills infinitely, we use:
1. **Templates** - Define the type of competition (e.g., "ONE 2 ONE Round 2")
2. **Instances** - Specific fillable slots (e.g., "Instance #47" with 2 players)

### Database Schema

```sql
-- Competition Templates (the "type")
CREATE TABLE competition_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  competition_type_id UUID REFERENCES competition_types(id),
  name TEXT NOT NULL,
  description TEXT,
  rounds_covered TEXT[], -- ['1','2','3','4'] or ['2'] for R2 only
  max_entrants INTEGER DEFAULT 2,
  entry_fee_pennies INTEGER NOT NULL,
  prize_pool_pennies INTEGER,
  reg_close_round INTEGER, -- Close after this round starts (1, 2, 3, or 4)
  auto_spawn BOOLEAN DEFAULT true,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competition Instances (fillable slots)
CREATE TABLE competition_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES competition_templates(id),
  tournament_id UUID REFERENCES tournaments(id),
  instance_number INTEGER NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'full', 'in_progress', 'completed')),
  current_entrants INTEGER DEFAULT 0,
  max_entrants INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  filled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(template_id, instance_number)
);

-- Update entries table
ALTER TABLE entries ADD COLUMN competition_instance_id UUID REFERENCES competition_instances(id);
CREATE INDEX idx_entries_instance ON entries(competition_instance_id);
CREATE INDEX idx_instances_template_status ON competition_instances(template_id, status);
```

## Implementation Guide

### Phase 1: Database Setup

1. **Create new tables:**
```bash
# Run migration in Supabase SQL Editor
# See: scripts/create-one-2-one-system.sql
```

2. **Create templates for tournament:**
```sql
-- Example for Nedbank Golf Challenge
INSERT INTO competition_templates (
  tournament_id,
  competition_type_id,
  name,
  rounds_covered,
  max_entrants,
  entry_fee_pennies,
  reg_close_round,
  auto_spawn
) VALUES
  (
    'tournament-uuid',
    'one-2-one-type-uuid',
    'ONE 2 ONE - All 4 Rounds',
    ARRAY['1','2','3','4'],
    2,
    1000,
    1, -- Close after R1
    true
  ),
  (
    'tournament-uuid',
    'one-2-one-type-uuid',
    'ONE 2 ONE - Round 2',
    ARRAY['2'],
    2,
    1000,
    2, -- Close after R2
    true
  );
  -- ... repeat for R3, R4
```

### Phase 2: API Endpoints

#### `GET /api/tournaments/[slug]/one-2-one-templates`
Returns available templates for a tournament.

```typescript
// Response
{
  templates: [
    {
      id: "uuid",
      name: "ONE 2 ONE - Round 2",
      rounds_covered: ["2"],
      entry_fee_pennies: 1000,
      max_entrants: 2,
      available_instances: 3, // Count of open instances
      is_open: true // Based on current round
    }
  ]
}
```

#### `GET /api/one-2-one/[templateId]/available-instance`
Finds or creates an available instance.

```typescript
// Algorithm
1. Find open instance (status='open', current_entrants < max_entrants)
2. If found → Return instance
3. If not found:
   - Get max instance_number for template
   - Create new instance with number = max + 1
   - Return new instance
```

#### `POST /api/one-2-one/[instanceId]/join`
Join a specific instance.

```typescript
// Validation
1. Check instance is open
2. Check instance not full
3. Check user can afford entry fee
4. Check registration still open (based on rounds_covered)

// On success
1. Create entry linked to instance
2. Increment current_entrants
3. If current_entrants == max_entrants:
   - Set status='full', filled_at=NOW()
   - If template.auto_spawn → Trigger new instance creation
```

### Phase 3: Frontend Flow

#### User Journey

1. **Browse Templates**
```tsx
// Display available ONE 2 ONE types
<CompetitionCard title="ONE 2 ONE - Round 2">
  <span>3 open matches</span>
  <span>Entry: £10.00</span>
  <button>Join Match</button>
</CompetitionCard>
```

2. **Join Match**
```typescript
// When user clicks "Join Match"
const instance = await fetch(`/api/one-2-one/${templateId}/available-instance`);
// Redirect to team builder for this instance
router.push(`/build-team/${instance.id}`);
```

3. **Build Team & Submit**
```typescript
// Team builder works same as existing
// Entry links to instance_id instead of competition_id
```

4. **Waiting Room (if first player)**
```tsx
// Show waiting status
<WaitingRoom instance={instance}>
  <p>Waiting for opponent...</p>
  <p>Match #{instance.instance_number}</p>
</WaitingRoom>
```

5. **Match Starts (when full)**
```tsx
// Both players can now see each other
<MatchView>
  <Player entry={myEntry} />
  <vs />
  <Player entry={opponentEntry} />
  <Leaderboard />
</MatchView>
```

### Phase 4: Auto-Close Logic

```typescript
// Cron job or trigger function
async function updateInstanceRegistration(tournamentId: string, currentRound: number) {
  // Get all templates for this tournament
  const templates = await getTemplates(tournamentId);
  
  for (const template of templates) {
    // Close instances where reg_close_round has started
    if (currentRound >= template.reg_close_round) {
      await closeTemplateRegistration(template.id);
    }
  }
}
```

## User Experience Examples

### Scenario 1: Early Registration (Before R1)

```
User browses: "ONE 2 ONE - All 4 Rounds"
├─ Instance #1 [1/2 players] ← User joins here
├─ Instance #2 [0/2 players]
└─ Instance #3 [0/2 players]

After user joins:
├─ Instance #1 [2/2 players] ✓ FULL
├─ Instance #2 [0/2 players]
├─ Instance #3 [0/2 players]
└─ Instance #4 [0/2 players] ← Auto-created
```

### Scenario 2: Mid-Tournament (During R2)

```
Available Templates:
✓ ONE 2 ONE - Round 2 (reg still open)
✓ ONE 2 ONE - Round 3 (reg still open)
✓ ONE 2 ONE - Round 4 (reg still open)
✗ ONE 2 ONE - All 4 Rounds (CLOSED - R1 started)
✗ ONE 2 ONE - Round 1 (CLOSED - R1 started)
```

### Scenario 3: Popular Competition

```
ONE 2 ONE - Round 3
├─ Instance #1 [2/2] FULL - In Progress
├─ Instance #2 [2/2] FULL - In Progress
├─ Instance #3 [2/2] FULL - In Progress
├─ Instance #47 [1/2] ← Next available
└─ Instance #48 [0/2]
```

## Migration Path

### Step 1: Add New System (Don't Break Old)
1. Create new tables
2. Keep existing competition system working
3. Add "ONE 2 ONE" templates

### Step 2: Dual System Period
1. Old competitions still work
2. New instance system available
3. Test thoroughly

### Step 3: Full Migration
1. Migrate existing ONE 2 ONE entries to instances
2. Update all frontend references
3. Remove old competition checks

## Admin Panel Updates

### New Admin Pages

1. **Template Management**
```
/admin/tournaments/[id]/one-2-one-templates
- Create/edit templates
- Enable/disable templates
- Set entry fees, prize pools
- Define rounds covered
```

2. **Instance Monitoring**
```
/admin/one-2-one/instances
- View all instances
- See fill rates
- Monitor active matches
- Manual instance creation/closure
```

## API Reference

### Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/tournaments/[slug]/one-2-one-templates` | List available templates |
| GET | `/api/one-2-one/[templateId]/available-instance` | Find/create open instance |
| POST | `/api/one-2-one/[instanceId]/join` | Join specific instance |
| GET | `/api/one-2-one/instances/[instanceId]` | Get instance details |
| GET | `/api/one-2-one/my-matches` | User's active matches |
| PATCH | `/api/one-2-one/instances/[instanceId]/close` | Manually close instance |

## Benefits of This System

✅ **Scalable** - Unlimited instances auto-created
✅ **Flexible** - Easy to add new template types
✅ **Fair** - Automatic matchmaking
✅ **Clear** - Users see exactly which match they're in
✅ **Trackable** - Each instance has unique identifier
✅ **Maintainable** - Templates vs instances separation
✅ **Future-proof** - Can add features like ELO matching, skill-based matching

## Next Steps

1. **Review this document** - Ensure it meets requirements
2. **Create migration script** - Database setup
3. **Build API endpoints** - Backend logic
4. **Update frontend** - New user flows
5. **Test thoroughly** - Multiple scenarios
6. **Deploy incrementally** - Don't break existing

---

**Questions to Answer:**
1. Should users see opponent before match starts?
2. Prize distribution for 1v1 (winner-takes-all or split)?
3. What happens if only 1 player joins (refund? cancel?)?
4. Time limit for matches to fill?
5. Leaderboard per instance or global?
