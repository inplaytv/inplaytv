-- Add salary_pennies column to golfers table for Clubhouse salary cap system
-- Run this in Supabase SQL Editor

-- Add salary_pennies column (INTEGER, pennies format)
ALTER TABLE public.golfers 
ADD COLUMN IF NOT EXISTS salary_pennies INTEGER;

-- Add last salary update tracking
ALTER TABLE public.golfers 
ADD COLUMN IF NOT EXISTS last_salary_update TIMESTAMPTZ;

-- Set default value (£100.00 = 10000 pennies) for existing golfers
UPDATE public.golfers 
SET salary_pennies = 10000 
WHERE salary_pennies IS NULL;

-- Add index for salary queries
CREATE INDEX IF NOT EXISTS golfers_salary_pennies_idx ON public.golfers(salary_pennies);

-- Verify
SELECT id, full_name, salary_pennies, last_salary_update 
FROM public.golfers 
LIMIT 5;
