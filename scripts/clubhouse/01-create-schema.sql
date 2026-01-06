-- Clubhouse System Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- TABLES
-- ============================================

-- Clubhouse events (like tournaments)
CREATE TABLE IF NOT EXISTS clubhouse_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  location TEXT,
  
  -- Event dates
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  
  -- Round tee times (for competition scheduling)
  round1_tee_time TIMESTAMPTZ,
  round2_tee_time TIMESTAMPTZ,
  round3_tee_time TIMESTAMPTZ,
  round4_tee_time TIMESTAMPTZ,
  
  -- Registration timing (source of truth)
  registration_opens_at TIMESTAMPTZ NOT NULL,
  registration_closes_at TIMESTAMPTZ NOT NULL,
  
  -- Optional link to InPlay tournament for golfer sync
  linked_tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  
  -- Status (auto-calculated by trigger)
  status TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'open', 'active', 'completed')),
  
  -- Metadata
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validation
  CONSTRAINT valid_date_range CHECK (end_date > start_date),
  CONSTRAINT valid_registration_window CHECK (
    registration_closes_at > registration_opens_at AND
    registration_closes_at <= end_date  -- Closes before event ENDS (last round tee-off)
  )
);

-- Add columns that might be missing from previous schema versions
ALTER TABLE clubhouse_events 
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE clubhouse_events 
  ADD COLUMN IF NOT EXISTS registration_opens_at TIMESTAMPTZ;

ALTER TABLE clubhouse_events 
  ADD COLUMN IF NOT EXISTS registration_closes_at TIMESTAMPTZ;

-- Update NULL values for new columns
UPDATE clubhouse_events 
SET 
  registration_opens_at = COALESCE(registration_opens_at, start_date - INTERVAL '7 days'),
  registration_closes_at = COALESCE(registration_closes_at, start_date - INTERVAL '1 hour')
WHERE registration_opens_at IS NULL OR registration_closes_at IS NULL;

-- Now make them NOT NULL
ALTER TABLE clubhouse_events 
  ALTER COLUMN registration_opens_at SET NOT NULL;

ALTER TABLE clubhouse_events 
  ALTER COLUMN registration_closes_at SET NOT NULL;

-- Clubhouse competitions
CREATE TABLE IF NOT EXISTS clubhouse_competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES clubhouse_events(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Which rounds this competition covers (e.g., [1,2,3,4] or [1] or [2])
  rounds_covered INTEGER[] NOT NULL,
  
  -- Pricing in credits (whole numbers, not pennies)
  entry_credits INTEGER NOT NULL CHECK (entry_credits >= 0),
  prize_credits INTEGER CHECK (prize_credits >= 0),
  
  -- Capacity
  max_entries INTEGER NOT NULL DEFAULT 100 CHECK (max_entries > 0),
  
  -- Golfer group (which golfers can be selected)
  assigned_golfer_group_id UUID REFERENCES golfer_groups(id) ON DELETE SET NULL,
  
  -- Timing (copied from event, auto-synced by trigger)
  opens_at TIMESTAMPTZ NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validation
  CONSTRAINT valid_timing CHECK (
    closes_at > opens_at AND
    starts_at >= closes_at
  )
);

-- User credit wallets
CREATE TABLE IF NOT EXISTS clubhouse_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit transaction history
CREATE TABLE IF NOT EXISTS clubhouse_credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive = add, negative = deduct
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  reason TEXT NOT NULL,
  reference_id UUID, -- entry_id, payment_id, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entries
