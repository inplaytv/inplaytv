-- Fix BMW Australian PGA Championship visibility
-- Run this if the tournament is not showing on the web app

-- First, check current status
SELECT 
  name,
  status,
  is_visible,
  start_date,
  end_date
FROM tournaments
WHERE name ILIKE '%BMW Australian PGA%';

-- Update to make it visible
UPDATE tournaments
SET is_visible = true
WHERE name ILIKE '%BMW Australian PGA%'
  AND (is_visible IS NULL OR is_visible = false);

-- Verify the fix
SELECT 
  name,
  status,
  is_visible,
  'Tournament should now be visible!' as result
FROM tournaments
WHERE name ILIKE '%BMW Australian PGA%';
