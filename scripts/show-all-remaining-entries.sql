-- Show ALL competition entries to see what's still there
SELECT 
    ce.id,
    ce.entry_name,
    ce.competition_id,
    ce.instance_id,
    ce.created_at,
    tc.competition_type_id,
    CASE 
        WHEN ce.instance_id IS NOT NULL THEN 'ONE 2 ONE'
        ELSE 'REGULAR'
    END as entry_type
FROM competition_entries ce
LEFT JOIN tournament_competitions tc ON ce.competition_id = tc.id
ORDER BY ce.created_at DESC;
