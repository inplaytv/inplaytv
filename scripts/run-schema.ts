import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runSchema() {
  console.log('📋 Reading schema file...');
  const schemaPath = path.join(__dirname, 'create-player-round-stats-schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  console.log('🔗 Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Split schema into individual statements (split by semicolon)
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (stmt.length < 10) continue; // Skip tiny statements
    
    try {
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: stmt + ';' });
      
      if (error) {
        console.error(`❌ Error on statement ${i + 1}:`, error.message);
        console.log('Statement:', stmt.substring(0, 100) + '...');
      } else {
        console.log(`✅ Success`);
      }
    } catch (err: any) {
      console.error(`❌ Exception:`, err.message);
    }
  }

  console.log('\n✅ Schema execution complete!');
}

runSchema().catch(console.error);
