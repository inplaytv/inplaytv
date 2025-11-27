-- Force RSM Classic to stay 'live' and check for auto-update issues
UPDATE tournaments
SET status = 'live', updated_at = NOW()
WHERE slug = 'the-rsm-classic';

-- Check if there's a cron job running
SELECT * FROM cron.job WHERE jobname LIKE '%tournament%';

-- Verify the status
SELECT name, status, end_date, timezone FROM tournaments WHERE slug = 'the-rsm-classic';
