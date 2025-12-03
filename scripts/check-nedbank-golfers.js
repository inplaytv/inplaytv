const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNedbank() {
  console.log('\n🔍 Checking Nedbank Tournament...\n');
  
  // Get tournament details
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*')
    .ilike('name', '%nedbank%')
    .single();
  
  console.log('📋 Tournament:', {
    id: tournament.id,
    name: tournament.name,
    status: tournament.status,
    tour: tournament.tour,
    event_id: tournament.event_id
  });
  
  // Get tournament_golfers count
  const { data: tournamentGolfers, count } = await supabase
    .from('tournament_golfers')
    .select('*, golfers(*)', { count: 'exact' })
    .eq('tournament_id', tournament.id);
  
  console.log(`\n✅ Found ${count} golfers assigned to tournament\n`);
  
  if (tournamentGolfers && tournamentGolfers.length > 0) {
    console.log('First 5 golfers:');
    console.table(tournamentGolfers.slice(0, 5).map(tg => ({
      name: tg.golfers?.name,
      world_rank: tg.golfers?.world_rank,
      salary: tg.golfers?.salary_pennies,
      tg_id: tg.id
    })));
  }
  
  // Check competitions for this tournament
  const { data: competitions } = await supabase
    .from('competitions')
    .select('*')
    .eq('tournament_id', tournament.id);
  
  console.log(`\n🏆 Found ${competitions?.length || 0} competitions\n`);
  
  if (competitions && competitions.length > 0) {
    console.table(competitions.map(c => ({
      id: c.id.substring(0, 8) + '...',
      type: c.competition_type,
      level: c.competition_level,
      status: c.status,
      entry_fee: c.entry_fee_pennies
    })));
  }
}

checkNedbank();
