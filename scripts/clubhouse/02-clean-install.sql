-- Clubhouse System - Clean Install
-- Drops existing objects and recreates everything fresh

-- ============================================
-- DROP EXISTING OBJECTS (in reverse dependency order)
-- ============================================

-- Drop policies first
DROP POLICY IF EXISTS "Users can view entries in their competitions" ON clubhouse_entries;
DROP POLICY IF EXISTS "Users can view own entries" ON clubhouse_entries;
DROP POLICY IF EXISTS "Users can view own transactions" ON clubhouse_credit_transactions;
DROP POLICY IF EXISTS "Users can view own wallet" ON clubhouse_wallets;
DROP POLICY IF EXISTS "Public can view competitions" ON clubhouse_competitions;
DROP POLICY IF EXISTS "Public can view visible events" ON clubhouse_events;

-- Drop triggers
DROP TRIGGER IF EXISTS clubhouse_user_wallet_init ON auth.users;
DROP TRIGGER IF EXISTS clubhouse_event_timing_sync ON clubhouse_events;
DROP TRIGGER IF EXISTS clubhouse_event_status_auto_update ON clubhouse_events;

-- Drop functions
DROP FUNCTION IF EXISTS create_clubhouse_entry(UUID, UUID, UUID[], UUID, INTEGER);
DROP FUNCTION IF EXISTS apply_clubhouse_credits(UUID, INTEGER, TEXT, UUID);
DROP FUNCTION IF EXISTS init_clubhouse_wallet();
DROP FUNCTION IF EXISTS sync_clubhouse_competition_timing();
DROP FUNCTION IF EXISTS update_clubhouse_event_status();

-- Drop tables
DROP TABLE IF EXISTS clubhouse_entries CASCADE;
DROP TABLE IF EXISTS clubhouse_credit_transactions CASCADE;
DROP TABLE IF EXISTS clubhouse_wallets CASCADE;
DROP TABLE IF EXISTS clubhouse_competitions CASCADE;
DROP TABLE IF EXISTS clubhouse_events CASCADE;

-- ============================================
-- CREATE TABLES
-- ============================================

-- Events
CREATE TABLE clubhouse_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  location TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  registration_opens_at TIMESTAMPTZ NOT NULL,
  registration_closes_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'open', 'active', 'completed')),
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date),
  CONSTRAINT valid_registration_window CHECK (
    registration_closes_at > registration_opens_at AND
    registration_closes_at <= end_date  -- Closes before event ENDS (last round tee-off)
  )
);

-- Competitions
CREATE TABLE clubhouse_competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES clubhouse_events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  entry_credits INTEGER NOT NULL CHECK (entry_credits >= 0),
  prize_credits INTEGER CHECK (prize_credits >= 0),
  max_entries INTEGER NOT NULL DEFAULT 100 CHECK (max_entries > 0),
  opens_at TIMESTAMPTZ NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_timing CHECK (
    closes_at > opens_at AND
    starts_at >= closes_at
  )
);

