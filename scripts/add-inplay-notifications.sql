-- Add InPlay notification tracking and preferences
-- Run this in Supabase SQL Editor

-- 1. Add notified_inplay column to tournament_competitions
ALTER TABLE public.tournament_competitions 
ADD COLUMN IF NOT EXISTS notified_inplay BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.tournament_competitions.notified_inplay IS 'TRUE after InPlay notifications sent to users with entries';

-- 2. Add entry_inplay preference to notification_preferences
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS entry_inplay BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.notification_preferences.entry_inplay IS 'Receive notification when your entry goes InPlay (competition starts)';

-- 3. Update existing users to have default preference
UPDATE public.notification_preferences
SET entry_inplay = true
WHERE entry_inplay IS NULL;

-- 4. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tournament_competitions_inplay_check 
ON public.tournament_competitions(start_at, notified_inplay) 
WHERE notified_inplay = false;

-- Verification queries
SELECT 'notified_inplay column added' AS status, 
       COUNT(*) FILTER (WHERE notified_inplay = false) AS competitions_pending,
       COUNT(*) FILTER (WHERE notified_inplay = true) AS competitions_notified
FROM public.tournament_competitions;

SELECT 'entry_inplay preferences' AS status,
       COUNT(*) FILTER (WHERE entry_inplay = true) AS enabled,
       COUNT(*) FILTER (WHERE entry_inplay = false) AS disabled
FROM public.notification_preferences;
