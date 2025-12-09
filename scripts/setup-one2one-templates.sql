/* ===================================================================
   SETUP ONE 2 ONE TEMPLATES - INITIAL DATA
   ===================================================================
   
   This creates the 5 standard ONE 2 ONE templates:
   1. All 4 Rounds (most popular)
   2. Round 1 Only
   3. Round 2 Only  
   4. Round 3 Only
   5. Round 4 Only
   
   Run this ONCE to create the initial templates.
   After this, use the admin panel to edit them.
   
   =================================================================== */

-- Insert All 4 Rounds template
INSERT INTO competition_templates (
  name,
  short_name,
  description,
  entry_fee_pennies,
  admin_fee_percent,
  max_players,
  rounds_covered,
  reg_close_round,
  status
) VALUES (
  'ONE 2 ONE - All 4 Rounds',
  'All Rounds',
  'Challenge another player across all 4 rounds of the tournament',
  1000,  -- £10.00 default entry fee
  10,    -- 10% admin fee
  2,     -- Always 2 players for ONE 2 ONE
  ARRAY[1, 2, 3, 4],  -- All rounds
  1,     -- Registration closes at start of Round 1
  'active'
) ON CONFLICT DO NOTHING;

-- Insert Round 1 Only template
INSERT INTO competition_templates (
  name,
  short_name,
  description,
  entry_fee_pennies,
  admin_fee_percent,
  max_players,
  rounds_covered,
  reg_close_round,
  status
) VALUES (
  'ONE 2 ONE - Round 1',
  'Round 1',
  'Challenge another player for Round 1 only',
  1000,  -- £10.00 default entry fee
  10,    -- 10% admin fee
  2,
  ARRAY[1],  -- Round 1 only
  1,     -- Registration closes at start of Round 1
  'active'
) ON CONFLICT DO NOTHING;

-- Insert Round 2 Only template
INSERT INTO competition_templates (
  name,
  short_name,
  description,
  entry_fee_pennies,
  admin_fee_percent,
  max_players,
  rounds_covered,
  reg_close_round,
  status
) VALUES (
  'ONE 2 ONE - Round 2',
  'Round 2',
  'Challenge another player for Round 2 only',
  1000,  -- £10.00 default entry fee
  10,    -- 10% admin fee
  2,
  ARRAY[2],  -- Round 2 only
  2,     -- Registration closes at start of Round 2
  'active'
) ON CONFLICT DO NOTHING;

-- Insert Round 3 Only template
INSERT INTO competition_templates (
  name,
  short_name,
  description,
  entry_fee_pennies,
  admin_fee_percent,
  max_players,
  rounds_covered,
  reg_close_round,
  status
) VALUES (
  'ONE 2 ONE - Round 3',
  'Round 3',
  'Challenge another player for Round 3 only',
  1000,  -- £10.00 default entry fee
  10,    -- 10% admin fee
  2,
  ARRAY[3],  -- Round 3 only
  3,     -- Registration closes at start of Round 3
  'active'
) ON CONFLICT DO NOTHING;

-- Insert Round 4 Only template
INSERT INTO competition_templates (
  name,
  short_name,
  description,
  entry_fee_pennies,
  admin_fee_percent,
  max_players,
  rounds_covered,
  reg_close_round,
  status
) VALUES (
  'ONE 2 ONE - Round 4',
  'Round 4',
  'Challenge another player for the final round only',
  1000,  -- £10.00 default entry fee
  10,    -- 10% admin fee
  2,
  ARRAY[4],  -- Round 4 only
  4,     -- Registration closes at start of Round 4
  'active'
) ON CONFLICT DO NOTHING;

/* ===================================================================
   VERIFY TEMPLATES WERE CREATED:
   =================================================================== */

SELECT 
  id,
  name,
  short_name,
  entry_fee_pennies / 100.0 as entry_fee_pounds,
  admin_fee_percent,
  max_players,
  rounds_covered,
  reg_close_round,
  status,
  created_at
FROM competition_templates
ORDER BY 
  CASE WHEN array_length(rounds_covered, 1) = 4 THEN 0 ELSE 1 END,
  rounds_covered[1];

/* ===================================================================
   EXPECTED OUTPUT:
   
   Should show 5 templates:
   1. All Rounds (rounds: {1,2,3,4})
   2. Round 1 (rounds: {1})
   3. Round 2 (rounds: {2})
   4. Round 3 (rounds: {3})
   5. Round 4 (rounds: {4})
   
   Each with:
   - Entry fee: £10.00
   - Admin fee: 10%
   - Max players: 2
   - Status: active
   
   =================================================================== */

/* ===================================================================
   AFTER RUNNING THIS SCRIPT:
   
   1. Go to: http://localhost:3002/one-2-one-templates
   2. You should now see all 5 templates listed
   3. Click "Edit" on any template to change:
      - Entry fee
      - Admin fee percentage
      - Description
      - Status (active/inactive)
   
   4. Changes will take effect immediately for NEW challenges
      (existing open challenges keep their original settings)
   
   =================================================================== */
