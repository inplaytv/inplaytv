const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCrownData() {
  console.log('\n🔍 Checking Crown Australian Open data...\n');
  
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name')
    .ilike('name', '%Crown%')
    .single();
  
  console.log('Tournament:', tournament.name);
  console.log('ID:', tournament.id);
  
  // Check tournament_golfers
  const { data: tg, count } = await supabase
    .from('tournament_golfers')
    .select('*, golfers(name)', { count: 'exact' })
    .eq('tournament_id', tournament.id)
    .limit(5);
  
  console.log(`\n✅ tournament_golfers table: ${count} golfers`);
  if (tg && tg.length > 0) {
    console.log('\nFirst 5 golfers:');
    tg.forEach(g => console.log(`  - ${g.golfers?.name || 'Unknown'}`));
  }
}

checkCrownData();
