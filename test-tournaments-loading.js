// Test if tournaments are now loading on the frontend
(async () => {
  console.log('🧪 Testing /api/tournaments endpoint...\n');
  
  try {
    const response = await fetch('http://localhost:3003/api/tournaments');
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`\n✅ SUCCESS: Found ${data.length} tournament(s)\n`);
      
      data.forEach(tournament => {
        console.log(`📋 ${tournament.name}`);
        console.log(`   Slug: ${tournament.slug}`);
        console.log(`   Status: ${tournament.status}`);
        console.log(`   Competitions: ${tournament.competitions?.length || 0}`);
        if (tournament.competitions && tournament.competitions.length > 0) {
          tournament.competitions.forEach(comp => {
            console.log(`      - ${comp.competition_type?.name || 'Unknown'} (${comp.competition_format || 'no format'})`);
          });
        }
        console.log('');
      });
    } else {
      const text = await response.text();
      console.log(`\n❌ ERROR: ${text}`);
    }
  } catch (error) {
    console.error(`\n❌ FETCH ERROR:`, error.message);
    console.log('\n💡 Make sure the dev server is running: pnpm dev:golf');
  }
})();
