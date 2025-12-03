-- ============================================================================
-- Player Round Stats Schema - Historical Raw Data from DataGolf
-- ============================================================================
-- This schema stores granular round-by-round strokes gained statistics
-- for every player, enabling advanced analytics and performance tracking
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Main Table: player_round_stats
-- ============================================================================
-- Stores detailed statistics for each round played by each player

CREATE TABLE IF NOT EXISTS player_round_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign keys
  golfer_id UUID REFERENCES golfers(id) NOT NULL,
  tournament_id UUID REFERENCES tournaments(id) NOT NULL,
  
  -- Round identification
  round_number INTEGER NOT NULL CHECK (round_number BETWEEN 1 AND 4),
  event_date DATE NOT NULL,
  
  -- Basic scoring
  score INTEGER NOT NULL,
  course_par INTEGER NOT NULL DEFAULT 72,
  to_par INTEGER NOT NULL,
  
  -- Course details
  course_name TEXT,
  course_num INTEGER,
  
  -- Traditional stats
  birdies INTEGER DEFAULT 0,
  bogies INTEGER DEFAULT 0,
  eagles_or_better INTEGER DEFAULT 0,
  doubles_or_worse INTEGER DEFAULT 0,
  pars INTEGER DEFAULT 0,
  
  -- Strokes Gained (THE GOLD DATA) 🏆
  -- All values are relative to field average (0 = average)
  sg_ott DECIMAL(6,3),        -- Off the tee (driving)
  sg_app DECIMAL(6,3),        -- Approach shots
  sg_arg DECIMAL(6,3),        -- Around the green (chipping)
  sg_putt DECIMAL(6,3),       -- Putting
  sg_t2g DECIMAL(6,3),        -- Tee to green (ott + app + arg)
  sg_total DECIMAL(6,3),      -- Total strokes gained
  
  -- Driving stats
  driving_acc DECIMAL(5,3),   -- Fairways hit percentage (0-1)
  driving_dist DECIMAL(6,2),  -- Average driving distance (yards)
  
  -- Accuracy stats
  gir DECIMAL(5,3),           -- Greens in regulation percentage (0-1)
  scrambling DECIMAL(5,3),    -- Scrambling percentage (0-1)
  
  -- Proximity stats (feet)
  prox_fw DECIMAL(7,2),       -- Average proximity from fairway
  prox_rgh DECIMAL(7,2),      -- Average proximity from rough
  
  -- Shot quality
  great_shots INTEGER DEFAULT 0,
  poor_shots INTEGER DEFAULT 0,
  
  -- Round metadata
  start_hole INTEGER,
  teetime TEXT,
  
  -- Data source tracking
  data_source TEXT DEFAULT 'datagolf' CHECK (data_source IN ('datagolf', 'manual')),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure uniqueness per round
  CONSTRAINT unique_player_round UNIQUE (golfer_id, tournament_id, round_number)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_player_stats_golfer 
  ON player_round_stats(golfer_id);

CREATE INDEX IF NOT EXISTS idx_player_stats_tournament 
  ON player_round_stats(tournament_id);

CREATE INDEX IF NOT EXISTS idx_player_stats_date 
  ON player_round_stats(event_date DESC);

-- SG performance indexes (for leaderboards/rankings)
CREATE INDEX IF NOT EXISTS idx_player_stats_sg_total 
  ON player_round_stats(sg_total DESC) WHERE sg_total IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_player_stats_sg_ott 
  ON player_round_stats(sg_ott DESC) WHERE sg_ott IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_player_stats_sg_app 
  ON player_round_stats(sg_app DESC) WHERE sg_app IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_player_stats_sg_putt 
  ON player_round_stats(sg_putt DESC) WHERE sg_putt IS NOT NULL;

-- Composite index for player timeline queries
CREATE INDEX IF NOT EXISTS idx_player_stats_golfer_date 
  ON player_round_stats(golfer_id, event_date DESC);

-- ============================================================================
-- Materialized View: player_sg_averages
-- ============================================================================
-- Pre-computed averages for quick access to player form

