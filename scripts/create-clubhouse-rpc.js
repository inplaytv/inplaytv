require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createRpcFunction() {
  console.log('🔧 Creating create_clubhouse_entry RPC function...');
  console.log('');
  
  const functionSql = `
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
  v_new_balance INTEGER;
  v_golfer_id UUID;
  v_pick_order INTEGER := 1;
BEGIN
  -- Get or create wallet
  INSERT INTO clubhouse_wallets (user_id, balance_credits)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_wallet_id;
  
  IF v_wallet_id IS NULL THEN
    SELECT id INTO v_wallet_id FROM clubhouse_wallets WHERE user_id = p_user_id;
  END IF;
  
  -- Deduct credits with row lock
  UPDATE clubhouse_wallets
  SET 
    balance_credits = balance_credits - p_credits,
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
    -p_credits,
    'entry',
    'Competition entry',
    v_new_balance
  );
  
  -- Create entry
  INSERT INTO clubhouse_entries (
    competition_id,
    user_id,
    entry_fee_paid
  )
  VALUES (
    p_competition_id,
    p_user_id,
    p_credits
  )
  RETURNING id INTO v_entry_id;
  
  -- Insert picks
  FOREACH v_golfer_id IN ARRAY p_golfer_ids
  LOOP
    INSERT INTO clubhouse_entry_picks (
      entry_id,
      golfer_id,
      is_captain,
      pick_order
    )
    VALUES (
      v_entry_id,
      v_golfer_id,
      v_golfer_id = p_captain_id,
      v_pick_order
    );
    
    v_pick_order := v_pick_order + 1;
  END LOOP;
  
  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: functionSql });
  
  if (error) {
    console.log('⚠️  Direct execution failed, trying manual SQL...');
    console.log('');
    console.log('📋 COPY THIS SQL AND RUN IN SUPABASE SQL EDITOR:');
    console.log('');
    console.log(functionSql);
    console.log('');
    process.exit(1);
  }
  
  console.log('✅ Function created successfully!');
  console.log('');
  console.log('🧪 Testing function...');
  
  // Test if function exists
  const { data: testData, error: testError } = await supabase.rpc('create_clubhouse_entry', {
    p_user_id: '00000000-0000-0000-0000-000000000000',
    p_competition_id: '00000000-0000-0000-0000-000000000000',
    p_golfer_ids: [],
    p_captain_id: '00000000-0000-0000-0000-000000000000',
    p_credits: 0
  });
  
  if (testError && !testError.message.includes('Insufficient credits')) {
    console.log('❌ Function test failed:', testError.message);
  } else {
    console.log('✅ Function is working!');
  }
}

createRpcFunction();
