# Tournament Golfers - CSV Import System

## Overview
Simple CSV-based system for managing tournament golfers. No external APIs, just upload CSV files.

## Quick Start

### 1. Run the Database Migration
```sql
-- In Supabase Dashboard > SQL Editor
-- Copy and paste: scripts/2025-01-golfer-groups-system.sql
```

### 2. Prepare Your CSV Files
Create two CSV files for each tournament:

**Full Field** (`masters-2025-full.csv`):
```csv
Tiger,Woods
Rory,McIlroy
Scottie,Scheffler
```

**After Cut** (`masters-2025-cut.csv`):
```csv
Scottie,Scheffler
Rory,McIlroy
```

Formats supported:
- `First Name,Last Name` (recommended)
- `Full Name` (will auto-split)

### 3. Import Golfers
1. Go to **Tournament Golfers** in sidebar (under Tournaments)
2. Click **Import CSV**
3. Upload file
4. Name the group: "Masters 2025 - Full Field"
5. Repeat for "After Cut" group

### 4. Assign to Tournament
1. Go to your tournament
2. Assign both groups:
   - Masters 2025 - Full Field
   - Masters 2025 - After Cut

### 5. Select for Competitions
For each competition in the tournament:
- **Rounds 1-3**: Select from "Full Field" group
- **Round 4**: Select from "After Cut" group

## Workflow

```
CSV Files
    ↓
Tournament Golfers Page (Import)
    ↓
Golfer Groups Created
    ↓
Assign Groups to Tournament
    ↓
Select Golfers per Competition
```

## Typical Tournament Setup

1. **Create Tournament** (Masters 2025)
2. **Import Full Field CSV** → Creates "Masters 2025 - Full Field" group (96 golfers)
3. **Import After Cut CSV** → Creates "Masters 2025 - After Cut" group (50 golfers)
4. **Assign Both Groups** to tournament
5. **Create Competitions**:
   - Round 1: Select from Full Field
   - Round 2: Select from Full Field
   - Round 3: Select from Full Field (or After Cut after Friday)
   - Round 4: Select from After Cut only

## CSV Template

Download/create CSV in this format:

```csv
First Name,Last Name
Tiger,Woods
Rory,McIlroy
Jon,Rahm
Scottie,Scheffler
Brooks,Koepka
```

- No header row needed (it will be skipped if detected)
- Comma-separated
- One golfer per line
- Duplicates are automatically handled

## Navigation

1. **Sidebar** → Tournaments → Tournament Golfers
2. **Import CSV** to create groups
3. **View groups** to see all created groups
4. **Go to tournament** to assign groups
5. **Go to competition** to select specific golfers

## Database Structure

- `golfers` - Individual golfers (master list)
- `golfer_groups` - Named collections ("Full Field", "After Cut")
- `golfer_group_members` - Which golfers in which groups
- `tournament_golfer_groups` - Which groups assigned to which tournaments
- `competition_golfers` - Which golfers available in which competitions

## Benefits

✅ No external dependencies
✅ CSV is universal format
✅ Reusable groups across tournaments
✅ Easy to manage full field vs cut
✅ Clean separation of concerns

## Notes

- Group names should be descriptive: "[Tournament] - [Type]"
- Always import both Full Field AND After Cut groups
- CSV files can be exported from any source (Excel, Google Sheets, etc.)
- Golfers are deduplicated automatically
