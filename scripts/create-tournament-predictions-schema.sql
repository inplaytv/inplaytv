-- Tournament Predictions Schema
-- AI-powered predictions for tournament winners with confidence scores

-- Create tournament_predictions table
CREATE TABLE IF NOT EXISTS tournament_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  golfer_id UUID REFERENCES golfers(id) ON DELETE CASCADE,
  prediction_date TIMESTAMP DEFAULT NOW(),
  
  -- Prediction scores
  win_probability DECIMAL(5, 2) NOT NULL, -- Percentage 0-100
  top_5_probability DECIMAL(5, 2) NOT NULL,
  top_10_probability DECIMAL(5, 2) NOT NULL,
  top_20_probability DECIMAL(5, 2) NOT NULL,
  
  -- Confidence and model info
  confidence_score DECIMAL(5, 2) NOT NULL, -- How confident is the model (0-100)
  model_version VARCHAR(50) DEFAULT 'v1.0',
  
  -- Key factors driving the prediction
  course_fit_score DECIMAL(5, 2), -- From course fit analysis
  form_score DECIMAL(5, 2), -- Recent form rating
  historical_score DECIMAL(5, 2), -- Past performance at venue
  sg_total_l20 DECIMAL(5, 2), -- Recent strokes gained
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tournament_id, golfer_id, prediction_date::date)
);

-- Create indexes for performance
CREATE INDEX idx_tournament_predictions_tournament ON tournament_predictions(tournament_id);
CREATE INDEX idx_tournament_predictions_golfer ON tournament_predictions(golfer_id);
CREATE INDEX idx_tournament_predictions_win_prob ON tournament_predictions(win_probability DESC);
CREATE INDEX idx_tournament_predictions_date ON tournament_predictions(prediction_date DESC);

-- Create prediction_factors table for detailed breakdowns
CREATE TABLE IF NOT EXISTS prediction_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES tournament_predictions(id) ON DELETE CASCADE,
  
  -- Individual factor scores (0-100 scale)
  course_fit INTEGER, -- How well player suits the course
  recent_form INTEGER, -- Last 5-20 rounds performance
  venue_history INTEGER, -- Past results at this course
  current_season INTEGER, -- Season-long performance
  major_experience INTEGER, -- Experience in big events (if major)
  
  -- Strokes Gained breakdown
  driving_advantage INTEGER, -- Relative to field strength
  approach_advantage INTEGER,
  short_game_advantage INTEGER,
  putting_advantage INTEGER,
  
  -- Contextual factors
  field_strength INTEGER, -- Quality of competition
  weather_adjustment INTEGER, -- Expected conditions impact
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_prediction_factors_prediction ON prediction_factors(prediction_id);

-- Insert mock prediction data for testing
-- This will be replaced with real AI predictions later
INSERT INTO tournament_predictions (
  tournament_id,
  golfer_id,
  win_probability,
  top_5_probability,
  top_10_probability,
  top_20_probability,
  confidence_score,
  course_fit_score,
  form_score,
  historical_score,
  sg_total_l20
)
SELECT 
  t.id as tournament_id,
  g.id as golfer_id,
  CASE 
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) = 1 THEN 12.5 + (RANDOM() * 5)
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) <= 3 THEN 8.0 + (RANDOM() * 4)
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) <= 5 THEN 5.0 + (RANDOM() * 3)
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) <= 10 THEN 3.0 + (RANDOM() * 2)
    ELSE 0.5 + (RANDOM() * 2.5)
  END as win_probability,
  CASE 
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) <= 10 THEN 25.0 + (RANDOM() * 20)
    ELSE 10.0 + (RANDOM() * 15)
  END as top_5_probability,
  CASE 
    WHEN ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY RANDOM()) <= 15 THEN 35.0 + (RANDOM() * 25)
    ELSE 15.0 + (RANDOM() * 20)
  END as top_10_probability,
  50.0 + (RANDOM() * 30) as top_20_probability,
  75.0 + (RANDOM() * 20) as confidence_score,
  60.0 + (RANDOM() * 35) as course_fit_score,
  55.0 + (RANDOM() * 40) as form_score,
  50.0 + (RANDOM() * 45) as historical_score,
  -0.5 + (RANDOM() * 3.0) as sg_total_l20
FROM tournaments t
CROSS JOIN golfers g
WHERE t.start_date > NOW()
  AND t.status = 'upcoming'
LIMIT 200
ON CONFLICT (tournament_id, golfer_id, prediction_date::date) DO NOTHING;

COMMENT ON TABLE tournament_predictions IS 'AI-powered predictions for tournament outcomes with confidence scores';
COMMENT ON TABLE prediction_factors IS 'Detailed breakdown of factors contributing to each prediction';