CREATE TABLE IF NOT EXISTS clubhouse_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID NOT NULL REFERENCES clubhouse_competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Picks (using tournament_golfers for validation)
  golfer_ids UUID[] NOT NULL,
  captain_id UUID NOT NULL,
  
  -- Payment
  credits_paid INTEGER NOT NULL CHECK (credits_paid >= 0),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'withdrawn', 'disqualified')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validation
  CONSTRAINT six_golfers CHECK (array_length(golfer_ids, 1) = 6),
  CONSTRAINT captain_in_team CHECK (captain_id = ANY(golfer_ids)),
  CONSTRAINT unique_entry_per_user UNIQUE(competition_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clubhouse_events_status ON clubhouse_events(status);
CREATE INDEX IF NOT EXISTS idx_clubhouse_events_slug ON clubhouse_events(slug);
CREATE INDEX IF NOT EXISTS idx_clubhouse_competitions_event ON clubhouse_competitions(event_id);
CREATE INDEX IF NOT EXISTS idx_clubhouse_entries_competition ON clubhouse_entries(competition_id);
CREATE INDEX IF NOT EXISTS idx_clubhouse_entries_user ON clubhouse_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_clubhouse_credit_txn_user ON clubhouse_credit_transactions(user_id);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Function: Auto-update event status based on dates
CREATE OR REPLACE FUNCTION update_clubhouse_event_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.status := CASE
    WHEN NOW() < NEW.registration_opens_at THEN 'upcoming'
    WHEN NOW() >= NEW.registration_opens_at AND NOW() < NEW.start_date THEN 'open'
    WHEN NOW() >= NEW.start_date AND NOW() < NEW.end_date THEN 'active'
    ELSE 'completed'
  END;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clubhouse_event_status_auto_update ON clubhouse_events;
CREATE TRIGGER clubhouse_event_status_auto_update
  BEFORE INSERT OR UPDATE OF registration_opens_at, start_date, end_date
  ON clubhouse_events
  FOR EACH ROW
  EXECUTE FUNCTION update_clubhouse_event_status();

-- Function: Auto-sync competition timing when event timing changes
-- ⚠️ REMOVED 2026-01-06 - Incompatible with round-specific competition timing
-- See: CLUBHOUSE-TIMING-TRIGGER-ANALYSIS.md for full explanation
--
-- This trigger was designed assuming all competitions share same timing,
-- but testing revealed Clubhouse has 5 competitions per event with
-- different round-specific timing (Round 1 closes at round1_tee_time - 15min,
-- Round 2 closes at round2_tee_time - 15min, etc.)
--
-- Timing is now handled correctly in API routes:
--   - apps/golf/src/app/api/clubhouse/events/route.ts (POST)
--   - apps/golf/src/app/api/clubhouse/events/[id]/route.ts (PUT)
--
/*
CREATE OR REPLACE FUNCTION sync_clubhouse_competition_timing()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clubhouse_competitions
  SET 
    opens_at = NEW.registration_opens_at,
    closes_at = NEW.registration_closes_at,
    starts_at = NEW.start_date
  WHERE event_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clubhouse_event_timing_sync ON clubhouse_events;
CREATE TRIGGER clubhouse_event_timing_sync
  AFTER UPDATE OF registration_opens_at, registration_closes_at, start_date
  ON clubhouse_events
  FOR EACH ROW
  EXECUTE FUNCTION sync_clubhouse_competition_timing();
*/

-- Function: Initialize wallet for new users
CREATE OR REPLACE FUNCTION init_clubhouse_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO clubhouse_wallets (user_id, credits)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clubhouse_user_wallet_init ON auth.users;
CREATE TRIGGER clubhouse_user_wallet_init
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION init_clubhouse_wallet();

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Function: Apply credits (atomic operation)
CREATE OR REPLACE FUNCTION apply_clubhouse_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_reference_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Update wallet (with row lock)
  UPDATE clubhouse_wallets
  SET 
    credits = credits + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING credits INTO v_new_balance;
  
  -- If wallet doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO clubhouse_wallets (user_id, credits)
    VALUES (p_user_id, GREATEST(p_amount, 0))
    RETURNING credits INTO v_new_balance;
  END IF;
  
  -- Check for negative balance
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  -- Log transaction
  INSERT INTO clubhouse_credit_transactions (user_id, amount, balance_after, reason, reference_id)
  VALUES (p_user_id, p_amount, v_new_balance, p_reason, p_reference_id);
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- Function: Create entry with atomic payment
CREATE OR REPLACE FUNCTION create_clubhouse_entry(
  p_user_id UUID,
  p_competition_id UUID,
  p_golfer_ids UUID[],
  p_captain_id UUID,
  p_credits INTEGER
) RETURNS UUID AS $$
DECLARE
  v_entry_id UUID;
  v_balance INTEGER;
  v_competition_name TEXT;
BEGIN
  -- Validate array length
  IF array_length(p_golfer_ids, 1) != 6 THEN
    RAISE EXCEPTION 'Must select exactly 6 golfers';
  END IF;
  
  -- Validate captain in team
  IF NOT (p_captain_id = ANY(p_golfer_ids)) THEN
    RAISE EXCEPTION 'Captain must be one of the 6 golfers';
  END IF;
  
  -- Get competition name for transaction log
  SELECT name INTO v_competition_name
  FROM clubhouse_competitions
  WHERE id = p_competition_id;
  
  -- Check balance (with row lock)
  SELECT credits INTO v_balance
  FROM clubhouse_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF v_balance IS NULL OR v_balance < p_credits THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  -- Create entry
  INSERT INTO clubhouse_entries (user_id, competition_id, golfer_ids, captain_id, credits_paid)
  VALUES (p_user_id, p_competition_id, p_golfer_ids, p_captain_id, p_credits)
  RETURNING id INTO v_entry_id;
  
  -- Deduct credits
  UPDATE clubhouse_wallets
  SET 
    credits = credits - p_credits,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log transaction
  INSERT INTO clubhouse_credit_transactions (user_id, amount, balance_after, reason, reference_id)
  VALUES (p_user_id, -p_credits, v_balance - p_credits, 'Entry: ' || v_competition_name, v_entry_id);
  
  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE clubhouse_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubhouse_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubhouse_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubhouse_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubhouse_entries ENABLE ROW LEVEL SECURITY;

-- Events: Everyone can read visible events
DROP POLICY IF EXISTS "Public can view visible events" ON clubhouse_events;
CREATE POLICY "Public can view visible events"
  ON clubhouse_events FOR SELECT
  USING (is_visible = true);

-- Competitions: Everyone can read competitions for visible events
DROP POLICY IF EXISTS "Public can view competitions" ON clubhouse_competitions;
CREATE POLICY "Public can view competitions"
  ON clubhouse_competitions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clubhouse_events
      WHERE clubhouse_events.id = clubhouse_competitions.event_id
      AND clubhouse_events.is_visible = true
    )
  );

