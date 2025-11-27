-- Add datagolf_id column to golfers table
-- This is needed for DataGolf API integration

-- Check current schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'golfers' 
ORDER BY ordinal_position;

-- Add the column if it doesn't exist
ALTER TABLE public.golfers 
ADD COLUMN IF NOT EXISTS datagolf_id INTEGER UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_golfers_datagolf_id ON public.golfers(datagolf_id);

-- Add comment
COMMENT ON COLUMN public.golfers.datagolf_id IS 'DataGolf API unique identifier for golfer';

-- Verify it was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'golfers' 
ORDER BY ordinal_position;
