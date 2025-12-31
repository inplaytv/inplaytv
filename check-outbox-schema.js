require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOutboxSchema() {
  console.log('🔍 Checking email_outbox table structure...\n');

  // Try to select all columns from an empty query to see what columns exist
  const { data, error } = await supabase
    .from('email_outbox')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ Found email_outbox columns:');
    Object.keys(data[0]).forEach(col => {
      console.log(`   - ${col}: ${typeof data[0][col]}`);
    });
  } else {
    console.log('⚠️  No data in email_outbox table yet');
    console.log('   Cannot determine columns from empty table');
    console.log('\n💡 Try checking the table schema in Supabase Dashboard');
  }
}

checkOutboxSchema().catch(console.error);
