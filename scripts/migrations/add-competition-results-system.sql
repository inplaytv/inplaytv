-- ===================================================================
-- COMPETITION RESULTS & WINNER TRACKING SYSTEM
-- Comprehensive logging of competition outcomes, winners, and payouts
-- ===================================================================

-- 1. Competition Results Table
CREATE TABLE IF NOT EXISTS public.competition_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.tournament_competitions(id) ON DELETE CASCADE,
  
  -- Competition Details
  competition_name TEXT NOT NULL,
  competition_slug TEXT NOT NULL,
  tournament_name TEXT NOT NULL,
  tournament_slug TEXT NOT NULL,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prize Pool
  total_entries INTEGER NOT NULL DEFAULT 0,
  total_prize_pool_pennies BIGINT NOT NULL DEFAULT 0,
  admin_fee_pennies BIGINT NOT NULL DEFAULT 0,
  distributed_prize_pennies BIGINT NOT NULL DEFAULT 0,
  
  -- Results Summary
  winner_user_id UUID REFERENCES auth.users(id),
  winner_entry_id UUID REFERENCES public.competition_entries(id),
  winner_username TEXT,
  winner_entry_name TEXT,
  winning_points INTEGER NOT NULL DEFAULT 0,
  
  -- Top 3 for quick reference
  top_3_entries JSONB, -- [{userId, entryId, username, points, position, prize}]
  
  -- Full Leaderboard Snapshot
  full_leaderboard JSONB NOT NULL, -- Complete leaderboard at time of completion
  
  -- Calculation Details
  scoring_method TEXT DEFAULT 'fantasy_points', -- 'fantasy_points', 'stroke_play', etc.
  calculation_metadata JSONB, -- Details about how points were calculated
  
  -- Status
  status TEXT DEFAULT 'pending_payout', -- 'pending_payout', 'paid_out', 'finalized'
  payout_processed_at TIMESTAMPTZ,
  payout_processed_by UUID REFERENCES auth.users(id),
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(competition_id)
);

-- 2. Individual Winner Payouts Table
CREATE TABLE IF NOT EXISTS public.competition_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_result_id UUID NOT NULL REFERENCES public.competition_results(id) ON DELETE CASCADE,
  competition_id UUID NOT NULL REFERENCES public.tournament_competitions(id) ON DELETE CASCADE,
  
  -- Winner Details
  user_id UUID NOT NULL REFERENCES auth.users(id),
  entry_id UUID NOT NULL REFERENCES public.competition_entries(id),
  username TEXT NOT NULL,
  entry_name TEXT NOT NULL,
  
  -- Position & Performance
  final_position INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  
  -- Payout
  prize_amount_pennies BIGINT NOT NULL,
  prize_percentage DECIMAL(5,2), -- e.g., 50.00 for 50%
  
  -- Entry Details
  entry_fee_pennies INTEGER NOT NULL,
  total_salary_used INTEGER NOT NULL,
  golfers_picked JSONB NOT NULL, -- [{golferId, name, points, isCaptain}]
  
  -- Scorecard Snapshot
  scorecard_data JSONB NOT NULL, -- Full scorecard at completion
  
  -- Status
  payout_status TEXT DEFAULT 'pending', -- 'pending', 'processed', 'failed'
  payout_method TEXT, -- 'wallet', 'bank_transfer', 'prize', etc.
  payout_transaction_id TEXT,
  payout_processed_at TIMESTAMPTZ,
  payout_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Competition Analytics Table
