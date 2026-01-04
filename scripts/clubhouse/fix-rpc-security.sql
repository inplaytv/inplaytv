-- Fix: Make create_clubhouse_entry run with creator's permissions (bypasses RLS)
-- This allows the RPC to read/write wallet tables even with RLS enabled
-- Run this in Supabase SQL Editor

DROP FUNCTION IF EXISTS create_clubhouse_entry(UUID, UUID, UUID[], UUID, INTEGER);

CREATE OR REPLACE FUNCTION create_clubhouse_entry(
  p_user_id UUID,
  p_competition_id UUID,
  p_golfer_ids UUID[],
  p_captain_id UUID,
  p_credits INTEGER
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER  -- <-- This is the fix! Runs with owner's permissions, bypasses RLS
SET search_path = public
AS $$
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
$$;

-- Verify the function exists
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  provolatile as volatility
FROM pg_proc 
WHERE proname = 'create_clubhouse_entry';

-- Expected output: is_security_definer should be 't' (true)
