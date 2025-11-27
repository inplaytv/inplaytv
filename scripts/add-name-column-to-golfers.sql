-- Add name column to golfers table (required by some parts of the system)
-- The name will be generated from first_name + last_name

-- Step 1: Add the column
ALTER TABLE public.golfers 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Step 2: Populate name from existing first_name and last_name
UPDATE public.golfers 
SET name = first_name || ' ' || last_name
WHERE name IS NULL;

-- Step 3: Make it NOT NULL
ALTER TABLE public.golfers 
ALTER COLUMN name SET NOT NULL;

-- Step 4: Create index
CREATE INDEX IF NOT EXISTS idx_golfers_name ON public.golfers(name);

-- Step 5: Verify it worked
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'golfers' 
ORDER BY ordinal_position;
