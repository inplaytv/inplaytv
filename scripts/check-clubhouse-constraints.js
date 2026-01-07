require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConstraints() {
  console.log('🔍 Checking clubhouse_entries constraints...\n');
  
  // Query for constraints on clubhouse_entries
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT 
        con.conname AS constraint_name,
        con.contype AS constraint_type,
        CASE con.contype
          WHEN 'p' THEN 'PRIMARY KEY'
          WHEN 'u' THEN 'UNIQUE'
          WHEN 'f' THEN 'FOREIGN KEY'
          WHEN 'c' THEN 'CHECK'
        END AS constraint_type_name,
        pg_get_constraintdef(con.oid) AS definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'clubhouse_entries'
      ORDER BY con.conname;
    `
  });
  
  if (error) {
    console.log('❌ Error querying constraints:', error.message);
    console.log('\n📋 Try this SQL in Supabase SQL Editor instead:\n');
    console.log(`
SELECT 
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  CASE con.contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'c' THEN 'CHECK'
  END AS constraint_type_name,
  pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'clubhouse_entries'
ORDER BY con.conname;
    `);
    return;
  }
  
  console.log('Found constraints:');
  console.log(JSON.stringify(data, null, 2));
  
  // Check specifically for UNIQUE constraint on (competition_id, user_id)
  const uniqueConstraint = data.find(c => 
    c.constraint_type === 'u' && 
    c.definition.includes('competition_id') && 
    c.definition.includes('user_id')
  );
  
  if (uniqueConstraint) {
    console.log('\n⚠️  FOUND UNIQUE CONSTRAINT:');
    console.log('Name:', uniqueConstraint.constraint_name);
    console.log('Definition:', uniqueConstraint.definition);
    console.log('\n🔧 To allow multiple entries per user, run this SQL:\n');
    console.log(`ALTER TABLE clubhouse_entries DROP CONSTRAINT ${uniqueConstraint.constraint_name};`);
  } else {
    console.log('\n✅ No UNIQUE constraint found on (competition_id, user_id)');
    console.log('   Users CAN enter the same competition multiple times!');
  }
}

checkConstraints();
