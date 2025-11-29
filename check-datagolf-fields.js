const apiKey = 'ac7793fb5f617626ccc418008832';

async function checkDataGolfFields() {
  try {
    console.log('\n🏌️ Checking DataGolf field-updates API...\n');
    
    const url = `https://feeds.datagolf.com/field-updates?tour=pga&key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Log raw response to see structure
    console.log('=== Raw API Response ===');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n=== Parsed Field Data ===');
    console.log(`Event: ${data.event_name}`);
    console.log(`Tour: ${data.tour}`);
    console.log(`Current Round: ${data.current_round}`);
    console.log(`Event Completed: ${data.event_completed}`);
    console.log(`Last Updated: ${data.last_updated}`);
    
    if (data.field && data.field.length > 0) {
      console.log(`\nField Size: ${data.field.length} players`);
      console.log('\nFirst 5 players:');
      data.field.slice(0, 5).forEach((p, i) => {
        console.log(`${i+1}. ${p.player_name} (DG ID: ${p.dg_id})`);
      });
    } else {
      console.log('\n⚠️ No field data available');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDataGolfFields();
