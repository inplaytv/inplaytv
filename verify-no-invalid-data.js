require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkForInvalidData() {
  console.log('\n=== CHECKING FOR INVALID DATA IN TOURNAMENT_COMPETITIONS ===\n');
  
  // Check for records with NULL competition_type_id (SHOULD BE ZERO)
  const { data: nullTypeId } = await supabase
    .from('tournament_competitions')
    .select('*')
    .is('competition_type_id', null);
  
  console.log(`Records with NULL competition_type_id: ${nullTypeId.length}`);
  if (nullTypeId.length > 0) {
    console.log('❌ FOUND INVALID RECORDS:');
    console.table(nullTypeId);
  }
  
  // Check for records with rounds_covered set (SHOULD BE ZERO)
  const { data: hasRoundsCovered } = await supabase
    .from('tournament_competitions')
    .select('*')
    .not('rounds_covered', 'is', null);
  
  console.log(`\nRecords with rounds_covered set: ${hasRoundsCovered.length}`);
  if (hasRoundsCovered.length > 0) {
    console.log('❌ FOUND INVALID RECORDS:');
    console.table(hasRoundsCovered);
  }
  
  if (nullTypeId.length === 0 && hasRoundsCovered.length === 0) {
    console.log('\n✅ NO INVALID DATA FOUND - All records are correct!');
  } else {
    console.log(`\n❌ TOTAL INVALID RECORDS: ${nullTypeId.length + hasRoundsCovered.length}`);
    console.log('\nDo you want me to delete these invalid records? (Y/N)');
  }
  
  process.exit(0);
}

checkForInvalidData();
