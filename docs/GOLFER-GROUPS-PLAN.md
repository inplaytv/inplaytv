# 🎯 Golfer Groups System - Architecture Plan

## Problem Statement
Adding individual golfers one-by-one to tournaments is messy and impractical when dealing with 100+ golfers. Additionally, different competitions within the same tournament need different golfer sets (e.g., Round 4 only has golfers who made the cut).

## Solution: Group-Based Architecture

### 3-Tier Hierarchy
```
Golfers (Individual Database)
    ↓
Golfer Groups (Named Collections)
    ↓
Tournament Assignment (Bulk Add)
    ↓
Competition-Specific Filtering
```

## Database Schema

### 1. `golfers` (Master Database)
Individual golfer records
- `id` - UUID
- `first_name`, `last_name`, `full_name` (generated)
- `image_url` - Optional photo
- `external_id` - For API integration (PGA Tour ID)

**Example Records**:
- Tiger Woods
- Rory McIlroy
- Scottie Scheffler

### 2. `golfer_groups` (Named Collections)
Reusable sets of golfers
- `id` - UUID
- `name` - Display name
- `slug` - URL-friendly identifier
- `description` - What this group represents
- `color` - Hex color for UI badges

**Example Records**:
- "Masters 2025 - Full Field" (96 golfers)
- "Masters 2025 - After Cut" (50 golfers)
- "PGA Championship 2025" (156 golfers)
- "Top 10 World Ranking" (10 golfers)

### 3. `golfer_group_members` (Junction)
Links golfers to groups
- `group_id` → golfer_groups
- `golfer_id` → golfers

**Example**:
- Group: "Masters 2025 Full" → 96 golfers
- Group: "Masters 2025 After Cut" → 50 golfers (subset of full)

### 4. `tournament_golfer_groups` (Junction)
Links groups to tournaments
- `tournament_id` → tournaments
- `group_id` → golfer_groups

**Example**:
- Tournament: "The Masters 2025"
  - Group: "Masters 2025 Full Field"
  - Group: "Masters 2025 After Cut"

### 5. `competition_golfers` (Junction)
Links specific golfers to specific competitions
- `competition_id` → tournament_competitions
- `golfer_id` → golfers

**Example**:
- Competition: "Round 1" → 96 golfers (from "Full Field" group)
- Competition: "Round 4" → 50 golfers (from "After Cut" group)

## User Workflows

