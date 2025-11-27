-- Check tournament_golfers table schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tournament_golfers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing columns for live scoring
ALTER TABLE public.tournament_golfers
ADD COLUMN IF NOT EXISTS r1_score INTEGER,
ADD COLUMN IF NOT EXISTS r2_score INTEGER,
ADD COLUMN IF NOT EXISTS r3_score INTEGER,
ADD COLUMN IF NOT EXISTS r4_score INTEGER,
ADD COLUMN IF NOT EXISTS total_score INTEGER,
ADD COLUMN IF NOT EXISTS position TEXT;

-- Create indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_tournament_golfers_total_score ON public.tournament_golfers(total_score);
CREATE INDEX IF NOT EXISTS idx_tournament_golfers_position ON public.tournament_golfers(position);

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tournament_golfers' 
AND table_schema = 'public'
ORDER BY ordinal_position;
