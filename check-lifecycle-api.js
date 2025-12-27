const fetch = require('node-fetch');

async function checkLifecycleAPI() {
  try {
    console.log('Fetching from API: http://localhost:3002/api/tournament-lifecycle\n');
    
    const response = await fetch('http://localhost:3002/api/tournament-lifecycle');
    const data = await response.json();
    
    console.log(`Total tournaments returned: ${data.tournaments?.length || 0}\n`);
    
    if (data.tournaments) {
      console.log('Tournaments by status:');
      const grouped = {};
      
      data.tournaments.forEach(t => {
        const status = t.status || 'null';
        if (!grouped[status]) grouped[status] = [];
        grouped[status].push(t.name);
      });
      
      Object.keys(grouped).sort().forEach(status => {
        console.log(`\n${status.toUpperCase()}:`);
        grouped[status].forEach(name => console.log(`  - ${name}`));
      });
      
      console.log('\n\nSearching for "Mister G\'s Open"...');
      const misterG = data.tournaments.find(t => t.name.includes("Mister G"));
      if (misterG) {
        console.log('✅ FOUND in API response!');
        console.log(`   Status: ${misterG.status}`);
        console.log(`   ID: ${misterG.id}`);
      } else {
        console.log('❌ NOT FOUND in API response');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkLifecycleAPI();