### Workflow 1: Create a Golfer Group
**Use Case**: Prepare for a new tournament
**Steps**:
1. Go to **Tournaments → Golfers** sub-tab
2. Click "Groups" tab
3. Click "Create Group"
4. Enter:
   - Name: "Masters 2025 - Full Field"
   - Description: "All 96 golfers in The Masters 2025"
   - Color: Green (#006747)
5. Add golfers:
   - Option A: Select from master list (checkboxes)
   - Option B: CSV import
   - Option C: API sync (future)
6. Save group

**Result**: Reusable group with 96 golfers

### Workflow 2: Assign Groups to Tournament
**Use Case**: Set up tournament golfers
**Steps**:
1. Go to **Tournaments → Edit Tournament → Golfers** tab
2. Click "Add Group"
3. Select from dropdown:
   - "Masters 2025 - Full Field" (96 golfers)
   - "Masters 2025 - After Cut" (50 golfers)
4. Groups are assigned to tournament

**Result**: Tournament now has 2 groups available

### Workflow 3: Assign Golfers to Competition
**Use Case**: Configure which golfers are available in each competition
**Steps**:
1. Go to **Tournaments → Edit Tournament → Competitions** section
2. Click "Manage Golfers" on a competition (e.g., "Round 1")
3. Select source group: "Masters 2025 - Full Field"
4. Click "Add All from Group" → 96 golfers added
5. For "Round 4" competition:
   - Select source group: "Masters 2025 - After Cut"
   - Click "Add All from Group" → 50 golfers added

**Result**: 
- Round 1 has 96 golfers available
- Round 4 has 50 golfers available
- Users can only pick from available golfers in each competition

## UI Structure

### Main Navigation
```
Tournaments (existing)
├─ List Tournaments
├─ Create Tournament
├─ Edit Tournament
│  ├─ Details (existing)
│  ├─ Competitions (existing)
│  ├─ Golfers (NEW)
│  │  ├─ Groups Tab (NEW)
│  │  │  ├─ Assigned Groups (list)
│  │  │  └─ Add Group (dropdown)
│  │  └─ All Golfers Tab (summary of all from groups)
│  └─ Prize Pool (existing)
└─ Golfers (NEW - reorganized)
   ├─ Master List (all individual golfers)
   └─ Groups
      ├─ List Groups
      ├─ Create Group
      └─ Edit Group
         ├─ Group Details
         └─ Manage Members (add/remove golfers)
```

### Page: /tournaments/[id] (Edit Tournament)

#### Tab: Golfers → Groups
**Purpose**: Assign golfer groups to this tournament

**UI Elements**:
- Header: "Golfer Groups"
- Description: "Add groups of golfers to make them available for competitions"
- Button: "+ Add Group"
- List of assigned groups:
  ```
  ┌─────────────────────────────────────────────┐
  │ 🟢 Masters 2025 - Full Field     [Remove]   │
  │ 96 golfers • Added 2 days ago               │
  ├─────────────────────────────────────────────┤
  │ 🟡 Masters 2025 - After Cut      [Remove]   │
  │ 50 golfers • Added 2 days ago               │
  └─────────────────────────────────────────────┘
  ```

#### Tab: Competitions (Enhanced)
**New Feature**: "Manage Golfers" button on each competition

**Competition Card**:
```
┌─────────────────────────────────────────────┐
│ Round 1 - Full Course                       │
│ Entry: £10 | Cap: 200 | Admin: 10%          │
│                                              │
│ [Edit] [Manage Golfers] [Remove]            │
└─────────────────────────────────────────────┘
```

**"Manage Golfers" Modal**:
```
┌─────────────────────────────────────────────┐
│ Manage Golfers: Round 1 - Full Course       │
├─────────────────────────────────────────────┤
│ Add from Group:                              │
│ [Dropdown: Select Group ▼]                  │
│ [ Add All from Group ]                       │
├─────────────────────────────────────────────┤
│ Currently Assigned (96):                     │
│ Tiger Woods              [Remove]            │
│ Rory McIlroy             [Remove]            │
│ Scottie Scheffler        [Remove]            │
│ ... (93 more)                                │
│                                              │
│ [Show All (96)] [Remove All]                 │
└─────────────────────────────────────────────┘
```

### Page: /golfers/groups (New)

**Purpose**: Manage reusable golfer groups

**UI Elements**:
```
┌─────────────────────────────────────────────┐
│ Golfer Groups            [+ Create Group]   │
├─────────────────────────────────────────────┤
│ 🟢 Masters 2025 - Full Field        [Edit]  │
│ 96 golfers • Used in 1 tournament           │
├─────────────────────────────────────────────┤
│ 🟡 Masters 2025 - After Cut         [Edit]  │
│ 50 golfers • Used in 1 tournament           │
├─────────────────────────────────────────────┤
│ 🔵 PGA Championship 2025            [Edit]  │
│ 156 golfers • Not used yet                  │
└─────────────────────────────────────────────┘
```

### Page: /golfers/groups/[id]/edit (New)

**Purpose**: Edit group details and manage members

**UI Elements**:
```
┌─────────────────────────────────────────────┐
│ Edit Group: Masters 2025 - Full Field       │
├─────────────────────────────────────────────┤
│ Name: [Masters 2025 - Full Field]           │
│ Description: [All 96 golfers in...]         │
│ Color: [#006747] 🟢                         │
│                                              │
│ [ Update Group ]                             │
├─────────────────────────────────────────────┤
│ Group Members (96)         [+ Add Golfers]  │
│                                              │
│ Search: [____________]                       │
│                                              │
│ ☑ Tiger Woods                   [Remove]    │
│ ☑ Rory McIlroy                  [Remove]    │
│ ☑ Scottie Scheffler             [Remove]    │
│ ... (93 more)                                │
│                                              │
│ [ Bulk Actions ▼ ]                          │
│   - Add from CSV                             │
│   - Remove All                               │
│   - Clone Group                              │
└─────────────────────────────────────────────┘
```

## API Routes

### Golfer Groups
- `GET /api/golfer-groups` - List all groups
- `POST /api/golfer-groups` - Create group
- `GET /api/golfer-groups/[id]` - Get group details
- `PUT /api/golfer-groups/[id]` - Update group
- `DELETE /api/golfer-groups/[id]` - Delete group

### Group Members
- `GET /api/golfer-groups/[id]/members` - List golfers in group
- `POST /api/golfer-groups/[id]/members` - Add golfer to group
- `DELETE /api/golfer-groups/[id]/members` - Remove golfer from group
- `POST /api/golfer-groups/[id]/members/bulk` - Bulk add golfers

### Tournament Groups
- `GET /api/tournaments/[id]/golfer-groups` - List groups assigned to tournament
- `POST /api/tournaments/[id]/golfer-groups` - Assign group to tournament
- `DELETE /api/tournaments/[id]/golfer-groups` - Remove group from tournament

### Competition Golfers
- `GET /api/competitions/[id]/golfers` - List golfers in competition
- `POST /api/competitions/[id]/golfers` - Add golfer to competition
- `POST /api/competitions/[id]/golfers/from-group` - Add all golfers from group
- `DELETE /api/competitions/[id]/golfers` - Remove golfer from competition
- `DELETE /api/competitions/[id]/golfers/all` - Remove all golfers

## Example Use Case: The Masters 2025

### Setup Phase (Before Tournament)
1. **Create Groups**:
   - "Masters 2025 - Full Field" → Add 96 golfers
   - "Masters 2025 - After Cut" → Add 50 golfers (subset of full)

2. **Create Tournament**: "The Masters 2025"

3. **Assign Groups to Tournament**:
   - Add "Masters 2025 - Full Field" group
   - Add "Masters 2025 - After Cut" group

4. **Create Competitions**:
   - Round 1 - Full Course
   - Round 2 - Full Course
   - Round 3 - Full Course
   - Round 4 - Full Course

5. **Assign Golfers to Competitions**:
   - Round 1: Add all from "Full Field" → 96 golfers
   - Round 2: Add all from "Full Field" → 96 golfers
   - Round 3: Add all from "After Cut" → 50 golfers (manually updated after R2)
   - Round 4: Add all from "After Cut" → 50 golfers

### During Tournament (After Round 2 Cut)
1. Update "Masters 2025 - After Cut" group
2. Remove golfers who missed cut (46 removed, 50 remain)
3. Round 3 and Round 4 automatically reflect the updated group

## Benefits

✅ **Efficiency**: Add 100+ golfers in one click
✅ **Reusability**: Same group used across multiple tournaments
✅ **Flexibility**: Different competitions can have different golfer sets
✅ **Maintainability**: Update group once, affects all linked competitions
✅ **Organization**: Named groups make management clearer
✅ **Scalability**: Handle hundreds of golfers easily

## Implementation Priority

### Phase 1: Core Functionality (NOW)
- ✅ Database schema (done)
- [ ] API routes for golfer groups
- [ ] API routes for group members
- [ ] API routes for tournament groups
- [ ] API routes for competition golfers
- [ ] UI: Golfer Groups list page
- [ ] UI: Create/Edit Group page
- [ ] UI: Tournament → Golfers tab
- [ ] UI: Competition → Manage Golfers

### Phase 2: Enhancements (LATER)
- [ ] CSV import for groups
- [ ] Bulk operations (add 50 golfers at once)
- [ ] Group cloning
- [ ] API integration for external data
- [ ] Search and filters
- [ ] Group usage analytics (which tournaments use this group)

### Phase 3: Advanced (FUTURE)
- [ ] Auto-sync groups from external APIs
- [ ] Smart suggestions (AI-powered group creation)
- [ ] Historical tracking (who was added/removed when)
- [ ] Group templates (pre-made for common scenarios)

---

**Status**: 📋 Planning Complete
**Next**: Implement API routes
