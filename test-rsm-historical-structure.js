const apiKey = 'ac7793fb5f617626ccc418008832';

async function testRSMHistorical() {
  console.log('\n🧪 Testing RSM Classic Historical Data\n');
  
  // RSM Classic 2024 - completed tournament
  const url = `https://feeds.datagolf.com/historical-raw-data/rounds?tour=pga&event_id=010&year=2024&file_format=json&key=${apiKey}`;
  
  console.log('URL:', url.replace(apiKey, 'XXX'));
  console.log('');
  
  try {
    const res = await fetch(url);
    const rounds = await res.json();
    
    if (rounds.error) {
      console.log('❌ Error:', rounds.error);
      return;
    }
    
    if (Array.isArray(rounds)) {
      console.log(`✅ Success! Got ${rounds.length} round records`);
      console.log('');
      
      // Show structure
      console.log('📋 Sample Round Record:');
      console.log(JSON.stringify(rounds[0], null, 2));
      console.log('');
      
      // Show available fields
      console.log('📊 Available Fields:');
      console.log(Object.keys(rounds[0]).join(', '));
      console.log('');
      
      // Analyze data
      const players = new Set(rounds.map(r => r.dg_id));
      const roundNums = new Set(rounds.map(r => r.round_num));
      
      console.log(`👥 Unique Players: ${players.size}`);
      console.log(`🔢 Rounds: ${Array.from(roundNums).sort().join(', ')}`);
      console.log('');
      
      // Show a player's full tournament
      const samplePlayer = rounds.filter(r => r.dg_id === rounds[0].dg_id);
      console.log(`📍 Sample Player Data (${samplePlayer[0].player_name}):`);
      samplePlayer.forEach(round => {
        console.log(`   Round ${round.round_num}: ${round.round_score} (${round.to_par >= 0 ? '+' : ''}${round.to_par})`);
      });
      console.log(`   Final Position: ${samplePlayer[samplePlayer.length - 1].position}`);
      console.log(`   Total Score: ${samplePlayer[samplePlayer.length - 1].total_score}`);
      
    } else {
      console.log('❌ Unexpected response format');
      console.log(JSON.stringify(rounds, null, 2));
    }
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

testRSMHistorical();
