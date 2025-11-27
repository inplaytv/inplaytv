const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjIxNDcsImV4cCI6MjA3NjA5ODE0N30.f8Z3TYqPIuAvLEpLN1o3AwOEUjQ_3HgDHqKaXdZ8n28';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEntries() {
  console.log('🔍 Checking for competition entries...\n');
  
  // Get all entries
  const { data: entries, error } = await supabase
    .from('competition_entries')
    .select(`
      id,
      entry_name,
      competition_id,
      competitions!inner(
        id,
        competition_types(name)
      )
    `)
    .limit(20);
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`✅ Found ${entries.length} total entries\n`);
  
  entries.forEach(entry => {
    console.log(`📝 Entry: ${entry.entry_name}`);
    console.log(`   Competition ID: ${entry.competition_id}`);
    console.log(`   Competition Type: ${entry.competitions.competition_types.name}`);
    console.log('');
  });
  
  // Group by competition
  const byCompetition = {};
  entries.forEach(entry => {
    const compId = entry.competition_id;
    if (!byCompetition[compId]) {
      byCompetition[compId] = {
        name: entry.competitions.competition_types.name,
        count: 0,
        entries: []
      };
    }
    byCompetition[compId].count++;
    byCompetition[compId].entries.push(entry.entry_name);
  });
  
  console.log('📊 Entries by Competition:\n');
  Object.entries(byCompetition).forEach(([compId, info]) => {
    console.log(`${info.name}: ${info.count} entries`);
    console.log(`   Competition ID: ${compId}`);
    console.log(`   Entries: ${info.entries.join(', ')}`);
    console.log('');
  });
}

checkEntries();
