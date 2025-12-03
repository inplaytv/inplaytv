const apiKey = 'ac7793fb5f617626ccc418008832';

async function testDataGolfEuro() {
  console.log('Testing DataGolf field-updates for euro tour...\n');
  
  const url = `https://feeds.datagolf.com/field-updates?tour=euro&file_format=json&key=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  console.log('Event ID:', data.event_id);
  console.log('Event Name:', data.event_name);
  console.log('Course:', data.course_name);
  console.log('Field Count:', data.field?.length || 0);
  console.log('Current Round:', data.current_round);
  console.log('Last Updated:', data.last_updated);
  console.log('\nFirst 5 players:');
  if (data.field) {
    data.field.slice(0, 5).forEach((p, i) => {
      console.log(`  ${i+1}. ${p.player_name} (${p.country})`);
    });
  }
  
  console.log('\n--- Full Response Structure ---');
  console.log('Keys:', Object.keys(data));
}

testDataGolfEuro();
