const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  // Try to get one golfer with all columns
  const { data, error } = await supabase
    .from('golfers')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n✅ Golfers table columns:\n');
  if (data && data.length > 0) {
    console.log(Object.keys(data[0]).sort());
  }
}

checkSchema();
