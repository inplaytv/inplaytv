-- Delete the specific duplicate that just appeared
-- Instance ID: 8b2cef7f-1e05-488c-a820-7453103f663b

DELETE FROM competition_entries
WHERE instance_id = '8b2cef7f-1e05-488c-a820-7453103f663b';

DELETE FROM competition_instances
WHERE id = '8b2cef7f-1e05-488c-a820-7453103f663b';

-- Verify it's gone
SELECT COUNT(*) FROM competition_instances WHERE id = '8b2cef7f-1e05-488c-a820-7453103f663b';
