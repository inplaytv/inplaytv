const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjIxNDcsImV4cCI6MjA3NjA5ODE0N30.6-UaVE6E-Esn8mY4fhbvoQkdw3ZGK8IkwOPieF6gHkc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function finalizeCompetition(competitionId) {
  console.log(`\n🏆 Finalizing Competition: ${competitionId}\n`);

  try {
    // Call the finalize API endpoint
    const response = await fetch(`http://localhost:3002/api/admin/competitions/${competitionId}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    
    console.log('✅ Competition Finalized Successfully!\n');
    console.log('📊 Results Summary:');
    console.log('==================');
    console.log(`Total Entries: ${result.summary?.totalEntries || 'Unknown'}`);
    console.log(`Prize Pool: £${(result.summary?.totalPrizePool || 0).toFixed(2)}`);
    console.log(`Admin Fee: £${(result.summary?.adminFee || 0).toFixed(2)}`);
    console.log(`Distributed: £${(result.summary?.distributedPrize || 0).toFixed(2)}`);
    console.log(`\n🏆 Winner: ${result.summary?.winner?.username || 'Unknown'}`);
    console.log(`   Points: ${result.summary?.winner?.points || 0}`);
    console.log(`   Prize: £${(result.summary?.winner?.prize || 0).toFixed(2)}`);
    if (result.summary?.top3 && result.summary.top3.length > 0) {
      console.log(`\n🥇 Top 3:`);
      result.summary.top3.forEach((entry, idx) => {
        const medal = ['🥇', '🥈', '🥉'][idx];
        console.log(`${medal} ${entry.entryName} (${entry.points} pts) - £${(entry.prize / 100).toFixed(2)}`);
      });
    }
    console.log(`\nResult ID: ${result.result?.[0]?.id || 'Unknown'}`);
    console.log(`\n🌐 View full results at: http://localhost:3002/admin/results/${result.result?.[0]?.id || ''}`);
    console.log(`📋 Dashboard: http://localhost:3002/admin/results\n`);

  } catch (error) {
    console.error('❌ Error finalizing competition:', error.message);
    process.exit(1);
  }
}

// Get competition ID from command line or use RSM Classic
const competitionId = process.argv[2];

if (!competitionId) {
  console.log('\n🔍 Finding competitions...\n');
  
  supabase
    .from('tournament_competitions')
    .select(`
      id, 
      status,
      tournaments!tournament_competitions_tournament_id_fkey(name),
      competition_types(name)
    `)
    .order('created_at', { ascending: false })
    .limit(10)
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Error:', error);
        console.log('\nUsage: node finalize-competition.js [competition-id]');
        process.exit(1);
      }
      
      if (!data || data.length === 0) {
        console.error('❌ No competitions found');
        console.log('\nUsage: node finalize-competition.js [competition-id]');
        process.exit(1);
      }
      
      console.log('Available competitions:');
      data.forEach((comp, idx) => {
        const tournamentName = comp.tournaments?.name || 'Unknown Tournament';
        const typeName = comp.competition_types?.name || 'Unknown Type';
        console.log(`${idx + 1}. ${tournamentName} - ${typeName} - ${comp.status}`);
        console.log(`   ID: ${comp.id}`);
      });
      
      console.log('\nUsing first competition:');
      const first = data[0];
      console.log(`${first.tournaments?.name} - ${first.competition_types?.name}\n`);
      finalizeCompetition(first.id);
    });
} else {
  finalizeCompetition(competitionId);
}
