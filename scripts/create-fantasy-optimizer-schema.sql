-- Fantasy Golf Optimizer Schema
-- Lineup recommendations based on course fit, form, value, and tournament predictions

-- Create fantasy_lineups table
CREATE TABLE IF NOT EXISTS fantasy_lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  lineup_name VARCHAR(255) NOT NULL,
  lineup_type VARCHAR(50) NOT NULL, -- 'optimal', 'value', 'contrarian', 'safe'
  
  -- Lineup metrics
  total_salary INTEGER NOT NULL, -- Sum of all player salaries
  projected_points DECIMAL(8, 2), -- Expected fantasy points
  ownership_projection DECIMAL(5, 2), -- Expected average ownership %
  risk_score INTEGER, -- 1-10 scale, higher = riskier
  
  -- Optimization strategy
  strategy_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fantasy_lineups_tournament ON fantasy_lineups(tournament_id);
CREATE INDEX idx_fantasy_lineups_type ON fantasy_lineups(lineup_type);

-- Create fantasy_lineup_players table (junction table)
CREATE TABLE IF NOT EXISTS fantasy_lineup_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lineup_id UUID REFERENCES fantasy_lineups(id) ON DELETE CASCADE,
  golfer_id UUID REFERENCES golfers(id) ON DELETE CASCADE,
  
  -- DFS specific
  salary INTEGER NOT NULL,
  projected_points DECIMAL(6, 2) NOT NULL,
  ownership_projection DECIMAL(5, 2), -- Expected % rostered
  
  -- Value metrics
  points_per_dollar DECIMAL(6, 4), -- Projected points / (salary / 1000)
  value_rating INTEGER, -- 1-10 scale
  
  -- Supporting data
  win_probability DECIMAL(5, 2),
  course_fit_score DECIMAL(5, 2),
  form_score DECIMAL(5, 2),
  
  position_in_lineup INTEGER, -- 1-6 for typical DFS
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lineup_players_lineup ON fantasy_lineup_players(lineup_id);
CREATE INDEX idx_lineup_players_golfer ON fantasy_lineup_players(golfer_id);

-- Create player_dfs_pricing table (for salary data)
CREATE TABLE IF NOT EXISTS player_dfs_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  golfer_id UUID REFERENCES golfers(id) ON DELETE CASCADE,
  
  -- Pricing by platform
  draftkings_salary INTEGER,
  fanduel_salary INTEGER,
  yahoo_salary INTEGER,
  
  -- Projected ownership
  projected_ownership DECIMAL(5, 2),
  
  -- Value indicators
  salary_change INTEGER, -- vs previous tournament
  value_tier VARCHAR(20), -- 'elite', 'mid', 'value', 'punt'
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tournament_id, golfer_id)
);

CREATE INDEX idx_dfs_pricing_tournament ON player_dfs_pricing(tournament_id);
CREATE INDEX idx_dfs_pricing_golfer ON player_dfs_pricing(golfer_id);
CREATE INDEX idx_dfs_pricing_dk_salary ON player_dfs_pricing(draftkings_salary DESC);

-- Insert mock DFS pricing data
INSERT INTO player_dfs_pricing (
  tournament_id,
  golfer_id,
  draftkings_salary,
  fanduel_salary,
  yahoo_salary,
  projected_ownership,
  value_tier
)
SELECT 
  t.id as tournament_id,
  g.id as golfer_id,
  CASE 
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) <= 5 THEN 10500 + (RANDOM() * 1500)::INTEGER
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) <= 15 THEN 9000 + (RANDOM() * 1500)::INTEGER
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) <= 30 THEN 7500 + (RANDOM() * 1500)::INTEGER
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) <= 50 THEN 6500 + (RANDOM() * 1000)::INTEGER
    ELSE 6000 + (RANDOM() * 500)::INTEGER
  END as draftkings_salary,
  CASE 
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) <= 5 THEN 11500 + (RANDOM() * 1000)::INTEGER
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) <= 15 THEN 10000 + (RANDOM() * 1500)::INTEGER
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) <= 30 THEN 8500 + (RANDOM() * 1500)::INTEGER
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) <= 50 THEN 7500 + (RANDOM() * 1000)::INTEGER
    ELSE 7000 + (RANDOM() * 500)::INTEGER
  END as fanduel_salary,
  CASE 
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) <= 5 THEN 40 + (RANDOM() * 10)::INTEGER
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) <= 15 THEN 30 + (RANDOM() * 10)::INTEGER
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) <= 30 THEN 20 + (RANDOM() * 10)::INTEGER
    ELSE 10 + (RANDOM() * 10)::INTEGER
  END as yahoo_salary,
  CASE 
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) <= 5 THEN 25.0 + (RANDOM() * 15)
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) <= 15 THEN 15.0 + (RANDOM() * 10)
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) <= 30 THEN 8.0 + (RANDOM() * 7)
    ELSE 2.0 + (RANDOM() * 6)
  END as projected_ownership,
  CASE 
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) <= 10 THEN 'elite'
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) <= 30 THEN 'mid'
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) <= 60 THEN 'value'
    ELSE 'punt'
  END as value_tier
FROM tournaments t
CROSS JOIN golfers g
WHERE t.start_date > NOW()
  AND t.status = 'upcoming'
LIMIT 200
ON CONFLICT (tournament_id, golfer_id) DO NOTHING;

COMMENT ON TABLE fantasy_lineups IS 'Optimized DFS lineups for tournaments with different strategies';
COMMENT ON TABLE fantasy_lineup_players IS 'Players in each fantasy lineup with projections and value metrics';
COMMENT ON TABLE player_dfs_pricing IS 'DFS platform pricing and ownership projections for players';