-- Wallets
CREATE TABLE clubhouse_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE clubhouse_credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  reason TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entries
CREATE TABLE clubhouse_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID NOT NULL REFERENCES clubhouse_competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  golfer_ids UUID[] NOT NULL,
  captain_id UUID NOT NULL,
  credits_paid INTEGER NOT NULL CHECK (credits_paid >= 0),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'withdrawn', 'disqualified')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT six_golfers CHECK (array_length(golfer_ids, 1) = 6),
  CONSTRAINT captain_in_team CHECK (captain_id = ANY(golfer_ids)),
  CONSTRAINT unique_entry_per_user UNIQUE(competition_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_clubhouse_events_status ON clubhouse_events(status);
CREATE INDEX idx_clubhouse_events_slug ON clubhouse_events(slug);
CREATE INDEX idx_clubhouse_competitions_event ON clubhouse_competitions(event_id);
CREATE INDEX idx_clubhouse_entries_competition ON clubhouse_entries(competition_id);
CREATE INDEX idx_clubhouse_entries_user ON clubhouse_entries(user_id);
CREATE INDEX idx_clubhouse_credit_txn_user ON clubhouse_credit_transactions(user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update event status
CREATE FUNCTION update_clubhouse_event_status()
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

CREATE TRIGGER clubhouse_event_status_auto_update
  BEFORE INSERT OR UPDATE OF registration_opens_at, start_date, end_date
  ON clubhouse_events
  FOR EACH ROW
  EXECUTE FUNCTION update_clubhouse_event_status();

-- Sync competition timing
-- ⚠️ REMOVED 2026-01-06 - See CLUBHOUSE-TIMING-TRIGGER-ANALYSIS.md
-- Trigger incompatible with round-specific competition timing.
-- API routes handle timing correctly instead.
/*
CREATE FUNCTION sync_clubhouse_competition_timing()
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

CREATE TRIGGER clubhouse_event_timing_sync
  AFTER UPDATE OF registration_opens_at, registration_closes_at, start_date
  ON clubhouse_events
  FOR EACH ROW
  EXECUTE FUNCTION sync_clubhouse_competition_timing();
*/

-- Initialize wallet
CREATE FUNCTION init_clubhouse_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO clubhouse_wallets (user_id, credits)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clubhouse_user_wallet_init
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION init_clubhouse_wallet();

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Apply credits
CREATE FUNCTION apply_clubhouse_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_reference_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE clubhouse_wallets
  SET credits = credits + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING credits INTO v_new_balance;
  
  IF NOT FOUND THEN
    INSERT INTO clubhouse_wallets (user_id, credits)
    VALUES (p_user_id, GREATEST(p_amount, 0))
    RETURNING credits INTO v_new_balance;
  END IF;
  
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  INSERT INTO clubhouse_credit_transactions (user_id, amount, balance_after, reason, reference_id)
  VALUES (p_user_id, p_amount, v_new_balance, p_reason, p_reference_id);
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- Create entry
CREATE FUNCTION create_clubhouse_entry(
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
  IF array_length(p_golfer_ids, 1) != 6 THEN
    RAISE EXCEPTION 'Must select exactly 6 golfers';
  END IF;
  
  IF NOT (p_captain_id = ANY(p_golfer_ids)) THEN
    RAISE EXCEPTION 'Captain must be one of the 6 golfers';
  END IF;
  
  SELECT name INTO v_competition_name
  FROM clubhouse_competitions
  WHERE id = p_competition_id;
  
  SELECT credits INTO v_balance
  FROM clubhouse_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF v_balance IS NULL OR v_balance < p_credits THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  INSERT INTO clubhouse_entries (user_id, competition_id, golfer_ids, captain_id, credits_paid)
  VALUES (p_user_id, p_competition_id, p_golfer_ids, p_captain_id, p_credits)
  RETURNING id INTO v_entry_id;
  
  UPDATE clubhouse_wallets
  SET credits = credits - p_credits, updated_at = NOW()
  WHERE user_id = p_user_id;
  
  INSERT INTO clubhouse_credit_transactions (user_id, amount, balance_after, reason, reference_id)
  VALUES (p_user_id, -p_credits, v_balance - p_credits, 'Entry: ' || v_competition_name, v_entry_id);
  
  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE clubhouse_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubhouse_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubhouse_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubhouse_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubhouse_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view visible events"
  ON clubhouse_events FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Public can view competitions"
  ON clubhouse_competitions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clubhouse_events
      WHERE clubhouse_events.id = clubhouse_competitions.event_id
      AND clubhouse_events.is_visible = true
    )
  );

CREATE POLICY "Users can view own wallet"
  ON clubhouse_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions"
  ON clubhouse_credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own entries"
  ON clubhouse_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view entries in their competitions"
  ON clubhouse_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clubhouse_entries my_entry
      WHERE my_entry.competition_id = clubhouse_entries.competition_id
      AND my_entry.user_id = auth.uid()
    )
  );
