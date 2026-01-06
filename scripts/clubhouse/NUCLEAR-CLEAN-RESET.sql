-- ============================================================================
-- NUCLEAR CLEANUP: Complete Clubhouse Database Reset
-- ============================================================================
-- PURPOSE: Remove ALL old references, constraints, and data from Clubhouse system
-- WARNING: This will DELETE ALL CLUBHOUSE DATA permanently
-- 
-- WHY: Old schema constraints and data keep causing issues. This ensures
--      a completely clean slate with ONLY the correct schema.
-- ============================================================================

-- Step 1: DROP ALL CLUBHOUSE TABLES (CASCADE removes all dependencies)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS clubhouse_entry_picks CASCADE;
DROP TABLE IF EXISTS clubhouse_entries CASCADE;
DROP TABLE IF EXISTS clubhouse_competitions CASCADE;
DROP TABLE IF EXISTS clubhouse_credit_transactions CASCADE;
DROP TABLE IF EXISTS clubhouse_wallets CASCADE;
DROP TABLE IF EXISTS clubhouse_events CASCADE;

-- Step 2: DROP ANY LEFTOVER FUNCTIONS/TRIGGERS
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS update_clubhouse_event_status() CASCADE;
DROP FUNCTION IF EXISTS update_clubhouse_competition_status() CASCADE;

-- Step 3: RECREATE TABLES WITH CORRECT SCHEMA
-- ----------------------------------------------------------------------------

-- Events Table (CORRECT constraint: closes_at <= end_date)
CREATE TABLE clubhouse_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  venue TEXT,
  location TEXT,
  prize_fund DECIMAL(15,2),
  currency TEXT DEFAULT 'USD',
  
  -- Tournament linking (for DataGolf integration)
  linked_tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
  
  -- Dates
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  registration_opens_at TIMESTAMPTZ NOT NULL,
  registration_closes_at TIMESTAMPTZ NOT NULL,
  
  -- Round Tee Times
  round1_tee_time TIMESTAMPTZ,
  round2_tee_time TIMESTAMPTZ,
  round3_tee_time TIMESTAMPTZ,
  round4_tee_time TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'open', 'active', 'completed')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- CORRECT Validation Constraints
  CONSTRAINT valid_date_range CHECK (end_date > start_date),
  CONSTRAINT valid_registration_window CHECK (
    registration_closes_at > registration_opens_at AND
    registration_closes_at <= end_date  -- Closes before event ENDS (15min before last round)
  )
);

-- Competitions Table
CREATE TABLE clubhouse_competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES clubhouse_events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Pricing in credits
  entry_credits INTEGER NOT NULL DEFAULT 0 CHECK (entry_credits >= 0),
  
  -- Capacity
  max_entries INTEGER NOT NULL DEFAULT 100 CHECK (max_entries > 0),
  
  -- Prizes
  prize_pool_credits INTEGER DEFAULT 0,
  prize_distribution JSONB,
  
  -- Golfer group assignment (which golfers are available)
  assigned_golfer_group_id UUID REFERENCES golfer_groups(id) ON DELETE SET NULL,
  
  -- Timing (inherited from event)
  opens_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'open', 'active', 'completed')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallets Table
CREATE TABLE clubhouse_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_credits INTEGER NOT NULL DEFAULT 0 CHECK (balance_credits >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Transactions Table (Audit Log)
CREATE TABLE clubhouse_credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES clubhouse_wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_credits INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('topup', 'entry', 'refund', 'prize')),
  description TEXT,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entries Table
CREATE TABLE clubhouse_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competition_id UUID NOT NULL REFERENCES clubhouse_competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_fee_paid INTEGER NOT NULL DEFAULT 0,
  
  -- Scoring
  total_score DECIMAL(10,2) DEFAULT 0,
  position INTEGER,
  prize_credits INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'withdrawn', 'disqualified')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(competition_id, user_id)
);

-- Entry Picks Table
CREATE TABLE clubhouse_entry_picks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES clubhouse_entries(id) ON DELETE CASCADE,
  golfer_id UUID NOT NULL,
  is_captain BOOLEAN DEFAULT FALSE,
  pick_order INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(entry_id, golfer_id),
  UNIQUE(entry_id, pick_order),
  CHECK (pick_order BETWEEN 1 AND 6)
);

-- Step 4: CREATE INDEXES FOR PERFORMANCE
-- ----------------------------------------------------------------------------
CREATE INDEX idx_clubhouse_events_status ON clubhouse_events(status);
CREATE INDEX idx_clubhouse_events_dates ON clubhouse_events(start_date, end_date);
CREATE INDEX idx_clubhouse_competitions_event ON clubhouse_competitions(event_id);
CREATE INDEX idx_clubhouse_competitions_status ON clubhouse_competitions(status);
CREATE INDEX idx_clubhouse_entries_competition ON clubhouse_entries(competition_id);
CREATE INDEX idx_clubhouse_entries_user ON clubhouse_entries(user_id);
CREATE INDEX idx_clubhouse_wallets_user ON clubhouse_wallets(user_id);
CREATE INDEX idx_clubhouse_transactions_wallet ON clubhouse_credit_transactions(wallet_id);
CREATE INDEX idx_clubhouse_picks_entry ON clubhouse_entry_picks(entry_id);

