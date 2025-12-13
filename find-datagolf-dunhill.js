// Fetch DataGolf events and find Alfred Dunhill Championship
const https = require('https');
require('dotenv').config({ path: './apps/golf/.env.local' });

const DATAGOLF_API_KEY = process.env.DATAGOLF_API_KEY;

if (!DATAGOLF_API_KEY) {
  console.error('❌ DATAGOLF_API_KEY not found in environment');
  process.exit(1);
}

function fetchDataGolf(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'feeds.datagolf.com',
      path: path,
      headers: {
        'Authorization': DATAGOLF_API_KEY
      }
    };
    
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function findDunhillEvent() {
  console.log('\n🔍 Searching for Alfred Dunhill Championship in DataGolf...\n');
  
  // Fetch recent PGA Tour events
  console.log('Fetching DP World Tour events...');
  const schedule = await fetchDataGolf('/historical-raw-data/event-list?tour=euro');
  
  console.log(`Found ${schedule.length} DP World Tour events\n`);
  
  // Search for Dunhill
  const dunhillEvents = schedule.filter(e => 
    e.event_name.toLowerCase().includes('dunhill') ||
    e.event_name.toLowerCase().includes('alfred')
  );
  
  if (dunhillEvents.length === 0) {
    console.log('❌ No Dunhill events found');
    console.log('\nAll recent events:');
    schedule.slice(0, 10).forEach(e => {
      console.log(`  - ${e.event_name} (${e.calendar_year})`);
    });
    return;
  }
  
  console.log('✅ Found Dunhill events:\n');
  dunhillEvents.forEach(event => {
    console.log(`Event: ${event.event_name}`);
    console.log(`Year: ${event.calendar_year}`);
    console.log(`Event ID: ${event.event_id}`);
    console.log(`DataGolf ID: ${event.dg_id || 'N/A'}`);
    console.log('─'.repeat(50));
  });
  
  // Find 2024/2025 event
  const currentEvent = dunhillEvents.find(e => 
    e.calendar_year === 2024 || e.calendar_year === 2025
  );
  
  if (currentEvent) {
    console.log('\n✅ Current/Latest Dunhill Event:');
    console.log(`Event Name: ${currentEvent.event_name}`);
    console.log(`Event ID: ${currentEvent.event_id}`);
    console.log(`DataGolf ID: ${currentEvent.dg_id || 'N/A'}`);
    console.log(`Year: ${currentEvent.calendar_year}`);
    
    console.log('\n📝 Update your tournament with:');
    console.log(`UPDATE tournaments SET datagolf_id = '${currentEvent.event_id}' WHERE id = 'f091f409-8e88-437a-a97a-342b8f3c0ba0';`);
  }
}

findDunhillEvent().catch(console.error);
