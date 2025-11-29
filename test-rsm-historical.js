const apiKey = 'ac7793fb5f617626ccc418008832';

async function testRSMClassicHistorical() {
  console.log('\n🏌️ Testing RSM Classic Historical Data Retrieval\n');
  console.log('='.repeat(70));
  
  // The RSM Classic 2024 (completed tournament)
  const tour = 'pga';
  const eventId = 'The RSM Classic'; // This is what we have in the database
  const year = 2024;
  
  console.log(`Tournament: The RSM Classic`);
  console.log(`Tour: ${tour}`);
  console.log(`Year: ${year}`);
  console.log(`Event ID: ${eventId}`);
  console.log('='.repeat(70));
  
  // First, let's find the correct event_id from the event list
  console.log('\n1️⃣ Step 1: Finding event ID from event list...\n');
  
  try {
    const listRes = await fetch(
      `https://feeds.datagolf.com/historical-raw-data/event-list?file_format=json&key=${apiKey}`
    );
    const events = await listRes.json();
    
    if (events.error) {
      console.log('❌ Error:', events.error);
      return;
    }
    
    // Find RSM Classic events
    const rsmEvents = events.filter(e => 
      e.event_name && e.event_name.toLowerCase().includes('rsm')
    );
    
    console.log(`Found ${rsmEvents.length} RSM Classic events:`);
    rsmEvents.forEach(e => {
      console.log(`  - ${e.event_name} (ID: ${e.event_id}, Year: ${e.year}, Tour: ${e.tour})`);
    });
    
    // Get the 2024 PGA Tour RSM Classic
    const rsmClassic2024 = rsmEvents.find(e => 
      e.year === 2024 && e.tour === 'pga'
    );
    
    if (!rsmClassic2024) {
      console.log('\n❌ Could not find 2024 RSM Classic in event list');
      return;
    }
    
    console.log(`\n✅ Found 2024 RSM Classic!`);
    console.log(`   Event ID: ${rsmClassic2024.event_id}`);
    console.log(`   Full name: ${rsmClassic2024.event_name}`);
    
    // Now fetch the round data
    console.log('\n2️⃣ Step 2: Fetching round-level scoring data...\n');
    
    const roundsRes = await fetch(
      `https://feeds.datagolf.com/historical-raw-data/rounds?tour=pga&event_id=${rsmClassic2024.event_id}&year=2024&file_format=json&key=${apiKey}`
    );
    const rounds = await roundsRes.json();
    
    if (rounds.error) {
      console.log('❌ Error:', rounds.error);
      return;
    }
    
    if (!Array.isArray(rounds) || rounds.length === 0) {
      console.log('❌ No round data returned');
      return;
    }
    
    console.log(`✅ Retrieved ${rounds.length} round records!`);
    
    // Analyze the data
    const uniquePlayers = new Set(rounds.map(r => r.dg_id));
    const uniqueRounds = new Set(rounds.map(r => r.round_num)).values();
    const roundNums = Array.from(uniqueRounds).sort();
    
    console.log(`\n📊 Data Summary:`);
    console.log(`   Total records: ${rounds.length}`);
    console.log(`   Unique players: ${uniquePlayers.size}`);
    console.log(`   Rounds: ${roundNums.join(', ')}`);
    
    // Show sample data
    console.log(`\n📋 Sample Round Record:`);
    console.log(JSON.stringify(rounds[0], null, 2));
    
    // Show available fields
    console.log(`\n🔑 Available Fields:`);
    const fields = Object.keys(rounds[0]);
    console.log(`   ${fields.join(', ')}`);
    
    // Show winner (if available)
    const winner = rounds.find(r => r.finish_position === '1' || r.finish_position === 1);
    if (winner) {
      console.log(`\n🏆 Tournament Winner:`);
      console.log(`   ${winner.player_name}`);
      console.log(`   Score: ${winner.total_to_par} (${winner.total_strokes} strokes)`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ SUCCESS! Historical data API is working correctly.');
    console.log('='.repeat(70));
    console.log(`\nFor your database, update RSM Classic with:`);
    console.log(`  event_id = '${rsmClassic2024.event_id}'`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testRSMClassicHistorical();
