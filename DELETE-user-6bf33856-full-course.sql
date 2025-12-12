-- Delete user_6bf33856's Full Course entry for Alfred Dunhill Championship

-- Find and delete their £10 Full Course entry
DELETE FROM competition_entries
WHERE user_id = '6bf33856-b7c0-44bb-a722-cb2d418d598f'
  AND competition_id IN (
    SELECT tc.id 
    FROM tournament_competitions tc
    LEFT JOIN competition_types ct ON ct.id = tc.competition_type_id
    WHERE tc.tournament_id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0'
      AND tc.entry_fee_pennies = 1000
      AND (ct.name ILIKE '%Full Course%' OR ct.name ILIKE '%full%')
  )
RETURNING id, competition_id, user_id, created_at;
