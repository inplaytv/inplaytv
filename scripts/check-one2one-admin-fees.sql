/* ===================================================================
   CHECK ONE 2 ONE ADMIN FEES & PRIZE POOL CALCULATIONS
   =================================================================== */

-- Show current admin fees for all ONE 2 ONE templates
SELECT 
  name,
  short_name,
  entry_fee_pennies / 100.0 as entry_fee_pounds,
  admin_fee_percent,
  -- Calculate prize pool (what winner gets)
  (entry_fee_pennies * 2 * (100 - admin_fee_percent)) / 10000.0 as winner_prize_pounds,
  -- Calculate admin cut
  (entry_fee_pennies * 2 * admin_fee_percent) / 10000.0 as admin_cut_pounds,
  CASE 
    WHEN array_length(rounds_covered, 1) = 4 THEN 'All 4 Rounds'
    WHEN rounds_covered[1] = 1 THEN 'Round 1 Only'
    WHEN rounds_covered[1] = 2 THEN 'Round 2 Only'
    WHEN rounds_covered[1] = 3 THEN 'Round 3 Only'
    WHEN rounds_covered[1] = 4 THEN 'Round 4 Only'
  END as challenge_type,
  status
FROM competition_templates
WHERE status = 'active'
  AND rounds_covered IS NOT NULL  -- ONE 2 ONE templates
ORDER BY 
  array_length(rounds_covered, 1) DESC,
  rounds_covered[1];

/* ===================================================================
   HOW TO CHANGE ADMIN FEE:
   
   Option 1: Admin Panel (RECOMMENDED)
   Go to: http://localhost:3002/one-2-one-templates
   - Click Edit on any ONE 2 ONE template
   - Change Admin Fee percent field
   - Click Update Template
   
   Option 2: SQL Script
   Run: scripts/update-one2one-admin-fee.sql
   - Open the file
   - Change line 15: admin_fee_percent = 10  (change 10 to your desired percent)
   - Run the script in Supabase Dashboard
   
   =================================================================== */
