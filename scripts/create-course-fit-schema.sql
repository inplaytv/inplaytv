-- ============================================================================
-- Course Fit Analysis Schema - Match Player Strengths to Course Requirements
-- ============================================================================
-- This schema stores course characteristics and calculates player fit scores
-- based on how well their SG strengths match what the course demands
-- ============================================================================

-- ============================================================================
-- Table: course_profiles
-- ============================================================================
-- Stores detailed characteristics of golf courses and their demands

CREATE TABLE IF NOT EXISTS course_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic info
  name TEXT NOT NULL,
  location TEXT,
  tournament_id UUID REFERENCES tournaments(id),
  
  -- Course characteristics
  par INTEGER DEFAULT 72,
  yardage INTEGER,
  course_type TEXT CHECK (course_type IN ('links', 'parkland', 'desert', 'resort', 'stadium')),
  
  -- Skill weight factors (0-100, higher = more important for this course)
  -- These determine how much each SG category matters
  driving_weight INTEGER DEFAULT 50 CHECK (driving_weight BETWEEN 0 AND 100),
  approach_weight INTEGER DEFAULT 50 CHECK (approach_weight BETWEEN 0 AND 100),
  short_game_weight INTEGER DEFAULT 50 CHECK (short_game_weight BETWEEN 0 AND 100),
  putting_weight INTEGER DEFAULT 50 CHECK (putting_weight BETWEEN 0 AND 100),
  
  -- Course difficulty factors
  difficulty_rating DECIMAL(3,1) CHECK (difficulty_rating BETWEEN 1 AND 10),
  fairway_width TEXT CHECK (fairway_width IN ('narrow', 'medium', 'wide')),
  rough_severity TEXT CHECK (rough_severity IN ('light', 'medium', 'heavy')),
  green_speed TEXT CHECK (green_speed IN ('slow', 'medium', 'fast', 'very_fast')),
  green_size TEXT CHECK (green_size IN ('small', 'medium', 'large')),
  green_firmness TEXT CHECK (green_firmness IN ('soft', 'medium', 'firm')),
  
  -- Weather & conditions
  typical_wind TEXT CHECK (typical_wind IN ('calm', 'light', 'moderate', 'heavy')),
  elevation_change TEXT CHECK (elevation_change IN ('flat', 'rolling', 'hilly', 'mountain')),
  
  -- Historical scoring
  winning_score_avg DECIMAL(5,2),
  scoring_avg DECIMAL(5,2),
  cut_line_avg DECIMAL(5,2),
  
  -- Key features/notes
  key_holes TEXT[], -- Array of signature/challenging holes
  strategy_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_course_name UNIQUE (name)
);

-- ============================================================================
-- Materialized View: player_course_fit_scores
-- ============================================================================
-- Pre-calculates fit scores for each player to each course

