-- ===================================================================
-- CHECK FOR ORPHANED DRAFT ENTRIES
-- Find entries that weren't properly completed
-- ===================================================================

-- Check all competition entries for the user
SELECT 
  ce.id,
  ce.user_id,
  ce.competition_id,
  ce.entry_name,
  ce.status,
  ce.total_salary,
  ce.entry_fee_paid,
  ce.created_at,
  ce.submitted_at,
  tc.entry_fee_pennies as competition_fee
FROM competition_entries ce
JOIN tournament_competitions tc ON tc.id = ce.competition_id
ORDER BY ce.created_at DESC;

-- Count entries by status
SELECT 
  status,
  COUNT(*) as count,
  SUM(entry_fee_paid) as total_fees_paid
FROM competition_entries
GROUP BY status;

-- Find entries with no fee paid but marked as submitted
SELECT 
  ce.id,
  ce.user_id,
  ce.status,
  ce.entry_fee_paid,
  tc.entry_fee_pennies as should_be
FROM competition_entries ce
JOIN tournament_competitions tc ON tc.id = ce.competition_id
WHERE ce.status = 'submitted' AND ce.entry_fee_paid = 0;
