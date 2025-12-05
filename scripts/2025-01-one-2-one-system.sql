-- ===================================================================
-- ONE 2 ONE MATCHMAKING SYSTEM
-- Run this in Supabase Dashboard SQL Editor
-- Creates template-instance pattern for scalable 1v1 competitions
-- ===================================================================

-- ===================================================================
-- 1. COMPETITION TEMPLATES TABLE
-- ===================================================================
-- Defines ONE 2 ONE competition types (e.g., "All Rounds", "Round 2 Only")
-- Templates are reusable definitions, instances are fillable matches
CREATE TABLE IF NOT EXISTS public.competition_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- "ONE 2 ONE - All Rounds", "ONE 2 ONE - Round 2"
  short_name TEXT NOT NULL, -- "All Rounds", "Round 2"
  description TEXT,
  entry_fee_pennies INTEGER NOT NULL DEFAULT 0 CHECK (entry_fee_pennies >= 0),
  admin_fee_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00 CHECK (admin_fee_percent >= 0 AND admin_fee_percent <= 100),
  max_players INTEGER NOT NULL DEFAULT 2 CHECK (max_players = 2), -- Always 2 for ONE 2 ONE
  rounds_covered INTEGER[] NOT NULL, -- [1,2,3,4] for All Rounds, [2] for Round 2
  reg_close_round INTEGER, -- Which round closes registration (NULL = use reg_close_at)
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_template_name UNIQUE(name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_competition_templates_status ON public.competition_templates(status);

-- Enable RLS
ALTER TABLE public.competition_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read, admin write
DROP POLICY IF EXISTS "competition_templates_public_read" ON public.competition_templates;
CREATE POLICY "competition_templates_public_read"
  ON public.competition_templates
  FOR SELECT
  USING (status = 'active');

DROP POLICY IF EXISTS "competition_templates_admin_all" ON public.competition_templates;
CREATE POLICY "competition_templates_admin_all"
  ON public.competition_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.competition_templates IS 'ONE 2 ONE competition templates defining match types (All Rounds, Round 1-4). Templates spawn instances.';

-- ===================================================================
-- 2. COMPETITION INSTANCES TABLE
-- ===================================================================
-- Individual fillable matches spawned from templates
-- Each instance holds exactly 2 players (max_players from template)
CREATE TABLE IF NOT EXISTS public.competition_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.competition_templates(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  instance_number INTEGER NOT NULL DEFAULT 1, -- Match #1, Match #2, etc.
  current_players INTEGER NOT NULL DEFAULT 0 CHECK (current_players >= 0 AND current_players <= 2),
  max_players INTEGER NOT NULL DEFAULT 2 CHECK (max_players = 2),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'live', 'completed', 'cancelled')),
  reg_close_at TIMESTAMPTZ,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  winner_entry_id UUID REFERENCES public.competition_entries(id), -- Set after scoring
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ, -- When cancelled (if only 1 player)
  cancellation_reason TEXT, -- "Only 1 player - refunded"
  CONSTRAINT unique_instance_number UNIQUE(template_id, tournament_id, instance_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_competition_instances_template ON public.competition_instances(template_id);
CREATE INDEX IF NOT EXISTS idx_competition_instances_tournament ON public.competition_instances(tournament_id);
CREATE INDEX IF NOT EXISTS idx_competition_instances_status ON public.competition_instances(status);
CREATE INDEX IF NOT EXISTS idx_competition_instances_reg_close ON public.competition_instances(reg_close_at) WHERE status = 'open';

-- Enable RLS
ALTER TABLE public.competition_instances ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read, admin write
DROP POLICY IF EXISTS "competition_instances_public_read" ON public.competition_instances;
CREATE POLICY "competition_instances_public_read"
  ON public.competition_instances
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "competition_instances_admin_all" ON public.competition_instances;
CREATE POLICY "competition_instances_admin_all"
  ON public.competition_instances
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.competition_instances IS 'Fillable ONE 2 ONE matches. When full, auto-spawn new instance. Cancel & refund if only 1 player at reg_close_at.';

-- ===================================================================
-- 3. UPDATE COMPETITION_ENTRIES TABLE
-- ===================================================================
-- Add instance_id to track which ONE 2 ONE match the entry belongs to
ALTER TABLE public.competition_entries 
ADD COLUMN IF NOT EXISTS instance_id UUID REFERENCES public.competition_instances(id) ON DELETE CASCADE;

-- Add index for instance lookups
CREATE INDEX IF NOT EXISTS idx_competition_entries_instance ON public.competition_entries(instance_id);

COMMENT ON COLUMN public.competition_entries.instance_id IS 'For ONE 2 ONE: which specific match instance this entry belongs to';

-- ===================================================================
-- 4. AUTO-SPAWN FUNCTION
-- ===================================================================
-- Automatically create a new instance when current one fills up
CREATE OR REPLACE FUNCTION public.auto_spawn_next_instance()
RETURNS TRIGGER AS $$
DECLARE
  next_instance_number INTEGER;
BEGIN
  -- Only trigger when instance becomes full
  IF NEW.status = 'full' AND OLD.status != 'full' THEN
    -- Get next instance number
    SELECT COALESCE(MAX(instance_number), 0) + 1
    INTO next_instance_number
    FROM public.competition_instances
    WHERE template_id = NEW.template_id
      AND tournament_id = NEW.tournament_id;
    
    -- Create new instance
    INSERT INTO public.competition_instances (
      template_id,
      tournament_id,
      instance_number,
      current_players,
      max_players,
      status,
      reg_close_at,
      start_at,
      end_at
    ) VALUES (
      NEW.template_id,
      NEW.tournament_id,
      next_instance_number,
      0, -- Empty
      NEW.max_players,
      'open', -- Ready for players
      NEW.reg_close_at, -- Same deadline
      NEW.start_at,
      NEW.end_at
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS competition_instances_auto_spawn ON public.competition_instances;
CREATE TRIGGER competition_instances_auto_spawn
  AFTER UPDATE ON public.competition_instances
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_spawn_next_instance();

COMMENT ON FUNCTION public.auto_spawn_next_instance IS 'Auto-creates next instance when current one fills up (first-come-first-served)';

-- ===================================================================
-- 5. CANCELLATION FUNCTION
-- ===================================================================
-- Cancel instances with only 1 player when registration closes
-- This should be run by a cron job or scheduled function
CREATE OR REPLACE FUNCTION public.cancel_unfilled_instances()
RETURNS TABLE(
  cancelled_count INTEGER,
  refunded_count INTEGER
) AS $$
DECLARE
  instance_record RECORD;
  total_cancelled INTEGER := 0;
  total_refunded INTEGER := 0;
BEGIN
  -- Find instances that should be cancelled
  FOR instance_record IN
    SELECT ci.id, ci.instance_number, ci.template_id, ci.tournament_id, ci.current_players
    FROM public.competition_instances ci
    WHERE ci.status = 'open'
      AND ci.reg_close_at <= NOW()
      AND ci.current_players < ci.max_players
  LOOP
    -- Cancel the instance
    UPDATE public.competition_instances
    SET status = 'cancelled',
        cancelled_at = NOW(),
        cancellation_reason = CASE 
          WHEN instance_record.current_players = 0 THEN 'No players joined'
          WHEN instance_record.current_players = 1 THEN 'Only 1 player joined - refunded'
          ELSE 'Insufficient players - refunded'
        END,
        updated_at = NOW()
    WHERE id = instance_record.id;
    
    total_cancelled := total_cancelled + 1;
    
    -- If there are any entries, refund them
    IF instance_record.current_players > 0 THEN
      -- Update entries to refunded status
      UPDATE public.competition_entries
      SET status = 'cancelled',
          updated_at = NOW()
      WHERE instance_id = instance_record.id
        AND status IN ('submitted', 'paid');
      
      -- TODO: Trigger actual wallet refund via external function
      -- This should integrate with the wallet system
      total_refunded := total_refunded + instance_record.current_players;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT total_cancelled, total_refunded;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.cancel_unfilled_instances IS 'Cancels instances with < 2 players after reg_close_at. Call via cron job.';

-- ===================================================================
-- 6. UPDATE PLAYER COUNT FUNCTION
-- ===================================================================
-- Keep current_players in sync with entries
CREATE OR REPLACE FUNCTION public.update_instance_player_count()
RETURNS TRIGGER AS $$
DECLARE
  new_count INTEGER;
  max_allowed INTEGER;
  instance_status TEXT;
BEGIN
  -- Get current count and max for the instance
  IF TG_OP = 'DELETE' THEN
    -- For deletions, use OLD
    SELECT COUNT(*), ci.max_players, ci.status
    INTO new_count, max_allowed, instance_status
    FROM public.competition_entries ce
    JOIN public.competition_instances ci ON ce.instance_id = ci.id
    WHERE ce.instance_id = OLD.instance_id
      AND ce.status IN ('submitted', 'paid')
    GROUP BY ci.max_players, ci.status;
    
    -- Update the instance
    UPDATE public.competition_instances
    SET current_players = COALESCE(new_count, 0),
        status = CASE 
          WHEN COALESCE(new_count, 0) >= max_allowed THEN 'full'
          ELSE 'open'
        END,
        updated_at = NOW()
    WHERE id = OLD.instance_id;
    
  ELSE
    -- For inserts and updates, use NEW
    SELECT COUNT(*), ci.max_players, ci.status
    INTO new_count, max_allowed, instance_status
    FROM public.competition_entries ce
    JOIN public.competition_instances ci ON ce.instance_id = ci.id
    WHERE ce.instance_id = NEW.instance_id
      AND ce.status IN ('submitted', 'paid')
    GROUP BY ci.max_players, ci.status;
    
    -- Update the instance
    UPDATE public.competition_instances
    SET current_players = COALESCE(new_count, 0),
        status = CASE 
          WHEN COALESCE(new_count, 0) >= max_allowed THEN 'full'
          WHEN instance_status = 'full' AND COALESCE(new_count, 0) < max_allowed THEN 'open'
          ELSE instance_status
        END,
        updated_at = NOW()
    WHERE id = NEW.instance_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on competition_entries
DROP TRIGGER IF EXISTS competition_entries_update_instance_count ON public.competition_entries;
CREATE TRIGGER competition_entries_update_instance_count
  AFTER INSERT OR UPDATE OR DELETE ON public.competition_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_instance_player_count();

COMMENT ON FUNCTION public.update_instance_player_count IS 'Keeps instance current_players count synced with entries. Auto-marks full at 2 players.';

-- ===================================================================
-- 7. SEED INITIAL TEMPLATES
-- ===================================================================
-- Create the 5 ONE 2 ONE competition types
-- All Rounds closes at Round 1 start (covers all 4 rounds)
-- Individual rounds close at their respective round start
-- Order: All Rounds first, then Round 1-4
INSERT INTO public.competition_templates (name, short_name, description, entry_fee_pennies, admin_fee_percent, rounds_covered, reg_close_round)
VALUES 
  ('ONE 2 ONE - All Rounds', 'All Rounds', 'Head-to-head across all 4 rounds of the tournament', 1000, 10.00, ARRAY[1,2,3,4], 1),
  ('ONE 2 ONE - Round 1', 'Round 1', 'Head-to-head for Round 1 only', 500, 10.00, ARRAY[1], 1),
  ('ONE 2 ONE - Round 2', 'Round 2', 'Head-to-head for Round 2 only', 500, 10.00, ARRAY[2], 2),
  ('ONE 2 ONE - Round 3', 'Round 3', 'Head-to-head for Round 3 only', 500, 10.00, ARRAY[3], 3),
  ('ONE 2 ONE - Round 4', 'Round 4', 'Head-to-head for Round 4 only', 500, 10.00, ARRAY[4], 4)
ON CONFLICT (name) DO NOTHING;

-- ===================================================================
-- 8. UPDATED_AT TRIGGER
-- ===================================================================
-- Auto-update updated_at timestamps
DROP TRIGGER IF EXISTS competition_templates_updated_at ON public.competition_templates;
CREATE TRIGGER competition_templates_updated_at
  BEFORE UPDATE ON public.competition_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS competition_instances_updated_at ON public.competition_instances;
CREATE TRIGGER competition_instances_updated_at
  BEFORE UPDATE ON public.competition_instances
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================
-- Run these to verify the setup:
-- SELECT * FROM public.competition_templates ORDER BY rounds_covered;
-- SELECT * FROM public.competition_instances WHERE status = 'open';
-- SELECT ci.*, ct.short_name FROM public.competition_instances ci
--   JOIN public.competition_templates ct ON ci.template_id = ct.id
--   WHERE ci.tournament_id = 'YOUR_TOURNAMENT_ID';

-- ===================================================================
-- MAINTENANCE
-- ===================================================================
-- Schedule this function to run every minute or use pg_cron:
-- SELECT * FROM public.cancel_unfilled_instances();
