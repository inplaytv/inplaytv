require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function verifyDatabaseConnection() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('\n=== VERIFYING DATABASE CONNECTION ===\n');
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Using Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Yes' : 'No');

  // List all tables we can access
  const { data: tables, error } = await supabase
    .from('pg_tables')
    .select('tablename')
    .eq('schemaname', 'public')
    .order('tablename');

  if (error) {
    console.error('\n❌ Error listing tables:', error);
  } else {
    console.log('\n📋 Available tables in public schema:\n');
    tables?.forEach(t => console.log(`   • ${t.tablename}`));
  }

  // Try direct SQL query for competitions
  console.log('\n\n=== TRYING DIRECT SQL QUERY ===\n');
  
  const { data: sqlResult, error: sqlError } = await supabase
    .rpc('exec_sql', { 
      sql: 'SELECT COUNT(*) as count FROM tournament_competitions' 
    })
    .single();

  if (sqlError) {
    console.log('RPC not available, trying alternative...\n');
    
    // Try alternative approach
    const { count, error: countError } = await supabase
      .from('tournament_competitions')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error:', countError);
    } else {
      console.log(`✓ tournament_competitions count: ${count}`);
    }
  } else {
    console.log(`✓ SQL query result: ${sqlResult.count} competitions`);
  }

  // Check if there's a view or different schema
  const { data: views } = await supabase
    .from('pg_views')
    .select('viewname')
    .eq('schemaname', 'public');

  if (views && views.length > 0) {
    console.log('\n📊 Available views:\n');
    views.forEach(v => console.log(`   • ${v.viewname}`));
  }
}

verifyDatabaseConnection().catch(console.error);
