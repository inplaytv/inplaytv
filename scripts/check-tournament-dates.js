const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTournamentDates() {
  const { data, error } = await supabase
    .from('tournaments')
    .select('id, name, slug, start_date, end_date, status, tour')
    .in('name', ['Hero World Challenge', 'Nedbank Golf Challenge in honour of Gary Player', 'Crown Australian Open'])
    .order('start_date');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\nTournament Dates:');
  data.forEach(t => {
    console.log(`\n${t.name}:`);
    console.log(`  Start: ${t.start_date}`);
    console.log(`  End: ${t.end_date}`);
    console.log(`  Status: ${t.status}`);
    console.log(`  Tour: ${t.tour}`);
  });

  const now = new Date();
  console.log(`\nCurrent Date: ${now.toISOString().split('T')[0]}`);
}

checkTournamentDates();
