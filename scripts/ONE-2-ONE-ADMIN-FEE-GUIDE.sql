/* ===================================================================
   ONE 2 ONE ADMIN FEE - SOURCE AND MANAGEMENT GUIDE
   =================================================================== */

/**
 * WHERE THE ADMIN FEE COMES FROM:
 * 
 * 1. DATABASE SOURCE:
 *    - Table: `competition_templates`
 *    - Column: `admin_fee_percent` (stored as a number, e.g., 10 for 10%)
 * 
 * 2. DATA FLOW:
 *    Frontend (Golf App)
 *    ↓
 *    GET /api/tournaments/[slug]/one-2-one
 *    → File: apps/golf/src/app/api/tournaments/[slug]/one-2-one/route.ts
 *    → Line 37: .select('*') fetches all columns including admin_fee_percent
 *    ↓
 *    Frontend Page: apps/golf/src/app/one-2-one/[slug]/page.tsx
 *    → Line 16: admin_fee_percent: number; (interface)
 *    → Line 294-298: Prize pool calculation uses selectedTemplate.admin_fee_percent
 *    
 * 3. CALCULATION FORMULA (both locations):
 *    const pool = Math.round((fee * 2 * (100 - admin_fee_percent)) / 100);
 *    
 *    Example with 10% admin fee and £10 entry:
 *    - Entry fee: £10 (1000 pennies)
 *    - Total pot: £20 (2000 pennies)
 *    - Admin cut: £2 (200 pennies) = 2000 * 10 / 100
 *    - Prize pool: £18 (1800 pennies) = 2000 * 90 / 100
 */

/* ===================================================================
   HOW TO CHECK CURRENT ADMIN FEES:
   =================================================================== */

-- Check all ONE 2 ONE template admin fees
SELECT 
  name,
  short_name,
  entry_fee_pennies / 100.0 as entry_fee_pounds,
  admin_fee_percent,
  rounds_covered,
  status,
  created_at,
  updated_at
FROM competition_templates
WHERE status = 'active'
ORDER BY 
  CASE WHEN array_length(rounds_covered, 1) = 4 THEN 0 ELSE 1 END,
  rounds_covered[1];

/* ===================================================================
   HOW TO CHANGE ADMIN FEES:
   =================================================================== */

/**
 * METHOD 1: ADMIN PANEL (RECOMMENDED) ⭐
 * 
 * Steps:
 * 1. Go to: http://localhost:3002/one-2-one-templates
 * 2. Log in with admin credentials
 * 3. Find the template you want to edit
 * 4. Click "Edit" button
 * 5. Change "Admin Fee %" field (e.g., 10.00 for 10%)
 * 6. Click "Update Template"
 * 
 * Code Location:
 * - Frontend: apps/admin/src/app/one-2-one-templates/page.tsx (line 115)
 * - API: apps/admin/src/app/api/one-2-one-templates/route.ts (PUT method, line 125-201)
 * 
 * The admin panel:
 * - Shows current values from database
 * - Validates input
 * - Updates competition_templates table
 * - Changes take effect immediately
 */

/**
 * METHOD 2: SQL UPDATE (DIRECT DATABASE)
 * 
 * Use this if you need to:
 * - Update multiple templates at once
 * - Set admin fee programmatically
 * - Bulk changes
 */

-- Example: Set 10% admin fee for ALL ONE 2 ONE templates
UPDATE competition_templates
SET 
  admin_fee_percent = 10,
  updated_at = NOW()
WHERE status = 'active'
  AND rounds_covered IS NOT NULL;

-- Example: Set different fees by round type
UPDATE competition_templates
SET 
  admin_fee_percent = 10,  -- 10% for all rounds
  updated_at = NOW()
WHERE array_length(rounds_covered, 1) = 4;  -- All 4 Rounds

UPDATE competition_templates
SET 
  admin_fee_percent = 15,  -- 15% for single rounds
  updated_at = NOW()
WHERE array_length(rounds_covered, 1) = 1;  -- Individual rounds

-- Example: Set specific admin fee for one template
UPDATE competition_templates
SET 
  admin_fee_percent = 10,
  updated_at = NOW()
WHERE id = 'YOUR-TEMPLATE-ID-HERE';

/* ===================================================================
   VERIFY CHANGES:
   =================================================================== */

-- After making changes, verify the calculations
SELECT 
  name,
  entry_fee_pennies / 100.0 as entry_fee_pounds,
  admin_fee_percent,
  -- Total pot (2 players)
  (entry_fee_pennies * 2) / 100.0 as total_pot_pounds,
  -- Admin cut
  (entry_fee_pennies * 2 * admin_fee_percent / 100) / 100.0 as admin_cut_pounds,
  -- Winner prize (what they take home)
  (entry_fee_pennies * 2 * (100 - admin_fee_percent) / 100) / 100.0 as winner_prize_pounds,
  rounds_covered
FROM competition_templates
WHERE status = 'active'
ORDER BY rounds_covered[1];

/* ===================================================================
   IMPORTANT NOTES:
   =================================================================== */

/**
 * 1. NO HARDCODED VALUES:
 *    - Admin fee is NOT hardcoded in the code
 *    - It always comes from the database (competition_templates.admin_fee_percent)
 *    - Changes to database take effect immediately (no code deploy needed)
 * 
 * 2. DEFAULT VALUE:
 *    - When creating NEW templates via API: defaults to 10% (line 103 in route.ts)
 *    - When creating via admin panel: form defaults to "10.00" (line 27 in page.tsx)
 * 
 * 3. EXISTING INSTANCES:
 *    - competition_instances table has its own admin_fee_percent column
 *    - This is copied from the template when instance is created
 *    - Changing the template won't affect existing instances
 *    - Only NEW instances will use the updated admin fee
 * 
 * 4. HISTORICAL DATA:
 *    - If you need to check what admin fee was used for a specific match:
 *      SELECT admin_fee_percent FROM competition_instances WHERE id = 'instance-id';
 */

/* ===================================================================
   TROUBLESHOOTING:
   =================================================================== */

-- If calculations seem wrong, check:

-- 1. What's stored in templates?
SELECT id, name, admin_fee_percent FROM competition_templates;

-- 2. What's being used in active instances?
SELECT 
  ci.id,
  ct.name as template_name,
  ci.admin_fee_percent as instance_fee,
  ct.admin_fee_percent as template_fee,
  ci.entry_fee_pennies / 100.0 as entry_pounds
FROM competition_instances ci
JOIN competition_templates ct ON ci.template_id = ct.id
WHERE ci.status IN ('open', 'active')
ORDER BY ci.created_at DESC;

-- 3. If you see 20% or other unexpected values, find them:
SELECT * FROM competition_templates WHERE admin_fee_percent != 10;
SELECT * FROM competition_instances WHERE admin_fee_percent != 10 AND status = 'open';
