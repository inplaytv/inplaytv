-- ============================================================================
-- Tournament Round Scores System - Database Migration
-- ============================================================================
-- Purpose: Create comprehensive scoring system with historical backup,
--          manual override capability, and audit trail
-- Created: November 28, 2024
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CREATE MAIN SCORING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tournament_round_scores (
    -- Primary Keys
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    golfer_id UUID NOT NULL REFERENCES golfers(id) ON DELETE CASCADE,
    round_number INT NOT NULL CHECK (round_number BETWEEN 1 AND 4),
    
    -- Score Data
    score INT,                              -- Actual score (e.g., 68, 72, 75)
    to_par INT,                             -- Relative to par (e.g., -4, E, +2)
    par_value INT DEFAULT 72,               -- Par for this round (usually 72)
    status VARCHAR(20) DEFAULT 'not_started' CHECK (
        status IN ('not_started', 'in_progress', 'completed', 'withdrawn', 'cut')
    ),
    holes_completed INT DEFAULT 0 CHECK (holes_completed BETWEEN 0 AND 18),
    tee_time TIMESTAMPTZ,                   -- When player started round
    
    -- Data Source Tracking
    data_source VARCHAR(20) NOT NULL DEFAULT 'datagolf' CHECK (
        data_source IN ('datagolf', 'sportsradar', 'manual', 'pga_tour', 'other')
    ),
    is_manual_override BOOLEAN DEFAULT FALSE,
    raw_api_data JSONB,                     -- Complete API response for debugging
    
    -- Audit Trail
    updated_by UUID REFERENCES auth.users(id),  -- NULL for API, admin ID for manual
    notes TEXT,                              -- Reason for manual override
    fetched_at TIMESTAMPTZ DEFAULT NOW(),    -- When data was retrieved
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tournament_id, golfer_id, round_number),
    
    -- Validation: If manual override, must have updated_by
    CONSTRAINT manual_override_requires_admin 
        CHECK (NOT is_manual_override OR updated_by IS NOT NULL)
);

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_round_scores_tournament ON tournament_round_scores(tournament_id);
CREATE INDEX idx_round_scores_golfer ON tournament_round_scores(golfer_id);
CREATE INDEX idx_round_scores_round ON tournament_round_scores(round_number);
CREATE INDEX idx_round_scores_status ON tournament_round_scores(status);
CREATE INDEX idx_round_scores_source ON tournament_round_scores(data_source);
CREATE INDEX idx_round_scores_manual ON tournament_round_scores(is_manual_override) WHERE is_manual_override = TRUE;
CREATE INDEX idx_round_scores_updated_at ON tournament_round_scores(updated_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_round_scores_tournament_round ON tournament_round_scores(tournament_id, round_number);
CREATE INDEX idx_round_scores_tournament_golfer ON tournament_round_scores(tournament_id, golfer_id);

-- ============================================================================
-- 3. CREATE AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tournament_score_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_score_id UUID REFERENCES tournament_round_scores(id) ON DELETE CASCADE,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    golfer_id UUID NOT NULL REFERENCES golfers(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    
    -- What Changed
    action VARCHAR(20) NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'override')),
    old_score INT,
    new_score INT,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    
    -- Who & Why
    changed_by UUID REFERENCES auth.users(id),
    change_reason TEXT,
    data_source VARCHAR(20),
    
    -- When
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_score_audit_round_score ON tournament_score_audit_log(round_score_id);
CREATE INDEX idx_score_audit_tournament ON tournament_score_audit_log(tournament_id);
CREATE INDEX idx_score_audit_changed_at ON tournament_score_audit_log(changed_at DESC);

-- ============================================================================
-- 4. CREATE TRIGGER FOR AUDIT LOGGING
-- ============================================================================