-- Step 5: ENABLE ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
ALTER TABLE clubhouse_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubhouse_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubhouse_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubhouse_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubhouse_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubhouse_entry_picks ENABLE ROW LEVEL SECURITY;

-- Step 6: CREATE RLS POLICIES
-- ----------------------------------------------------------------------------

-- Events: Public read, admin write
DROP POLICY IF EXISTS "Events are publicly readable" ON clubhouse_events;
CREATE POLICY "Events are publicly readable" ON clubhouse_events FOR SELECT USING (true);

-- Competitions: Public read, admin write
DROP POLICY IF EXISTS "Competitions are publicly readable" ON clubhouse_competitions;
CREATE POLICY "Competitions are publicly readable" ON clubhouse_competitions FOR SELECT USING (true);

-- Wallets: Users can view own wallet
DROP POLICY IF EXISTS "Users can view own wallet" ON clubhouse_wallets;
CREATE POLICY "Users can view own wallet" ON clubhouse_wallets FOR SELECT USING (auth.uid() = user_id);

-- Transactions: Users can view own transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON clubhouse_credit_transactions;
CREATE POLICY "Users can view own transactions" ON clubhouse_credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- Entries: Users can view own entries, public can view all for leaderboards
DROP POLICY IF EXISTS "Entries are publicly readable" ON clubhouse_entries;
CREATE POLICY "Entries are publicly readable" ON clubhouse_entries FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own entries" ON clubhouse_entries;
CREATE POLICY "Users can insert own entries" ON clubhouse_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Entry Picks: Public read (for leaderboards), users can insert own
DROP POLICY IF EXISTS "Entry picks are publicly readable" ON clubhouse_entry_picks;
CREATE POLICY "Entry picks are publicly readable" ON clubhouse_entry_picks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own entry picks" ON clubhouse_entry_picks;
CREATE POLICY "Users can insert own entry picks" ON clubhouse_entry_picks 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clubhouse_entries 
      WHERE id = entry_id AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- Function: Apply credits (add or deduct)
CREATE OR REPLACE FUNCTION apply_clubhouse_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_reference_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_wallet_id UUID;
  v_new_balance INTEGER;
BEGIN
  -- Get or create wallet
  INSERT INTO clubhouse_wallets (user_id, balance_credits)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_wallet_id;
  
  -- If wallet already existed, get its id
  IF v_wallet_id IS NULL THEN
    SELECT id INTO v_wallet_id FROM clubhouse_wallets WHERE user_id = p_user_id;
  END IF;
  
  -- Update balance with row lock
  UPDATE clubhouse_wallets
  SET 
    balance_credits = balance_credits + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance_credits INTO v_new_balance;
  
  -- Check for negative balance
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  -- Log transaction
  INSERT INTO clubhouse_credit_transactions (
    wallet_id,
    user_id,
    amount_credits,
    transaction_type,
    description,
    balance_after
  )
  VALUES (
    v_wallet_id,
    p_user_id,
    p_amount,
    CASE 
      WHEN p_amount > 0 THEN 'topup'
      WHEN p_amount < 0 THEN 'entry'
      ELSE 'refund'
    END,
    p_reason,
    v_new_balance
  );
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all tables exist
SELECT 
  'clubhouse_events' as table_name, 
  COUNT(*) as row_count 
FROM clubhouse_events
UNION ALL
SELECT 'clubhouse_competitions', COUNT(*) FROM clubhouse_competitions
UNION ALL
SELECT 'clubhouse_wallets', COUNT(*) FROM clubhouse_wallets
UNION ALL
SELECT 'clubhouse_credit_transactions', COUNT(*) FROM clubhouse_credit_transactions
UNION ALL
SELECT 'clubhouse_entries', COUNT(*) FROM clubhouse_entries
UNION ALL
SELECT 'clubhouse_entry_picks', COUNT(*) FROM clubhouse_entry_picks;

-- Verify constraint is correct
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'clubhouse_events'::regclass
  AND conname = 'valid_registration_window';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ CLUBHOUSE DATABASE RESET COMPLETE';
  RAISE NOTICE '✅ All old references removed';
  RAISE NOTICE '✅ Correct schema installed';
  RAISE NOTICE '✅ Registration closes before END DATE (last round tee-off)';
  RAISE NOTICE '📊 All tables now empty - ready for fresh data';
END $$;
