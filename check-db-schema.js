// Check tournament_golfer_scores schema and data
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/golf/.env.local' });

async function checkDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
    console.log('Key:', supabaseKey ? 'Found' : 'Missing');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const tournamentId = 'f091f409-8e88-437a-a97a-342b8f3c0ba0';
  
  console.log('\n📊 Checking for tournament scoring tables...\n');
  
  // First, try common table name patterns
  const tableNames = [
    'tournament_golfer_scores',
    'tournament_golfers',
    'tournament_scores',
    'golfer_scores',
    'scores'
  ];
  
  for (const tableName of tableNames) {
    console.log(`Trying table: ${tableName}...`);
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (!error) {
      console.log(`✅ Found table: ${tableName}`);
      console.log('Columns:', Object.keys(data[0] || {}).join(', '));
    }
  }
  
  // Now check tournament_golfers specifically
  console.log('\n📊 Checking tournament_golfers table...\n');
  
  const { data, error } = await supabase
    .from('tournament_golfers')
    .select('*')
    .eq('tournament_id', tournamentId)
    .limit(3);
  
  if (error) {
    console.error('❌ Error querying database:', error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('⚠️  No records found for tournament:', tournamentId);
    return;
  }
  
  console.log(`✅ Found ${data.length} records\n`);
  
  // Show the first record's structure
  const firstRecord = data[0];
  console.log('📋 Table Columns:');
  console.log('─────────────────────────────────────');
  Object.keys(firstRecord).sort().forEach(key => {
    const value = firstRecord[key];
    const type = typeof value;
    const display = value === null ? 'NULL' : 
                   type === 'string' ? `"${value.substring(0, 50)}"` :
                   JSON.stringify(value);
    console.log(`  ${key.padEnd(25)} ${type.padEnd(10)} ${display}`);
  });
  
  console.log('\n🎯 Looking for round score columns:');
  console.log('─────────────────────────────────────');
  
  const roundColumns = ['r1', 'r2', 'r3', 'r4', 'round_1', 'round_2', 'round_3', 'round_4', 'round1', 'round2', 'round3', 'round4'];
  const found = roundColumns.filter(col => col in firstRecord);
  
  if (found.length > 0) {
    console.log('✅ Found round columns:', found.join(', '));
    console.log('\n📊 Sample data for found columns:');
    data.forEach((record, i) => {
      console.log(`\n  Record ${i + 1}:`);
      found.forEach(col => {
        console.log(`    ${col}: ${record[col] === null ? 'NULL' : record[col]}`);
      });
    });
  } else {
    console.log('❌ No round score columns found!');
    console.log('   Expected one of:', roundColumns.join(', '));
  }
  
  console.log('\n📈 Total Score and Status:');
  console.log('─────────────────────────────────────');
  data.forEach((record, i) => {
    console.log(`  Record ${i + 1}:`);
    console.log(`    total_score: ${record.total_score}`);
    console.log(`    thru: ${record.thru}`);
    console.log(`    status: ${record.status}`);
    console.log(`    position: ${record.position}`);
  });
}

checkDatabase().catch(console.error);