CREATE MATERIALIZED VIEW IF NOT EXISTS player_sg_averages AS
WITH ranked_rounds AS (
  SELECT 
    *,
    ROW_NUMBER() OVER (PARTITION BY golfer_id ORDER BY event_date DESC) as round_rank
  FROM player_round_stats
  WHERE sg_total IS NOT NULL
)
SELECT 
  golfer_id,
  COUNT(*) as total_rounds,
  
  -- Last 5 rounds (recent form)
  ROUND(AVG(CASE WHEN round_rank <= 5 THEN sg_total END)::numeric, 3) as sg_total_l5,
  ROUND(AVG(CASE WHEN round_rank <= 5 THEN sg_ott END)::numeric, 3) as sg_ott_l5,
  ROUND(AVG(CASE WHEN round_rank <= 5 THEN sg_app END)::numeric, 3) as sg_app_l5,
  ROUND(AVG(CASE WHEN round_rank <= 5 THEN sg_arg END)::numeric, 3) as sg_arg_l5,
  ROUND(AVG(CASE WHEN round_rank <= 5 THEN sg_putt END)::numeric, 3) as sg_putt_l5,
  
  -- Last 10 rounds
  ROUND(AVG(CASE WHEN round_rank <= 10 THEN sg_total END)::numeric, 3) as sg_total_l10,
  ROUND(AVG(CASE WHEN round_rank <= 10 THEN sg_ott END)::numeric, 3) as sg_ott_l10,
  ROUND(AVG(CASE WHEN round_rank <= 10 THEN sg_app END)::numeric, 3) as sg_app_l10,
  ROUND(AVG(CASE WHEN round_rank <= 10 THEN sg_arg END)::numeric, 3) as sg_arg_l10,
  ROUND(AVG(CASE WHEN round_rank <= 10 THEN sg_putt END)::numeric, 3) as sg_putt_l10,
  
  -- Last 20 rounds (current form)
  ROUND(AVG(CASE WHEN round_rank <= 20 THEN sg_total END)::numeric, 3) as sg_total_l20,
  ROUND(AVG(CASE WHEN round_rank <= 20 THEN sg_ott END)::numeric, 3) as sg_ott_l20,
  ROUND(AVG(CASE WHEN round_rank <= 20 THEN sg_app END)::numeric, 3) as sg_app_l20,
  ROUND(AVG(CASE WHEN round_rank <= 20 THEN sg_arg END)::numeric, 3) as sg_arg_l20,
  ROUND(AVG(CASE WHEN round_rank <= 20 THEN sg_putt END)::numeric, 3) as sg_putt_l20,
  
  -- Career averages
  ROUND(AVG(sg_total)::numeric, 3) as sg_total_career,
  ROUND(AVG(sg_ott)::numeric, 3) as sg_ott_career,
  ROUND(AVG(sg_app)::numeric, 3) as sg_app_career,
  ROUND(AVG(sg_arg)::numeric, 3) as sg_arg_career,
  ROUND(AVG(sg_putt)::numeric, 3) as sg_putt_career,
  
  -- Additional metrics
  ROUND(AVG(driving_dist)::numeric, 1) as avg_driving_dist,
  ROUND(AVG(driving_acc)::numeric, 3) as avg_driving_acc,
  ROUND(AVG(gir)::numeric, 3) as avg_gir,
  
  -- Consistency metrics (standard deviation)
  ROUND(STDDEV(sg_total)::numeric, 3) as sg_total_stddev,
  
  -- Date tracking
  MAX(event_date) as last_round_date,
  MIN(event_date) as first_round_date
  
FROM ranked_rounds
GROUP BY golfer_id;

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_sg_averages_golfer 
  ON player_sg_averages(golfer_id);

CREATE INDEX IF NOT EXISTS idx_sg_averages_l20_total 
  ON player_sg_averages(sg_total_l20 DESC NULLS LAST);

-- ============================================================================
-- View: player_hot_cold_list
-- ============================================================================
-- Identifies players in hot/cold form based on trends

CREATE OR REPLACE VIEW player_hot_cold_list AS
SELECT 
  g.id as golfer_id,
  g.name as player_name,
  avg.sg_total_l5,
  avg.sg_total_l20,
  avg.sg_total_career,
  
  -- Form indicator
  CASE 
    WHEN avg.sg_total_l5 > avg.sg_total_career + 0.5 THEN 'hot'
    WHEN avg.sg_total_l5 < avg.sg_total_career - 0.5 THEN 'cold'
    ELSE 'neutral'
  END as form_status,
  
  -- Momentum score (l5 vs l20)
  ROUND((avg.sg_total_l5 - avg.sg_total_l20)::numeric, 3) as momentum,
  
  avg.total_rounds,
  avg.last_round_date
  
FROM golfers g
INNER JOIN player_sg_averages avg ON g.id = avg.golfer_id
WHERE avg.total_rounds >= 5
ORDER BY avg.sg_total_l5 DESC NULLS LAST;

-- ============================================================================
-- Function: Refresh Materialized Views
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_player_sg_averages()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY player_sg_averages;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Trigger: Update timestamp on modification
-- ============================================================================

CREATE OR REPLACE FUNCTION update_player_stats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_player_stats_timestamp_trigger
  BEFORE UPDATE ON player_round_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats_timestamp();

-- ============================================================================
-- Grant Permissions (adjust as needed for your setup)
-- ============================================================================

-- Grant read access to authenticated users
-- GRANT SELECT ON player_round_stats TO authenticated;
-- GRANT SELECT ON player_sg_averages TO authenticated;
-- GRANT SELECT ON player_hot_cold_list TO authenticated;

-- ============================================================================
-- Sample Queries for Testing
-- ============================================================================

-- Get a player's last 20 rounds with SG breakdown
/*
SELECT 
  prs.event_date,
  t.name as tournament,
  prs.round_number,
  prs.score,
  prs.to_par,
  prs.sg_total,
  prs.sg_ott,
  prs.sg_app,
  prs.sg_arg,
  prs.sg_putt
FROM player_round_stats prs
JOIN tournaments t ON prs.tournament_id = t.id
WHERE prs.golfer_id = 'YOUR_PLAYER_ID'
ORDER BY prs.event_date DESC
LIMIT 20;
*/

-- Get player averages
/*
SELECT 
  g.name,
  avg.sg_total_l5,
  avg.sg_total_l20,
  avg.sg_total_career,
  avg.total_rounds
FROM player_sg_averages avg
JOIN golfers g ON avg.golfer_id = g.id
WHERE g.id = 'YOUR_PLAYER_ID';
*/

-- Get hot players
/*
SELECT * FROM player_hot_cold_list
WHERE form_status = 'hot'
LIMIT 10;
*/

-- ============================================================================
-- Notes
-- ============================================================================
-- 1. Run this script on your Supabase database
-- 2. After creating schema, import historical data using ETL script
-- 3. Set up cron job to refresh materialized view daily:
--    SELECT cron.schedule('refresh-sg-averages', '0 3 * * *', 'SELECT refresh_player_sg_averages()');
-- 4. Consider partitioning player_round_stats by year if data grows large
-- ============================================================================