CREATE OR REPLACE FUNCTION log_score_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO tournament_score_audit_log (
            round_score_id, tournament_id, golfer_id, round_number,
            action, new_score, new_status, changed_by, change_reason, data_source
        ) VALUES (
            NEW.id, NEW.tournament_id, NEW.golfer_id, NEW.round_number,
            'created', NEW.score, NEW.status, NEW.updated_by, NEW.notes, NEW.data_source
        );
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Only log if score or status actually changed
        IF OLD.score IS DISTINCT FROM NEW.score OR OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO tournament_score_audit_log (
                round_score_id, tournament_id, golfer_id, round_number,
                action, old_score, new_score, old_status, new_status,
                changed_by, change_reason, data_source
            ) VALUES (
                NEW.id, NEW.tournament_id, NEW.golfer_id, NEW.round_number,
                CASE WHEN NEW.is_manual_override THEN 'override' ELSE 'updated' END,
                OLD.score, NEW.score, OLD.status, NEW.status,
                NEW.updated_by, NEW.notes, NEW.data_source
            );
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO tournament_score_audit_log (
            round_score_id, tournament_id, golfer_id, round_number,
            action, old_score, old_status, changed_by, data_source
        ) VALUES (
            OLD.id, OLD.tournament_id, OLD.golfer_id, OLD.round_number,
            'deleted', OLD.score, OLD.status, OLD.updated_by, OLD.data_source
        );
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tournament_score_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON tournament_round_scores
    FOR EACH ROW EXECUTE FUNCTION log_score_changes();

-- ============================================================================
-- 5. CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_tournament_round_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_tournament_round_scores_updated_at
    BEFORE UPDATE ON tournament_round_scores
    FOR EACH ROW EXECUTE FUNCTION update_tournament_round_scores_updated_at();

-- ============================================================================
-- 6. ADD DENORMALIZED COLUMNS TO TOURNAMENT_GOLFERS (if not exists)
-- ============================================================================

-- Check if columns exist, add if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tournament_golfers' AND column_name='r1_score') THEN
        ALTER TABLE tournament_golfers ADD COLUMN r1_score INT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tournament_golfers' AND column_name='r2_score') THEN
        ALTER TABLE tournament_golfers ADD COLUMN r2_score INT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tournament_golfers' AND column_name='r3_score') THEN
        ALTER TABLE tournament_golfers ADD COLUMN r3_score INT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tournament_golfers' AND column_name='r4_score') THEN
        ALTER TABLE tournament_golfers ADD COLUMN r4_score INT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tournament_golfers' AND column_name='total_score') THEN
        ALTER TABLE tournament_golfers ADD COLUMN total_score INT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tournament_golfers' AND column_name='to_par') THEN
        ALTER TABLE tournament_golfers ADD COLUMN to_par INT;
    END IF;
END $$;

-- ============================================================================
-- 7. CREATE FUNCTION TO SYNC SCORES TO TOURNAMENT_GOLFERS
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_scores_to_tournament_golfers()
RETURNS TRIGGER AS $$
BEGIN
    -- Update denormalized scores in tournament_golfers
    UPDATE tournament_golfers tg
    SET 
        r1_score = COALESCE((SELECT score FROM tournament_round_scores 
                            WHERE tournament_id = NEW.tournament_id 
                            AND golfer_id = NEW.golfer_id 
                            AND round_number = 1 
                            AND status = 'completed'), tg.r1_score),
        r2_score = COALESCE((SELECT score FROM tournament_round_scores 
                            WHERE tournament_id = NEW.tournament_id 
                            AND golfer_id = NEW.golfer_id 
                            AND round_number = 2 
                            AND status = 'completed'), tg.r2_score),
        r3_score = COALESCE((SELECT score FROM tournament_round_scores 
                            WHERE tournament_id = NEW.tournament_id 
                            AND golfer_id = NEW.golfer_id 
                            AND round_number = 3 
                            AND status = 'completed'), tg.r3_score),
        r4_score = COALESCE((SELECT score FROM tournament_round_scores 
                            WHERE tournament_id = NEW.tournament_id 
                            AND golfer_id = NEW.golfer_id 
                            AND round_number = 4 
                            AND status = 'completed'), tg.r4_score),
        total_score = COALESCE(
            (SELECT SUM(score) FROM tournament_round_scores 
             WHERE tournament_id = NEW.tournament_id 
             AND golfer_id = NEW.golfer_id 
             AND status = 'completed'), tg.total_score),
        to_par = COALESCE(
            (SELECT SUM(to_par) FROM tournament_round_scores 
             WHERE tournament_id = NEW.tournament_id 
             AND golfer_id = NEW.golfer_id 
             AND status = 'completed'), tg.to_par)
    WHERE tg.tournament_id = NEW.tournament_id 
    AND tg.golfer_id = NEW.golfer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_scores_to_tournament_golfers_trigger
    AFTER INSERT OR UPDATE ON tournament_round_scores
    FOR EACH ROW EXECUTE FUNCTION sync_scores_to_tournament_golfers();