-- Wallets: Users can only see their own wallet
DROP POLICY IF EXISTS "Users can view own wallet" ON clubhouse_wallets;
CREATE POLICY "Users can view own wallet"
  ON clubhouse_wallets FOR SELECT
  USING (auth.uid() = user_id);

-- Transactions: Users can only see their own transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON clubhouse_credit_transactions;
CREATE POLICY "Users can view own transactions"
  ON clubhouse_credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Entries: Users can view their own entries
DROP POLICY IF EXISTS "Users can view own entries" ON clubhouse_entries;
CREATE POLICY "Users can view own entries"
  ON clubhouse_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Entries: Users can view all entries in competitions they're in (for leaderboard)
DROP POLICY IF EXISTS "Users can view entries in their competitions" ON clubhouse_entries;
CREATE POLICY "Users can view entries in their competitions"
  ON clubhouse_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clubhouse_entries my_entry
      WHERE my_entry.competition_id = clubhouse_entries.competition_id
      AND my_entry.user_id = auth.uid()
    )
  );

-- ============================================
-- INITIAL DATA
-- ============================================

-- Create a test event (optional - comment out if not needed)
-- INSERT INTO clubhouse_events (name, slug, description, location, start_date, end_date, registration_opens_at, registration_closes_at)
-- VALUES (
--   'Test Championship',
--   'test-championship',
--   'A test event to verify the system works',
--   'Test Location',
--   NOW() + INTERVAL '7 days',
--   NOW() + INTERVAL '10 days',
--   NOW(),
--   NOW() + INTERVAL '6 days'
-- );

-- ============================================
-- VERIFICATION
-- ============================================

-- Check that all tables were created
DO $$
BEGIN
  RAISE NOTICE 'Clubhouse schema created successfully!';
  RAISE NOTICE 'Tables: clubhouse_events, clubhouse_competitions, clubhouse_wallets, clubhouse_credit_transactions, clubhouse_entries';
END $$;
