const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimpleUpdate() {
  console.log('\n🧪 Testing simple world_rank update...\n');
  
  // Test 1: Standard .update()
  const { data, error } = await supabase
    .from('golfers')
    .update({ world_rank: 210 })
    .eq('dg_id', 17813)
    .select();

  if (error) {
    console.error('❌ Standard update failed:', error);
  } else {
    console.log('✅ Standard update succeeded:', data);
  }
}

testSimpleUpdate();