-- ============================================================================
-- 8. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Get latest scores for a tournament
CREATE OR REPLACE FUNCTION get_tournament_scores(p_tournament_id UUID)
RETURNS TABLE (
    golfer_id UUID,
    golfer_name TEXT,
    r1_score INT,
    r2_score INT,
    r3_score INT,
    r4_score INT,
    total_score INT,
    to_par INT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.full_name,
        trs1.score AS r1_score,
        trs2.score AS r2_score,
        trs3.score AS r3_score,
        trs4.score AS r4_score,
        (COALESCE(trs1.score, 0) + COALESCE(trs2.score, 0) + 
         COALESCE(trs3.score, 0) + COALESCE(trs4.score, 0)) AS total_score,
        (COALESCE(trs1.to_par, 0) + COALESCE(trs2.to_par, 0) + 
         COALESCE(trs3.to_par, 0) + COALESCE(trs4.to_par, 0)) AS to_par,
        COALESCE(tg.status, 'active') AS status
    FROM golfers g
    INNER JOIN tournament_golfers tg ON tg.golfer_id = g.id
    LEFT JOIN tournament_round_scores trs1 ON trs1.golfer_id = g.id 
        AND trs1.tournament_id = p_tournament_id AND trs1.round_number = 1
    LEFT JOIN tournament_round_scores trs2 ON trs2.golfer_id = g.id 
        AND trs2.tournament_id = p_tournament_id AND trs2.round_number = 2
    LEFT JOIN tournament_round_scores trs3 ON trs3.golfer_id = g.id 
        AND trs3.tournament_id = p_tournament_id AND trs3.round_number = 3
    LEFT JOIN tournament_round_scores trs4 ON trs4.golfer_id = g.id 
        AND trs4.tournament_id = p_tournament_id AND trs4.round_number = 4
    WHERE tg.tournament_id = p_tournament_id
    ORDER BY to_par ASC, total_score ASC, g.full_name ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. ENABLE ROW LEVEL SECURITY (Optional - for future)
-- ============================================================================

-- Enable RLS but don't set policies yet (Phase 2)
ALTER TABLE tournament_round_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_score_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY service_role_all_tournament_round_scores 
    ON tournament_round_scores FOR ALL 
    TO service_role USING (true);

CREATE POLICY service_role_all_tournament_score_audit_log 
    ON tournament_score_audit_log FOR ALL 
    TO service_role USING (true);

-- Allow authenticated users to read scores
CREATE POLICY authenticated_read_tournament_round_scores 
    ON tournament_round_scores FOR SELECT 
    TO authenticated USING (true);

CREATE POLICY authenticated_read_tournament_score_audit_log 
    ON tournament_score_audit_log FOR SELECT 
    TO authenticated USING (true);

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON tournament_round_scores TO authenticated;
GRANT SELECT ON tournament_score_audit_log TO authenticated;
GRANT ALL ON tournament_round_scores TO service_role;
GRANT ALL ON tournament_score_audit_log TO service_role;

-- ============================================================================
-- COMMIT TRANSACTION
-- ============================================================================

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check table creation
SELECT 
    'tournament_round_scores' AS table_name,
    COUNT(*) AS column_count
FROM information_schema.columns 
WHERE table_name = 'tournament_round_scores'
UNION ALL
SELECT 
    'tournament_score_audit_log',
    COUNT(*)
FROM information_schema.columns 
WHERE table_name = 'tournament_score_audit_log';

-- Check indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('tournament_round_scores', 'tournament_score_audit_log')
ORDER BY tablename, indexname;

-- Check triggers
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('tournament_round_scores', 'tournament_score_audit_log')
ORDER BY event_object_table, trigger_name;
