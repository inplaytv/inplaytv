require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConstraint() {
  console.log('🔍 Checking clubhouse_events table constraint...\n');

  // Get the table definition
  const { data, error } = await supabase
    .rpc('exec_sql', { 
      query: `
        SELECT 
          pg_get_constraintdef(c.oid) as constraint_def
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'clubhouse_events' 
          AND c.conname = 'valid_date_range'
      `
    });

  if (error) {
    console.log('Could not fetch via RPC, trying direct query...');
    
    // Try alternative approach
    const { data: cols, error: e2 } = await supabase
      .from('clubhouse_events')
      .select('*')
      .limit(1);
    
    if (e2) {
      console.log('Error:', e2);
    } else {
      console.log('Sample event columns:', cols ? Object.keys(cols[0] || {}) : 'none');
    }
  } else {
    console.log('Constraint Definition:', data);
  }

  // Show what a valid update should look like
  console.log('\n📋 Valid date range should be:');
  console.log('  1. registration_opens_at < registration_closes_at');
  console.log('  2. registration_closes_at <= start_date');
  console.log('  3. start_date < end_date');
}

checkConstraint().then(() => process.exit(0));
