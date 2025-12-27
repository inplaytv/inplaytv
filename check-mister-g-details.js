require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMisterG() {
  console.log('🔍 Checking Mister G\'s Open details...\n');
  
  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select('*')
    .ilike('name', '%Mister%')
    .single();
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  if (!tournament) {
    console.log('❌ Tournament not found');
    return;
  }
  
  console.log('✅ FOUND Tournament:');
  console.log('===================\n');
  console.log('Name:', tournament.name);
  console.log('Status:', tournament.status);
  console.log('Image URL:', tournament.image_url);
  console.log('Start Date:', tournament.start_date);
  console.log('End Date:', tournament.end_date);
  console.log('Registration Opens:', tournament.registration_opens_at);
  console.log('Registration Closes:', tournament.registration_closes_at);
  console.log('\nFull data:');
  console.log(JSON.stringify(tournament, null, 2));
}

checkMisterG().then(() => process.exit(0));
