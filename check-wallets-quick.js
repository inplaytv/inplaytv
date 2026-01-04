require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkWallets() {
  const { data, error } = await supabase
    .from('clubhouse_wallets')
    .select('*')
    .order('credits', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📊 CLUBHOUSE WALLETS:');
  console.log('========================');
  data.forEach(wallet => {
    console.log(`User: ${wallet.user_id}`);
    console.log(`Credits: ${wallet.credits}`);
    console.log(`Updated: ${wallet.updated_at}`);
    console.log('---');
  });
}

checkWallets();
