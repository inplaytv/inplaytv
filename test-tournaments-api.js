require('dotenv').config({ path: './apps/golf/.env.local' });

async function testAPI() {
  console.log('Testing /api/tournaments endpoint...\n');
  
  const response = await fetch('http://localhost:3003/api/tournaments', {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
    },
  });
  
  if (!response.ok) {
    console.error('API Error:', response.status, response.statusText);
    return;
  }
  
  const data = await response.json();
  const tournaments = data.tournaments || data;
  
  console.log(`Total tournaments returned: ${tournaments.length}\n`);
  
  const targetSlugs = ['the-greenidge-open', 'westgate-birchington-golf-club'];
  
  for (const slug of targetSlugs) {
    const tournament = tournaments.find(t => t.slug === slug);
    
    if (!tournament) {
      console.log(`❌ ${slug}: NOT FOUND in API response\n`);
      continue;
    }
    
    console.log(`✅ ${tournament.name}:`);
    console.log(`   Status: ${tournament.status}`);
    console.log(`   Competitions: ${tournament.competitions?.length || 0}`);
    
    if (tournament.competitions && tournament.competitions.length > 0) {
      tournament.competitions.forEach((c, i) => {
        console.log(`     ${i + 1}. ${c.competition_types?.name || 'Unknown'} - ${c.status}`);
      });
    } else {
      console.log('   ⚠️  NO COMPETITIONS in response');
    }
    console.log('');
  }
}

testAPI().catch(console.error);
