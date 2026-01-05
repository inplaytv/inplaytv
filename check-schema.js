require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 Checking Database Schema...\n');
  
  // Check tournament_competitions structure
  const { data: tc, error: tcError } = await supabase
    .from('tournament_competitions')
    .select('*')
    .limit(1);
  
  console.log('tournament_competitions columns:', tc && tc[0] ? Object.keys(tc[0]) : 'No data');
  
  // Check if competition_instances exists
  const { data: ci, error: ciError } = await supabase
    .from('competition_instances')
    .select('id')
    .limit(1);
  
  console.log('\ncompetition_instances table exists:', !ciError);
  console.log('  Error if any:', ciError?.message || 'None');
  
  // Check competition_entries structure
  const { data: ce, error: ceError } = await supabase
    .from('competition_entries')
    .select('*')
    .limit(1);
  
  console.log('\ncompetition_entries columns:', ce && ce[0] ? Object.keys(ce[0]) : 'No data');
  
  // Check for competition_format column
  const { data: formats } = await supabase
    .from('tournament_competitions')
    .select('competition_format')
    .limit(5);
  
  console.log('\ncompetition_format values found:', formats?.map(f => f.competition_format) || []);
}

checkSchema().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
