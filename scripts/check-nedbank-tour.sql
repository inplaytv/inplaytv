-- Check what tour value the Nedbank tournament has
SELECT name, tour, slug, start_date 
FROM tournaments 
WHERE name ILIKE '%nedbank%' OR name ILIKE '%gary player%'
ORDER BY start_date DESC
LIMIT 5;