CREATE TABLE IF NOT EXISTS public.competition_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.tournament_competitions(id) ON DELETE CASCADE,
  competition_result_id UUID REFERENCES public.competition_results(id) ON DELETE CASCADE,
  
  -- Participation Stats
  total_unique_users INTEGER NOT NULL DEFAULT 0,
  total_entries INTEGER NOT NULL DEFAULT 0,
  average_entries_per_user DECIMAL(10,2),
  
  -- Financial Stats
  total_revenue_pennies BIGINT NOT NULL DEFAULT 0,
  total_admin_fees_pennies BIGINT NOT NULL DEFAULT 0,
  total_prizes_pennies BIGINT NOT NULL DEFAULT 0,
  
  -- Performance Stats
  highest_score INTEGER,
  lowest_score INTEGER,
  average_score DECIMAL(10,2),
  median_score DECIMAL(10,2),
  
  -- Golfer Stats
  most_picked_golfer_id UUID,
  most_picked_golfer_name TEXT,
  most_picked_golfer_count INTEGER,
  highest_scoring_golfer_id UUID,
  highest_scoring_golfer_name TEXT,
  highest_scoring_golfer_points INTEGER,
  
  -- Captain Stats
  most_captained_golfer_id UUID,
  most_captained_golfer_name TEXT,
  most_captained_count INTEGER,
  
  -- Distribution
  score_distribution JSONB, -- {range: count} e.g., {"0-50": 10, "51-100": 25}
  salary_usage_stats JSONB, -- {min, max, average, median}
  
  -- Timing
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(competition_id)
);

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_competition_results_competition ON public.competition_results(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_results_status ON public.competition_results(status);
CREATE INDEX IF NOT EXISTS idx_competition_results_completed ON public.competition_results(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_competition_results_winner ON public.competition_results(winner_user_id);

CREATE INDEX IF NOT EXISTS idx_competition_payouts_competition ON public.competition_payouts(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_payouts_result ON public.competition_payouts(competition_result_id);
CREATE INDEX IF NOT EXISTS idx_competition_payouts_user ON public.competition_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_competition_payouts_status ON public.competition_payouts(payout_status);

CREATE INDEX IF NOT EXISTS idx_competition_analytics_competition ON public.competition_analytics(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_analytics_result ON public.competition_analytics(competition_result_id);

-- 5. Enable RLS
ALTER TABLE public.competition_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_analytics ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies - Admin only for management, users can view their own payouts
DROP POLICY IF EXISTS "competition_results_admin_all" ON public.competition_results;
CREATE POLICY "competition_results_admin_all"
  ON public.competition_results FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "competition_results_public_read" ON public.competition_results;
CREATE POLICY "competition_results_public_read"
  ON public.competition_results FOR SELECT
  USING (true); -- Results are public

DROP POLICY IF EXISTS "competition_payouts_admin_all" ON public.competition_payouts;
CREATE POLICY "competition_payouts_admin_all"
  ON public.competition_payouts FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "competition_payouts_user_read" ON public.competition_payouts;
CREATE POLICY "competition_payouts_user_read"
  ON public.competition_payouts FOR SELECT
  USING (user_id = auth.uid() OR true); -- Users can see their own, public can see all

DROP POLICY IF EXISTS "competition_analytics_admin_all" ON public.competition_analytics;
CREATE POLICY "competition_analytics_admin_all"
  ON public.competition_analytics FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "competition_analytics_public_read" ON public.competition_analytics;
CREATE POLICY "competition_analytics_public_read"
  ON public.competition_analytics FOR SELECT
  USING (true); -- Analytics are public

-- 7. Add Comments
COMMENT ON TABLE public.competition_results IS 'Stores complete results and winner information for completed competitions';
COMMENT ON TABLE public.competition_payouts IS 'Tracks individual winner payouts and prize distribution';
COMMENT ON TABLE public.competition_analytics IS 'Detailed analytics and statistics for each competition';

-- 8. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_competition_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS competition_results_updated_at ON public.competition_results;
CREATE TRIGGER competition_results_updated_at
  BEFORE UPDATE ON public.competition_results
  FOR EACH ROW EXECUTE FUNCTION update_competition_results_updated_at();

DROP TRIGGER IF EXISTS competition_payouts_updated_at ON public.competition_payouts;
CREATE TRIGGER competition_payouts_updated_at
  BEFORE UPDATE ON public.competition_payouts
  FOR EACH ROW EXECUTE FUNCTION update_competition_results_updated_at();

DROP TRIGGER IF EXISTS competition_analytics_updated_at ON public.competition_analytics;
CREATE TRIGGER competition_analytics_updated_at
  BEFORE UPDATE ON public.competition_analytics
  FOR EACH ROW EXECUTE FUNCTION update_competition_results_updated_at();

-- Success Message
DO $$
BEGIN
  RAISE NOTICE '✅ Competition Results System installed successfully!';
  RAISE NOTICE '📊 Tables created: competition_results, competition_payouts, competition_analytics';
  RAISE NOTICE '🔐 RLS policies configured for admin management';
  RAISE NOTICE '📝 Next: Use admin panel to finalize completed competitions';
END;
$$;