CREATE MATERIALIZED VIEW IF NOT EXISTS player_course_fit_scores AS
SELECT 
  cp.id as course_id,
  cp.name as course_name,
  g.id as golfer_id,
  g.name as player_name,
  avg.sg_ott_l20,
  avg.sg_app_l20,
  avg.sg_arg_l20,
  avg.sg_putt_l20,
  avg.sg_total_l20,
  
  -- Calculate weighted fit score (0-100 scale)
  ROUND(
    (
      -- Normalize SG values to 0-100 scale (assuming -2 to +2 SG range)
      ((COALESCE(avg.sg_ott_l20, 0) + 2) / 4 * 100) * (cp.driving_weight / 100.0) +
      ((COALESCE(avg.sg_app_l20, 0) + 2) / 4 * 100) * (cp.approach_weight / 100.0) +
      ((COALESCE(avg.sg_arg_l20, 0) + 2) / 4 * 100) * (cp.short_game_weight / 100.0) +
      ((COALESCE(avg.sg_putt_l20, 0) + 2) / 4 * 100) * (cp.putting_weight / 100.0)
    ) / 
    (
      -- Total weight to normalize
      (cp.driving_weight + cp.approach_weight + cp.short_game_weight + cp.putting_weight) / 100.0
    )
  , 1) as fit_score,
  
  -- Driving fit
  CASE 
    WHEN cp.driving_weight > 70 AND avg.sg_ott_l20 > 0.5 THEN 'excellent'
    WHEN cp.driving_weight > 70 AND avg.sg_ott_l20 > 0 THEN 'good'
    WHEN cp.driving_weight > 70 AND avg.sg_ott_l20 < -0.5 THEN 'poor'
    ELSE 'average'
  END as driving_fit,
  
  -- Approach fit
  CASE 
    WHEN cp.approach_weight > 70 AND avg.sg_app_l20 > 0.5 THEN 'excellent'
    WHEN cp.approach_weight > 70 AND avg.sg_app_l20 > 0 THEN 'good'
    WHEN cp.approach_weight > 70 AND avg.sg_app_l20 < -0.5 THEN 'poor'
    ELSE 'average'
  END as approach_fit,
  
  -- Short game fit
  CASE 
    WHEN cp.short_game_weight > 70 AND avg.sg_arg_l20 > 0.3 THEN 'excellent'
    WHEN cp.short_game_weight > 70 AND avg.sg_arg_l20 > 0 THEN 'good'
    WHEN cp.short_game_weight > 70 AND avg.sg_arg_l20 < -0.3 THEN 'poor'
    ELSE 'average'
  END as short_game_fit,
  
  -- Putting fit
  CASE 
    WHEN cp.putting_weight > 70 AND avg.sg_putt_l20 > 0.5 THEN 'excellent'
    WHEN cp.putting_weight > 70 AND avg.sg_putt_l20 > 0 THEN 'good'
    WHEN cp.putting_weight > 70 AND avg.sg_putt_l20 < -0.5 THEN 'poor'
    ELSE 'average'
  END as putting_fit,
  
  -- Overall fit rating
  CASE 
    WHEN ROUND((
      ((COALESCE(avg.sg_ott_l20, 0) + 2) / 4 * 100) * (cp.driving_weight / 100.0) +
      ((COALESCE(avg.sg_app_l20, 0) + 2) / 4 * 100) * (cp.approach_weight / 100.0) +
      ((COALESCE(avg.sg_arg_l20, 0) + 2) / 4 * 100) * (cp.short_game_weight / 100.0) +
      ((COALESCE(avg.sg_putt_l20, 0) + 2) / 4 * 100) * (cp.putting_weight / 100.0)
    ) / ((cp.driving_weight + cp.approach_weight + cp.short_game_weight + cp.putting_weight) / 100.0), 1) >= 65 THEN 'elite'
    WHEN ROUND((
      ((COALESCE(avg.sg_ott_l20, 0) + 2) / 4 * 100) * (cp.driving_weight / 100.0) +
      ((COALESCE(avg.sg_app_l20, 0) + 2) / 4 * 100) * (cp.approach_weight / 100.0) +
      ((COALESCE(avg.sg_arg_l20, 0) + 2) / 4 * 100) * (cp.short_game_weight / 100.0) +
      ((COALESCE(avg.sg_putt_l20, 0) + 2) / 4 * 100) * (cp.putting_weight / 100.0)
    ) / ((cp.driving_weight + cp.approach_weight + cp.short_game_weight + cp.putting_weight) / 100.0), 1) >= 55 THEN 'good'
    WHEN ROUND((
      ((COALESCE(avg.sg_ott_l20, 0) + 2) / 4 * 100) * (cp.driving_weight / 100.0) +
      ((COALESCE(avg.sg_app_l20, 0) + 2) / 4 * 100) * (cp.approach_weight / 100.0) +
      ((COALESCE(avg.sg_arg_l20, 0) + 2) / 4 * 100) * (cp.short_game_weight / 100.0) +
      ((COALESCE(avg.sg_putt_l20, 0) + 2) / 4 * 100) * (cp.putting_weight / 100.0)
    ) / ((cp.driving_weight + cp.approach_weight + cp.short_game_weight + cp.putting_weight) / 100.0), 1) >= 45 THEN 'average'
    ELSE 'poor'
  END as overall_fit,
  
  cp.course_type,
  cp.difficulty_rating

FROM course_profiles cp
CROSS JOIN golfers g
LEFT JOIN player_sg_averages avg ON g.id = avg.golfer_id
WHERE avg.total_rounds >= 5;

-- Index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_course_fit_scores 
  ON player_course_fit_scores(course_id, golfer_id);

CREATE INDEX IF NOT EXISTS idx_course_fit_by_score 
  ON player_course_fit_scores(course_id, fit_score DESC);

CREATE INDEX IF NOT EXISTS idx_player_fit_by_course 
  ON player_course_fit_scores(golfer_id, fit_score DESC);

-- ============================================================================
-- Function: Refresh Course Fit Scores
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_course_fit_scores()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY player_course_fit_scores;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Trigger: Update timestamp on course profile modification
-- ============================================================================

CREATE OR REPLACE FUNCTION update_course_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_profile_timestamp_trigger
  BEFORE UPDATE ON course_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_course_profile_timestamp();

-- ============================================================================
-- Sample Data: Insert example courses
-- ============================================================================

