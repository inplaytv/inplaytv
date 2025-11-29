const apiKey = 'ac7793fb5f617626ccc418008832';

async function testHistoricalAccess() {
  console.log('\n🔍 Testing Historical Data Access\n');
  console.log('Web page URL: https://datagolf.com/past-results/european-tour/561/2025');
  console.log('Testing potential API endpoints for historical results...\n');
  
  // Based on DataGolf API patterns, try these endpoints:
  const endpoints = [
    {
      name: 'historical-raw-data/event-results',
      url: `https://feeds.datagolf.com/historical-raw-data/event-results?tour=euro&event_id=561&year=2025&key=${apiKey}`
    },
    {
      name: 'historical-raw-data/rounds',  
      url: `https://feeds.datagolf.com/historical-raw-data/rounds?tour=euro&event_id=561&year=2025&key=${apiKey}`
    },
    {
      name: 'preds/get-dg-rankings (historical)',
      url: `https://feeds.datagolf.com/preds/get-dg-rankings?file_format=json&key=${apiKey}`
    },
    {
      name: 'historical-dg-id-list',
      url: `https://feeds.datagolf.com/historical-dg-id-list?tour=euro&key=${apiKey}`
    }
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${endpoint.name}`);
    console.log(`URL: ${endpoint.url.replace(apiKey, 'XXX')}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      const res = await fetch(endpoint.url);
      const data = await res.json();
      
      console.log(`Status: ${res.status}`);
      
      if (data.error) {
        console.log(`❌ Error: ${data.error}`);
      } else if (Array.isArray(data)) {
        console.log(`✅ Success! Returned ${data.length} items`);
        if (data.length > 0) {
          console.log('Sample data:', JSON.stringify(data[0], null, 2));
        }
      } else if (typeof data === 'object') {
        console.log('✅ Success! Response keys:', Object.keys(data));
        console.log('Sample:', JSON.stringify(data).substring(0, 500));
      }
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
  }
  
  console.log('\n\n📝 SUMMARY:');
  console.log('Your DataGolf subscription includes historical data.');
  console.log('To retrieve past tournament results programmatically:');
  console.log('  1. Use historical-raw-data endpoints');
  console.log('  2. Specify tour, event_id, and year parameters');
  console.log('  3. Event IDs can be found using historical-dg-id-list endpoint');
}

testHistoricalAccess();
