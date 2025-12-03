const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGolferRankings() {
  const { data, error } = await supabase
    .from('golfers')
    .select('name, world_rank, dg_id')
    .in('name', ['Armitage, Marcus', 'Ayora, Angel', 'Bezuidenhout, Christiaan', 'Hovland, Viktor', 'Scheffler, Scottie'])
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n✅ Golfer World Rankings:\n');
  console.table(data);
}

checkGolferRankings();
