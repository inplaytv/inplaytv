-- Check actual datatype and values of salary_pennies
SELECT 
  full_name,
  salary_pennies,
  pg_typeof(salary_pennies) as datatype
FROM golfers
WHERE id IN (
  SELECT golfer_id FROM golfer_group_members 
  WHERE group_id = 'f2c68394-774a-4b72-ace1-c4676c2e1e86'
)
LIMIT 5;
