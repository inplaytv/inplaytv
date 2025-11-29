const apiKey = 'ac7793fb5f617626ccc418008832';

async function testHistoricalEndpoints() {
  console.log('\n🔍 Testing DataGolf Historical Endpoints\n');
  
  // Test 1: Historical raw data for event 561
  console.log('1️⃣ Testing historical-raw-data/event-results:');
  console.log('   URL: https://feeds.datagolf.com/historical-raw-data/event-results?tour=euro&event_id=561&year=2025&key=XXX');
  try {
    const res = await fetch(`https://feeds.datagolf.com/historical-raw-data/event-results?tour=euro&event_id=561&year=2025&key=${apiKey}`);
    const data = await res.json();
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(data, null, 2).substring(0, 500));
  } catch (err) {
    console.log('   Error:', err.message);
  }
  
  // Test 2: Historical tournament list
  console.log('\n2️⃣ Testing historical-dg-id-list:');
  console.log('   URL: https://feeds.datagolf.com/historical-dg-id-list?tour=euro&key=XXX');
  try {
    const res = await fetch(`https://feeds.datagolf.com/historical-dg-id-list?tour=euro&key=${apiKey}`);
    const data = await res.json();
    console.log('   Status:', res.status);
    if (data.error) {
      console.log('   Error:', data.error);
    } else if (Array.isArray(data)) {
      console.log(`   ✅ Found ${data.length} historical events`);
      const event561 = data.find(e => e.event_id === '561' || e.event_id === 561);
      if (event561) {
        console.log('   Event 561 found:', JSON.stringify(event561, null, 2));
      }
    }
  } catch (err) {
    console.log('   Error:', err.message);
  }
  
  // Test 3: Try pga/in-play endpoint
  console.log('\n3️⃣ Testing preds/in-play (PGA):');
  console.log('   URL: https://feeds.datagolf.com/preds/in-play?tour=pga&key=XXX');
  try {
    const res = await fetch(`https://feeds.datagolf.com/preds/in-play?tour=pga&key=${apiKey}`);
    const data = await res.json();
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(data, null, 2).substring(0, 300));
  } catch (err) {
    console.log('   Error:', err.message);
  }
  
  // Test 4: Get player list
  console.log('\n4️⃣ Testing get-player-list:');
  console.log('   URL: https://feeds.datagolf.com/get-player-list?file_format=json&key=XXX');
  try {
    const res = await fetch(`https://feeds.datagolf.com/get-player-list?file_format=json&key=${apiKey}`);
    const data = await res.json();
    console.log('   Status:', res.status);
    if (Array.isArray(data)) {
      console.log(`   ✅ Found ${data.length} players`);
      console.log('   Sample players:', JSON.stringify(data.slice(0, 2), null, 2));
    } else {
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log('   Error:', err.message);
  }
  
  // Test 5: Field updates for European Tour
  console.log('\n5️⃣ Testing field-updates (European Tour):');
  console.log('   URL: https://feeds.datagolf.com/field-updates?tour=euro&key=XXX');
  try {
    const res = await fetch(`https://feeds.datagolf.com/field-updates?tour=euro&key=${apiKey}`);
    const data = await res.json();
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('   Error:', err.message);
  }

  console.log('\n📋 Summary:');
  console.log('   Your API includes historical data access');
  console.log('   The web URL format is: datagolf.com/past-results/[tour]/[event_id]/[year]');
  console.log('   The API endpoint should be: feeds.datagolf.com/historical-raw-data/...');
}

testHistoricalEndpoints();
