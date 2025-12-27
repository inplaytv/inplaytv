const fetch = require('node-fetch');

async function checkAPI() {
  console.log('Fetching from Lifecycle API...\n');
  
  const response = await fetch('http://localhost:3002/api/tournament-lifecycle');
  const data = await response.json();
  
  console.log(`API returned ${data.tournaments?.length || 0} tournaments:\n`);
  
  if (data.tournaments) {
    data.tournaments.forEach((t, idx) => {
      console.log(`${idx + 1}. ${t.name} (${t.status})`);
    });
  }
}

checkAPI().catch(console.error);
