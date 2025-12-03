async function checkDataGolf() {
  const apiKey = 'b1cc578cbf27ed0d4879c6bea820';
  
  console.log('\n🔍 Checking DataGolf Euro Tour...\n');
  
  const response = await fetch(
    `https://feeds.datagolf.com/field-updates?tour=euro&file_format=json&key=${apiKey}`
  );
  
  const data = await response.json();
  
  console.log('Event:', data.event_name);
  console.log('Event ID:', data.event_id);
  console.log('Players:', data.field?.length);
  console.log('\nFirst 3 players:');
  data.field.slice(0, 3).forEach(p => {
    console.log(`  - ${p.player_name} (${p.country})`);
  });
}

checkDataGolf();
