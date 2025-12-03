const apiKey = 'ac7793fb5f617626ccc418008832';

async function checkBothTournaments() {
  console.log('=== CHECKING DP WORLD TOUR EVENTS ===\n');
  
  // Check field-updates (default current event)
  console.log('1. Field Updates (tour=euro):');
  const fieldUrl = `https://feeds.datagolf.com/field-updates?tour=euro&file_format=json&key=${apiKey}`;
  const fieldRes = await fetch(fieldUrl);
  const fieldData = await fieldRes.json();
  console.log(`   Event: ${fieldData.event_name}`);
  console.log(`   Event ID: ${fieldData.event_id}`);
  console.log(`   Players: ${fieldData.field?.length || 0}\n`);
  
  // Check live-tournament-stats
  console.log('2. Live Tournament Stats (tour=euro):');
  const liveUrl = `https://feeds.datagolf.com/preds/live-tournament-stats?tour=euro&file_format=json&key=${apiKey}`;
  const liveRes = await fetch(liveUrl);
  const liveData = await liveRes.json();
  console.log(`   Event: ${liveData.event_name}`);
  console.log(`   Players: ${liveData.live_stats?.length || 0}\n`);
  
  // Check in-play endpoint
  console.log('3. In-Play Endpoint (tour=euro):');
  const inplayUrl = `https://feeds.datagolf.com/preds/in-play?tour=euro&file_format=json&key=${apiKey}`;
  const inplayRes = await fetch(inplayUrl);
  const inplayData = await inplayRes.json();
  console.log(`   Event: ${inplayData.event_name}`);
  console.log(`   Players: ${inplayData.leaderboard?.length || 0}\n`);
  
  console.log('=== CHECKING ALT TOUR (might include Australian Open) ===\n');
  const altUrl = `https://feeds.datagolf.com/field-updates?tour=alt&file_format=json&key=${apiKey}`;
  const altRes = await fetch(altUrl);
  const altData = await altRes.json();
  console.log(`   Event: ${altData.event_name || 'None'}`);
  console.log(`   Players: ${altData.field?.length || 0}`);
}

checkBothTournaments();
