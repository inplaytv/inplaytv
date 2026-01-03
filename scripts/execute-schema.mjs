import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

console.log('🏌️ Setting up Clubhouse database...\n');
console.log('⚠️  Please execute the schema manually:\n');
console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard/project/qemosikbhrnstcormhuz');
console.log('2. Go to SQL Editor');
console.log('3. Copy the contents of: scripts\\clubhouse-schema.sql');
console.log('4. Paste and run in the SQL Editor\n');
console.log('Or use psql directly if you have database credentials.\n');

try {
  // Read the schema file
  const schemaPath = join(__dirname, 'clubhouse-schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  
  console.log('📄 Schema contents:\n');
  console.log('─'.repeat(80));
  console.log(schema);
  console.log('─'.repeat(80));
  console.log('\n✨ Copy the above SQL and run it in Supabase SQL Editor\n');
  
} catch (error) {
  console.error('\n❌ Failed to read schema:', error.message);
  process.exit(1);
}
