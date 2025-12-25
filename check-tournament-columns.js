require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('name', 'THE THANET OPEN')
    .single();
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('\n=== Tournament Date Fields ===');
    Object.keys(data).sort().forEach(key => {
      if (key.includes('round') || key.includes('tee') || key.includes('reg') || key.includes('date')) {
        console.log(`${key}: ${data[key]}`);
      }
    });
  }
}

check();
