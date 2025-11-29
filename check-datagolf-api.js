const apiKey = 'ac7793fb5f617626ccc418008832';

async function checkDataGolfEndpoints() {
  console.log('\n🔍 Checking DataGolf API Endpoints...\n');
  
  // Test 1: Field Updates (current events)
  console.log('1️⃣ Testing field-updates endpoint (current events):');
  try {
    const res = await fetch(`https://feeds.datagolf.com/field-updates?tour=euro&key=${apiKey}`);
    const data = await res.json();
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('   Error:', err.message);
  }
  
  console.log('\n2️⃣ Testing historical-raw-data/event-results endpoint:');
  try {
    // Event ID 561 from the URL you provided
    const res = await fetch(`https://feeds.datagolf.com/historical-raw-data/event-results?tour=euro&event_id=561&year=2025&key=${apiKey}`);
    const data = await res.json();
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('   Error:', err.message);
  }
  
  console.log('\n3️⃣ Testing preds/in-play endpoint (for live events):');
  try {
    const res = await fetch(`https://feeds.datagolf.com/preds/in-play?tour=euro&key=${apiKey}`);
    const data = await res.json();
    console.log('   Status:', res.status);
    console.log('   Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('   Error:', err.message);
  }
  
  console.log('\n4️⃣ Testing historical-dg-id-list endpoint (get all events):');
  try {
    const res = await fetch(`https://feeds.datagolf.com/historical-dg-id-list?tour=euro&key=${apiKey}`);
    const data = await res.json();
    console.log('   Status:', res.status);
    if (data.error) {
      console.log('   Error:', data.error);
    } else if (Array.isArray(data)) {
      console.log(`   Found ${data.length} events`);
      // Find event 561
      const event561 = data.find(e => e.event_id === '561' || e.event_id === 561);
      if (event561) {
        console.log('   Event 561:', JSON.stringify(event561, null, 2));
      } else {
        console.log('   Events sample:', JSON.stringify(data.slice(0, 3), null, 2));
      }
    }
  } catch (err) {
    console.log('   Error:', err.message);
  }

  console.log('\n5️⃣ Checking your DataGolf API documentation access:');
  console.log('   Your API Key:', apiKey);
  console.log('   Recommended: Visit https://datagolf.com/api-access to check your subscription tier');
  console.log('   Different tiers have access to different endpoints and historical data');
}

checkDataGolfEndpoints();
