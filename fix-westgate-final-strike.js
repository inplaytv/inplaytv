require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixWestgateFinalStrike() {
  console.log('🔧 Fixing Westgate Final Strike dates\n');
  
  const id = '07af5a27-8fd1-4993-8388-1b4b52034634';
  const correctStartAt = '2026-01-01T06:20:00+00:00';
  const correctRegCloseAt = '2026-01-01T06:05:00+00:00'; // 15 mins before
  
  console.log('Competition ID:', id);
  console.log('Correct start_at:', correctStartAt);
  console.log('Correct reg_close_at:', correctRegCloseAt);
  console.log('');
  
  const { data, error } = await supabase
    .from('tournament_competitions')
    .update({
      start_at: correctStartAt,
      reg_close_at: correctRegCloseAt,
    })
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('✅ Updated successfully!');
  console.log('New values:');
  console.log('  start_at:', data.start_at);
  console.log('  reg_close_at:', data.reg_close_at);
  console.log('');
  console.log('✅ Final Strike should now show "REGISTRATION OPEN"');
}

fixWestgateFinalStrike().catch(console.error);
