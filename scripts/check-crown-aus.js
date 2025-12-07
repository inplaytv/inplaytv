require('dotenv').config({ path: require('path').join(__dirname, '..', 'apps', 'admin', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data: tournament } = await client
    .from('tournaments')
    .select('*')
    .eq('slug', 'crown-australian-open')
    .single();
  
  console.log('=== CROWN AUSTRALIAN OPEN ===');
  console.log(JSON.stringify(tournament, null, 2));
})().catch(console.error);
