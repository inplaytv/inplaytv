const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTournaments() {
  const { data, error } = await supabase
    .from('tournaments')
    .select('id, name, slug, event_id, tour, status')
    .in('name', ['Hero World Challenge', 'Nedbank Golf Challenge in honour of Gary Player', 'Crown Australian Open'])
    .order('start_date');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Tournaments:');
  console.table(data);
}

checkTournaments();
