const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTournamentTours() {
  console.log('Updating tournament tour assignments...\n');

  // Update Nedbank Golf Challenge to euro tour
  const { error: nedbankError } = await supabase
    .from('tournaments')
    .update({ tour: 'euro' })
    .eq('name', 'Nedbank Golf Challenge in honour of Gary Player');

  if (nedbankError) {
    console.error('❌ Error updating Nedbank:', nedbankError);
  } else {
    console.log('✅ Nedbank Golf Challenge → tour: "euro"');
  }

  // Update Crown Australian Open to euro tour
  const { error: crownError } = await supabase
    .from('tournaments')
    .update({ tour: 'euro' })
    .eq('name', 'Crown Australian Open');

  if (crownError) {
    console.error('❌ Error updating Crown Australian Open:', crownError);
  } else {
    console.log('✅ Crown Australian Open → tour: "euro"');
  }

  // Verify changes
  console.log('\n--- Verification ---');
  const { data, error } = await supabase
    .from('tournaments')
    .select('name, tour')
    .in('name', ['Hero World Challenge', 'Nedbank Golf Challenge in honour of Gary Player', 'Crown Australian Open'])
    .order('start_date');

  if (error) {
    console.error('Error:', error);
  } else {
    console.table(data);
  }
}

fixTournamentTours();
