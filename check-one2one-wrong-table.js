require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkWrongOnes() {
  console.log('\n=== CHECKING ONE 2 ONE INSTANCES IN WRONG TABLE ===\n');
  
  // Check for competitions with NULL competition_type_id
  const { data, error } = await supabase
    .from('tournament_competitions')
    .select('id, tournament_id, competition_type_id, rounds_covered, status, created_at')
    .is('competition_type_id', null);
  
  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  console.log(`Found ${data.length} competitions with NULL competition_type_id:`);
  console.table(data);
  
  // Also check for competitions with rounds_covered NOT NULL
  const { data: roundsCovered } = await supabase
    .from('tournament_competitions')
    .select('id, tournament_id, competition_type_id, rounds_covered, status, created_at')
    .not('rounds_covered', 'is', null);
  
  console.log(`\nFound ${roundsCovered?.length || 0} competitions with rounds_covered set:`);
  console.table(roundsCovered);
  
  process.exit(0);
}

checkWrongOnes();
