-- Find ALL users who have competition entries
SELECT 
    u.id as user_id,
    u.email,
    COUNT(ce.id) as total_entries,
    COUNT(CASE WHEN ce.instance_id IS NOT NULL THEN 1 END) as one2one_entries,
    COUNT(CASE WHEN ce.competition_id IS NOT NULL THEN 1 END) as regular_entries
FROM auth.users u
INNER JOIN competition_entries ce ON ce.user_id = u.id
GROUP BY u.id, u.email
ORDER BY total_entries DESC;
