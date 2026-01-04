require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function ensureWalletsExist() {
  console.log('🔍 Checking for users without wallets...\n');

  // Get all users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
    return;
  }

  console.log(`📊 Found ${users.length} total users\n`);

  // Check each user's wallet
  for (const user of users) {
    const { data: wallet, error: walletError } = await supabase
      .from('clubhouse_wallets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (walletError) {
      console.error(`❌ Error checking wallet for ${user.email}:`, walletError);
      continue;
    }

    if (!wallet) {
      console.log(`➕ Creating wallet for ${user.email}...`);
      
      // Create wallet with 0 credits
      const { error: createError } = await supabase
        .from('clubhouse_wallets')
        .insert({
          user_id: user.id,
          credits: 0
        });

      if (createError) {
        console.error(`  ❌ Failed:`, createError.message);
      } else {
        console.log(`  ✅ Wallet created with 0 credits`);
      }
    } else {
      console.log(`✓ ${user.email} - ${wallet.credits} credits`);
    }
  }

  console.log('\n✅ Done!');
}

ensureWalletsExist().catch(console.error);
