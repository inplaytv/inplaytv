require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'public' }, auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  console.log('\n=== INVESTIGATING ROUND TEE TIME COLUMN NAMES ===\n');
  
  // Get a sample tournament to see actual column names
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*')
    .eq('slug', 'northforland-open-tournament')
    .single();
  
  if (!tournament) {
    console.log('❌ Tournament not found');
    return;
  }
  
  // Get all keys from the tournament object
  const allKeys = Object.keys(tournament);
  const roundKeys = allKeys.filter(k => k.toLowerCase().includes('round'));
  
  console.log('All column names containing "round":');
  roundKeys.forEach(k => {
    console.log(`  ${k}: ${tournament[k]}`);
  });
  
  console.log('\n--- Testing Different Column Name Patterns ---');
  
  // Test pattern 1: round_1_start (with underscores)
  console.log('\nPattern 1: round_X_start (underscores)');
  [1, 2, 3, 4].forEach(i => {
    const key = `round_${i}_start`;
    console.log(`  ${key}: ${tournament[key] || 'NOT FOUND'}`);
  });
  
  // Test pattern 2: round1_tee_time (no underscore before number)
  console.log('\nPattern 2: roundX_tee_time (no underscore)');
  [1, 2, 3, 4].forEach(i => {
    const key = `round${i}_tee_time`;
    console.log(`  ${key}: ${tournament[key] || 'NOT FOUND'}`);
  });
  
  // Test pattern 3: round_1_tee_time (with underscores)
  console.log('\nPattern 3: round_X_tee_time (underscores)');
  [1, 2, 3, 4].forEach(i => {
    const key = `round_${i}_tee_time`;
    console.log(`  ${key}: ${tournament[key] || 'NOT FOUND'}`);
  });
  
  console.log('\n=== CORRECT PATTERN ===');
  const correctPattern = roundKeys.find(k => k.includes('round') && tournament[k]);
  if (correctPattern) {
    console.log(`✅ Database uses: ${correctPattern}`);
    
    // Extract pattern
    if (correctPattern.includes('_tee_time')) {
      if (correctPattern.startsWith('round_')) {
        console.log('✅ Format: round_X_tee_time (with underscore before number)');
      } else {
        console.log('✅ Format: roundX_tee_time (no underscore before number)');
      }
    } else if (correctPattern.includes('_start')) {
      console.log('✅ Format: round_X_start');
    }
  }
})();
