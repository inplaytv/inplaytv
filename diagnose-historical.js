const apiKey = 'ac7793fb5f617626ccc418008832';

async function diagnoseHistoricalAccess() {
  console.log('\n🔍 Diagnosing Historical Data Access\n');
  
  // Test 1: Event list (should work if you have historical access)
  console.log('1️⃣ Testing event-list endpoint...');
  try {
    const res = await fetch(`https://feeds.datagolf.com/historical-raw-data/event-list?file_format=json&key=${apiKey}`);
    const text = await res.text();
    
    console.log(`   Status: ${res.status}`);
    
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        console.log(`   ✅ Historical access confirmed! Found ${data.length} events`);
        
        // Find RSM Classic
        const rsm = data.filter(e => e.event_name && e.event_name.includes('RSM'));
        console.log(`\n   📍 RSM Classic events found:`);
        rsm.slice(0, 5).forEach(e => {
          console.log(`      - ${e.event_name} (${e.calendar_year}) - ID: ${e.event_id}, Tour: ${e.tour}`);
        });
        
        if (rsm.length > 0) {
          // Test with actual RSM event ID
          const rsmEvent = rsm[0];
          console.log(`\n2️⃣ Testing rounds endpoint with RSM Classic...`);
          console.log(`   Event: ${rsmEvent.event_name}`);
          console.log(`   ID: ${rsmEvent.event_id}, Year: ${rsmEvent.calendar_year}, Tour: ${rsmEvent.tour}`);
          
          const roundsUrl = `https://feeds.datagolf.com/historical-raw-data/rounds?tour=${rsmEvent.tour}&event_id=${rsmEvent.event_id}&year=${rsmEvent.calendar_year}&file_format=json&key=${apiKey}`;
          const roundsRes = await fetch(roundsUrl);
          const roundsText = await roundsRes.text();
          
          console.log(`   Status: ${roundsRes.status}`);
          
          try {
            const roundsData = JSON.parse(roundsText);
            if (Array.isArray(roundsData)) {
              console.log(`   ✅ Got ${roundsData.length} round records!`);
              console.log(`\n   📊 Sample data:`);
              console.log(JSON.stringify(roundsData[0], null, 2));
            } else {
              console.log(`   ❌ Unexpected format:`, roundsData);
            }
          } catch (e) {
            console.log(`   ❌ Parse error:`, roundsText.substring(0, 200));
          }
        }
        
      } else {
        console.log(`   ❌ Error:`, data);
      }
    } catch (parseErr) {
      console.log(`   ❌ Response: ${text.substring(0, 200)}`);
    }
    
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
  }
}

diagnoseHistoricalAccess();
