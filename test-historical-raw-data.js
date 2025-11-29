const apiKey = 'ac7793fb5f617626ccc418008832';

async function testHistoricalRawData() {
  console.log('\n🔍 Testing DataGolf Historical Raw Data API\n');
  
  // Test 1: Get list of available historical events
  console.log('1️⃣ Getting list of historical events:');
  console.log('   Endpoint: historical-raw-data/event-list\n');
  try {
    const res = await fetch(`https://feeds.datagolf.com/historical-raw-data/event-list?file_format=json&key=${apiKey}`);
    const events = await res.json();
    
    if (events.error) {
      console.log('   ❌ Error:', events.error);
    } else if (Array.isArray(events)) {
      console.log(`   ✅ Found ${events.length} historical events!`);
      
      // Find European Tour event 561 from 2025
      const event561 = events.find(e => 
        e.event_id === '561' && e.year === 2025 && e.tour === 'euro'
      );
      
      if (event561) {
        console.log('\n   📍 Found Event 561 (from your URL):');
        console.log('   ', JSON.stringify(event561, null, 2));
      }
      
      // Show some recent European Tour events
      const recentEuro = events.filter(e => e.tour === 'euro' && e.year === 2025).slice(0, 5);
      console.log(`\n   📋 Sample of 2025 European Tour events:`);
      recentEuro.forEach(e => {
        console.log(`      - ${e.event_name} (ID: ${e.event_id}, Year: ${e.year})`);
      });
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  
  // Test 2: Get round-level data for event 561
  console.log('\n\n2️⃣ Getting round-level scoring data for Event 561:');
  console.log('   Endpoint: historical-raw-data/rounds?tour=euro&event_id=561&year=2025\n');
  try {
    const res = await fetch(`https://feeds.datagolf.com/historical-raw-data/rounds?tour=euro&event_id=561&year=2025&file_format=json&key=${apiKey}`);
    const rounds = await res.json();
    
    if (rounds.error) {
      console.log('   ❌ Error:', rounds.error);
    } else if (Array.isArray(rounds)) {
      console.log(`   ✅ Found ${rounds.length} round records!`);
      
      if (rounds.length > 0) {
        // Show sample data
        console.log('\n   📊 Sample round data (first record):');
        console.log('   ', JSON.stringify(rounds[0], null, 2));
        
        // Show what data is available
        console.log('\n   📋 Available fields:');
        console.log('   ', Object.keys(rounds[0]).join(', '));
        
        // Count unique players and rounds
        const uniquePlayers = new Set(rounds.map(r => r.player_name || r.dg_id));
        const uniqueRounds = new Set(rounds.map(r => r.round_num));
        console.log(`\n   👥 Players: ${uniquePlayers.size}`);
        console.log(`   🔢 Rounds: ${Array.from(uniqueRounds).sort().join(', ')}`);
      }
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  
  console.log('\n\n' + '='.repeat(70));
  console.log('📝 SUMMARY:');
  console.log('='.repeat(70));
  console.log('✅ You have access to Historical Raw Data API!');
  console.log('');
  console.log('Available endpoints:');
  console.log('  1. event-list - Get all available historical events');
  console.log('  2. rounds - Get round-by-round scoring and stats');
  console.log('');
  console.log('For the URL you showed (datagolf.com/past-results/european-tour/561/2025):');
  console.log('  - Tour: euro (European Tour)');
  console.log('  - Event ID: 561');
  console.log('  - Year: 2025');
  console.log('');
  console.log('API Endpoint:');
  console.log('  https://feeds.datagolf.com/historical-raw-data/rounds');
  console.log('  ?tour=euro&event_id=561&year=2025&key=YOUR_KEY');
}

testHistoricalRawData();
