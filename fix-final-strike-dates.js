require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixFinalStrike() {
  console.log('🔧 Fixing Final Strike Competition Dates\n');
  
  const finalStrikeId = '449cd8e8-5999-44c6-a809-55d977f2593f';
  const correctStartAt = '2026-01-02T07:20:00+00:00';
  const correctRegCloseAt = '2026-01-02T07:05:00+00:00';
  
  console.log('Updating:');
  console.log('  Competition ID:', finalStrikeId);
  console.log('  New start_at:', correctStartAt, '(Round 4 tee time)');
  console.log('  New reg_close_at:', correctRegCloseAt, '(15 mins before)');
  console.log('');
  
  const { data, error } = await supabase
    .from('tournament_competitions')
    .update({
      start_at: correctStartAt,
      reg_close_at: correctRegCloseAt,
    })
    .eq('id', finalStrikeId)
    .select()
    .single();
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('✅ Successfully updated Final Strike!');
  console.log('');
  console.log('Verification:');
  console.log('  start_at:', data.start_at);
  console.log('  reg_close_at:', data.reg_close_at);
  console.log('');
  console.log('🎉 Final Strike will now show "REGISTRATION OPEN" status');
  console.log('   and appear in the tournament competitions slider!');
}

fixFinalStrike().catch(console.error);
