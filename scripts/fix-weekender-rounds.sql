-- Fix Weekender rounds_count from 4 to 2
UPDATE public.competition_types 
SET rounds_count = 2 
WHERE name = 'THE WEEKENDER';

-- Verify the fix
SELECT id, name, rounds_count 
FROM public.competition_types 
WHERE name = 'Weekender';
