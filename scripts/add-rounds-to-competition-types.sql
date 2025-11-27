-- ===================================================================
-- ADD ROUNDS COUNT TO COMPETITION TYPES
-- Adds rounds_count field to track how many rounds each competition has
-- ===================================================================

-- 1. Add rounds_count column
ALTER TABLE public.competition_types 
ADD COLUMN IF NOT EXISTS rounds_count INTEGER DEFAULT 4;

-- 2. Update existing competition types with their round counts
UPDATE public.competition_types 
SET rounds_count = 4 
WHERE name = 'Full Course';

UPDATE public.competition_types 
SET rounds_count = 2 
WHERE name = 'Beat The Cut';

UPDATE public.competition_types 
SET rounds_count = 4 
WHERE name = 'ONE 2 ONE';

UPDATE public.competition_types 
SET rounds_count = 1 
WHERE name = 'Final Strike';

UPDATE public.competition_types 
SET rounds_count = 1 
WHERE name = 'First To Strike';

UPDATE public.competition_types 
SET rounds_count = 1 
WHERE name = 'Second Round';

UPDATE public.competition_types 
SET rounds_count = 2 
WHERE name = 'THE WEEKENDER';

-- 3. Verify the updates
SELECT 
  id,
  name,
  rounds_count,
  description
FROM public.competition_types
ORDER BY name;
