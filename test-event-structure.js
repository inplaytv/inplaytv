const apiKey = 'ac7793fb5f617626ccc418008832';

async function testEventListStructure() {
  console.log('\n🔍 Checking Event List Structure\n');
  
  const res = await fetch(
    `https://feeds.datagolf.com/historical-raw-data/event-list?file_format=json&key=${apiKey}`
  );
  const events = await res.json();
  
  console.log('First 3 events:');
  console.log(JSON.stringify(events.slice(0, 3), null, 2));
  
  console.log('\n\n🎯 Testing RSM Classic with event_id 493:\n');
  
  // Try 2024
  console.log('Attempting year=2024...');
  const res2024 = await fetch(
    `https://feeds.datagolf.com/historical-raw-data/rounds?tour=pga&event_id=493&year=2024&file_format=json&key=${apiKey}`
  );
  const rounds2024 = await res2024.json();
  
  if (rounds2024.error) {
    console.log(`  ❌ 2024: ${rounds2024.error}`);
  } else {
    console.log(`  ✅ 2024: Found ${rounds2024.length} records`);
    if (rounds2024.length > 0) {
      console.log(`     Winner: ${rounds2024.find(r => r.finish_position === '1')?.player_name || 'N/A'}`);
    }
  }
  
  // Try 2023
  console.log('\nAttempting year=2023...');
  const res2023 = await fetch(
    `https://feeds.datagolf.com/historical-raw-data/rounds?tour=pga&event_id=493&year=2023&file_format=json&key=${apiKey}`
  );
  const rounds2023 = await res2023.json();
  
  if (rounds2023.error) {
    console.log(`  ❌ 2023: ${rounds2023.error}`);
  } else {
    console.log(`  ✅ 2023: Found ${rounds2023.length} records`);
    if (rounds2023.length > 0) {
      console.log(`     Winner: ${rounds2023.find(r => r.finish_position === '1')?.player_name || 'N/A'}`);
    }
  }
}

testEventListStructure();
