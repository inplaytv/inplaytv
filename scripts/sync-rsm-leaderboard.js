import fetch from 'node-fetch';

const DATAGOLF_API_KEY = process.env.DATAGOLF_API_KEY || 'your-api-key-here';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function syncRSMClassicGolfers() {
  console.log('🏌️ Fetching RSM Classic leaderboard from DataGolf...');
  
  // Fetch leaderboard data
  const leaderboardUrl = `https://feeds.datagolf.com/preds/in-play?tour=pga&key=${DATAGOLF_API_KEY}`;
  const response = await fetch(leaderboardUrl);
  const data = await response.json();
  
  console.log('📊 DataGolf response:', JSON.stringify(data, null, 2));
  
  // Find RSM Classic tournament
  const rsmClassic = data.find(t => 
    t.event_name && t.event_name.toLowerCase().includes('rsm')
  );
  
  if (!rsmClassic) {
    console.log('❌ RSM Classic not found in DataGolf API');
    console.log('Available tournaments:', data.map(t => t.event_name));
    return;
  }
  
  console.log('✅ Found RSM Classic:', rsmClassic.event_name);
  console.log('📋 Golfers:', rsmClassic.field?.length || 0);
  
  // Now sync to Supabase
  // ... (we'll add this next if the data is available)
}

syncRSMClassicGolfers().catch(console.error);
