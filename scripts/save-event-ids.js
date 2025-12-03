const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function saveEventIds() {
  console.log('Saving DataGolf event_id for tournaments...\n');

  // Get event_id from DataGolf for Nedbank
  const nedbankRes = await fetch('https://feeds.datagolf.com/field-updates?tour=euro&file_format=json&key=ac7793fb5f617626ccc418008832');
  const nedbankData = await nedbankRes.json();
  
  console.log(`DataGolf returned: ${nedbankData.event_name} (ID: ${nedbankData.event_id})`);

  // Update Nedbank tournament
  const { error: nedbankError } = await supabase
    .from('tournaments')
    .update({ event_id: nedbankData.event_id.toString() })
    .eq('name', 'Nedbank Golf Challenge in honour of Gary Player');

  if (nedbankError) {
    console.error('❌ Error updating Nedbank:', nedbankError);
  } else {
    console.log(`✅ Saved event_id "${nedbankData.event_id}" to Nedbank Golf Challenge`);
  }

  // Verify
  console.log('\n--- Verification ---');
  const { data, error } = await supabase
    .from('tournaments')
    .select('name, event_id, tour')
    .in('name', ['Hero World Challenge', 'Nedbank Golf Challenge in honour of Gary Player', 'Crown Australian Open'])
    .order('start_date');

  if (error) {
    console.error('Error:', error);
  } else {
    console.table(data);
  }
}

saveEventIds();
