-- Add missing RPC function for credit management
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

-- Add create_clubhouse_entry function with correct column names
DROP FUNCTION IF EXISTS create_clubhouse_entry(UUID, UUID, UUID[], UUID, INTEGER);

CREATE OR REPLACE FUNCTION create_clubhouse_entry(
  p_user_id UUID,
  p_competition_id UUID,
  p_golfer_ids UUID[],
  p_captain_id UUID,
  p_credits INTEGER
) RETURNS UUID AS $$
DECLARE
  v_entry_id UUID;
  v_wallet_id UUID;
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
  
  -- Get wallet and check balance (with row lock)
  SELECT id, balance_credits INTO v_wallet_id, v_balance
  FROM clubhouse_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF v_balance IS NULL OR v_balance < p_credits THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  -- Create entry
  INSERT INTO clubhouse_entries (user_id, competition_id, entry_fee_paid)
  VALUES (p_user_id, p_competition_id, p_credits)
  RETURNING id INTO v_entry_id;
  
  -- Create picks
  FOR i IN 1..array_length(p_golfer_ids, 1) LOOP
    INSERT INTO clubhouse_entry_picks (entry_id, golfer_id, is_captain, pick_order)
    VALUES (v_entry_id, p_golfer_ids[i], p_golfer_ids[i] = p_captain_id, i);
  END LOOP;
  
  -- Deduct credits
  UPDATE clubhouse_wallets
  SET balance_credits = balance_credits - p_credits, updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log transaction
  INSERT INTO clubhouse_credit_transactions (
    wallet_id, user_id, amount_credits, transaction_type, 
    description, balance_after
  )
  VALUES (
    v_wallet_id, p_user_id, -p_credits, 'entry', 
    'Entry: ' || v_competition_name, v_balance - p_credits
  );
  
  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
