-- ===================================================================
-- NOTIFICATION SYSTEM MIGRATION
-- Alerts for tee times available and registration closing
-- ===================================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  competition_id UUID REFERENCES tournament_competitions(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('tee_times_available', 'registration_closing', 'registration_open', 'tournament_live', 'competition_live')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tournament_id ON notifications(tournament_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY notifications_select_own ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update (mark as read) their own notifications
CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: System/admin can insert notifications for any user
CREATE POLICY notifications_insert_system ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tee_times_available BOOLEAN DEFAULT TRUE,
  registration_closing BOOLEAN DEFAULT TRUE,
  registration_closing_hours INTEGER DEFAULT 1, -- Alert X hours before closing
  registration_open BOOLEAN DEFAULT TRUE,
  tournament_live BOOLEAN DEFAULT TRUE,
  competition_live BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view and update their own preferences
CREATE POLICY notification_preferences_select_own ON notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY notification_preferences_update_own ON notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY notification_preferences_insert_own ON notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to create tee times available notification for all active users
CREATE OR REPLACE FUNCTION notify_tee_times_available(
  p_tournament_id UUID,
  p_tournament_name TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  INSERT INTO notifications (user_id, tournament_id, type, title, message, link)
  SELECT 
    p.id,
    p_tournament_id,
    'tee_times_available',
    '⏰ Tee Times Available',
    'Tee times are now available for ' || p_tournament_name || '. Competition registration times have been updated.',
    '/tournaments/' || (SELECT slug FROM tournaments WHERE id = p_tournament_id)
  FROM profiles p
  JOIN notification_preferences np ON np.user_id = p.id
  WHERE np.tee_times_available = TRUE
    AND p.onboarding_complete = TRUE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Function to create registration closing notifications
CREATE OR REPLACE FUNCTION notify_registration_closing(
  p_competition_id UUID,
  p_competition_name TEXT,
  p_tournament_name TEXT,
  p_closes_at TIMESTAMPTZ
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
  v_tournament_slug TEXT;
BEGIN
  -- Get tournament slug
  SELECT slug INTO v_tournament_slug
  FROM tournaments t
  JOIN tournament_competitions tc ON tc.tournament_id = t.id
  WHERE tc.id = p_competition_id;

  -- Only notify users who haven't entered yet and want these notifications
  INSERT INTO notifications (user_id, tournament_id, competition_id, type, title, message, link)
  SELECT 
    p.id,
    tc.tournament_id,
    p_competition_id,
    'registration_closing',
    '⚠️ Registration Closing Soon',
    p_competition_name || ' registration closes in ' || 
    CASE 
      WHEN EXTRACT(EPOCH FROM (p_closes_at - NOW())) / 3600 < 1 
      THEN ROUND(EXTRACT(EPOCH FROM (p_closes_at - NOW())) / 60) || ' minutes'
      ELSE ROUND(EXTRACT(EPOCH FROM (p_closes_at - NOW())) / 3600) || ' hours'
    END || ' for ' || p_tournament_name || '.',
    '/tournaments/' || v_tournament_slug || '/build-team?competition=' || p_competition_id
  FROM profiles p
  JOIN notification_preferences np ON np.user_id = p.id
  JOIN tournament_competitions tc ON tc.id = p_competition_id
  LEFT JOIN tournament_entries te ON te.competition_id = p_competition_id AND te.user_id = p.id
  WHERE np.registration_closing = TRUE
    AND p.onboarding_complete = TRUE
    AND te.id IS NULL; -- User hasn't entered yet
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Comment on tables
COMMENT ON TABLE notifications IS 'User notifications for tournament and competition events';
COMMENT ON TABLE notification_preferences IS 'User preferences for which notifications they want to receive';

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE '✅ Notification system migration complete';
  RAISE NOTICE '   - Created notifications table with RLS policies';
  RAISE NOTICE '   - Created notification_preferences table';
  RAISE NOTICE '   - Created notification functions';
  RAISE NOTICE '   - Created indexes for performance';
END $$;
