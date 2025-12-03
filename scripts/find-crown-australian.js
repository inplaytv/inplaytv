const apiKey = 'ac7793fb5f617626ccc418008832';

async function findCrownAustralianOpen() {
  console.log('=== SEARCHING FOR CROWN AUSTRALIAN OPEN ===\n');
  
  // Try schedule endpoint
  console.log('1. Checking schedule endpoint...');
  try {
    const scheduleUrl = `https://feeds.datagolf.com/preds/get-schedule?tour=euro&file_format=json&key=${apiKey}`;
    const schedRes = await fetch(scheduleUrl);
    const schedData = await schedRes.json();
    
    if (schedData.schedule) {
      const australianOpen = schedData.schedule.find(t => 
        t.event_name && t.event_name.toLowerCase().includes('australian')
      );
      
      if (australianOpen) {
        console.log('✅ Found in schedule:', australianOpen.event_name);
        console.log('   Event ID:', australianOpen.event_id);
        console.log('   Start:', australianOpen.start_date);
        console.log('   Full data:', JSON.stringify(australianOpen, null, 2));
      } else {
        console.log('❌ Not found in schedule');
        console.log('   Available events:', schedData.schedule.map(t => t.event_name).slice(0, 5));
      }
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
  
  // Try in-play endpoint
  console.log('\n2. Checking in-play endpoint (tour=euro)...');
  try {
    const inplayUrl = `https://feeds.datagolf.com/preds/in-play?tour=euro&file_format=json&key=${apiKey}`;
    const inplayRes = await fetch(inplayUrl);
    const inplayData = await inplayRes.json();
    console.log('   Event:', inplayData.event_name);
    console.log('   Event ID:', inplayData.event_id || 'N/A');
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
  
  // Try PGA (maybe it's co-sanctioned?)
  console.log('\n3. Checking PGA tour endpoints...');
  try {
    const pgaUrl = `https://feeds.datagolf.com/field-updates?tour=pga&file_format=json&key=${apiKey}`;
    const pgaRes = await fetch(pgaUrl);
    const pgaData = await pgaRes.json();
    console.log('   PGA Event:', pgaData.event_name);
    
    if (pgaData.event_name.toLowerCase().includes('australian')) {
      console.log('   ✅ Found as PGA event!');
      console.log('   Event ID:', pgaData.event_id);
      console.log('   Players:', pgaData.field?.length);
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

findCrownAustralianOpen();
