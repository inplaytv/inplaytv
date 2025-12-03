const apiKey = 'ac7793fb5f617626ccc418008832';

async function checkDataGolfFieldStructure() {
  console.log('=== DataGolf Field Updates - Full Player Data Structure ===\n');
  
  const url = `https://feeds.datagolf.com/field-updates?tour=euro&file_format=json&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  
  console.log('Event:', data.event_name);
  console.log('Total Players:', data.field?.length);
  console.log('\n--- Sample Player Data (First Player) ---');
  console.log(JSON.stringify(data.field[0], null, 2));
  
  console.log('\n--- All Available Fields ---');
  console.log(Object.keys(data.field[0]));
  
  console.log('\n--- Players with OWGR Data ---');
  const playersWithOWGR = data.field.filter(p => p.owgr || p.owgr_rank);
  console.log(`Found ${playersWithOWGR.length} players with OWGR data`);
  if (playersWithOWGR.length > 0) {
    console.log('\nSample:');
    playersWithOWGR.slice(0, 5).forEach(p => {
      console.log(`  ${p.player_name}: OWGR Rank ${p.owgr_rank || 'N/A'}, OWGR Points ${p.owgr || 'N/A'}`);
    });
  }
}

checkDataGolfFieldStructure();