INSERT INTO course_profiles (
  name, location, course_type, par, yardage,
  driving_weight, approach_weight, short_game_weight, putting_weight,
  difficulty_rating, fairway_width, rough_severity, green_speed, green_size, green_firmness,
  typical_wind, elevation_change,
  winning_score_avg, scoring_avg, cut_line_avg,
  strategy_notes
) VALUES 
(
  'Augusta National Golf Club',
  'Augusta, Georgia',
  'parkland',
  72,
  7510,
  60,  -- Driving: Important but not extreme
  85,  -- Approach: Critical - approach play is key
  75,  -- Short game: Very important around the greens
  70,  -- Putting: Fast, undulating greens
  9.5,
  'medium',
  'medium',
  'very_fast',
  'medium',
  'firm',
  'light',
  'rolling',
  -10.5,
  72.8,
  2.5,
  'Second shots are paramount. Fast, sloped greens demand elite approach play and putting. Short game crucial around the greens.'
),
(
  'Pebble Beach Golf Links',
  'Pebble Beach, California',
  'links',
  72,
  7075,
  75,  -- Driving: Critical in wind
  80,  -- Approach: Very important
  85,  -- Short game: Links style demands great short game
  65,  -- Putting: Important but not extreme
  8.8,
  'narrow',
  'medium',
  'fast',
  'small',
  'medium',
  'heavy',
  'flat',
  -8.2,
  73.5,
  3.0,
  'Wind management is key. Small greens demand precision. Short game around firm greens is critical.'
),
(
  'TPC Sawgrass (Players Stadium)',
  'Ponte Vedra Beach, Florida',
  'stadium',
  72,
  7256,
  70,  -- Driving: Important
  90,  -- Approach: THE most important skill
  65,  -- Short game: Moderate importance
  75,  -- Putting: Fast Bermuda greens
  9.2,
  'medium',
  'heavy',
  'fast',
  'small',
  'firm',
  'moderate',
  'flat',
  -12.8,
  72.2,
  1.8,
  'Ultimate ball-striking test. Small, firm greens demand elite approach play. Missing greens is severely penalized.'
),
(
  'Torrey Pines (South Course)',
  'San Diego, California',
  'parkland',
  72,
  7765,
  85,  -- Driving: Length is critical
  75,  -- Approach: Important
  60,  -- Short game: Less important
  65,  -- Putting: Standard
  8.5,
  'wide',
  'heavy',
  'medium',
  'large',
  'soft',
  'light',
  'rolling',
  -6.5,
  73.8,
  3.5,
  'Bombers paradise. Length off the tee is a huge advantage. Large, soft greens make approach play less penalizing.'
),
(
  'Harbour Town Golf Links',
  'Hilton Head Island, South Carolina',
  'parkland',
  71,
  7191,
  55,  -- Driving: Accuracy over distance
  95,  -- Approach: Absolutely critical
  70,  -- Short game: Important
  80,  -- Putting: Small greens = more putts
  8.7,
  'narrow',
  'heavy',
  'fast',
  'small',
  'firm',
  'moderate',
  'flat',
  -10.2,
  71.5,
  2.2,
  'Precision course. Tiny greens demand elite iron play. Accuracy off tee more important than distance.'
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Refresh the materialized view to generate fit scores
-- ============================================================================

SELECT refresh_course_fit_scores();

-- ============================================================================
-- Sample Queries for Testing
-- ============================================================================

-- Get top 10 best fits for a specific course
/*
SELECT 
  player_name,
  fit_score,
  overall_fit,
  sg_total_l20,
  driving_fit,
  approach_fit,
  short_game_fit,
  putting_fit
FROM player_course_fit_scores
WHERE course_name = 'Augusta National Golf Club'
ORDER BY fit_score DESC
LIMIT 10;
*/

-- Get all courses ranked by fit for a specific player
/*
SELECT 
  course_name,
  course_type,
  fit_score,
  overall_fit,
  difficulty_rating
FROM player_course_fit_scores
WHERE player_name = 'Scottie Scheffler'
ORDER BY fit_score DESC;
*/

-- Find players who excel at a specific course type
/*
SELECT 
  player_name,
  AVG(fit_score) as avg_fit_score,
  COUNT(*) as courses_analyzed
FROM player_course_fit_scores
WHERE course_type = 'links'
GROUP BY player_name
ORDER BY avg_fit_score DESC
LIMIT 10;
*/

-- ============================================================================
-- Notes
-- ============================================================================
-- 1. Run this script after player_round_stats schema is set up
-- 2. Adjust weight factors for each course based on historical data
-- 3. The fit_score calculation can be tuned based on real-world results
-- 4. Consider adding past performance at specific courses for enhanced predictions
-- ============================================================================
