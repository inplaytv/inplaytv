/**
 * Test DataGolf Tournament Field Fetch
 * Run this to verify we can get the golfer list for current tournaments
 */

const API_KEY = process.env.DATAGOLF_API_KEY;
const BASE_URL = 'https://feeds.datagolf.com';

async function testTournamentField() {
  console.log('\n🏌️ Testing DataGolf Tournament Field Fetch...\n');

  if (!API_KEY) {
    console.error('❌ ERROR: DATAGOLF_API_KEY not found in environment variables');
    process.exit(1);
  }

  console.log('✅ API Key found:', API_KEY.substring(0, 10) + '...\n');

  // Test PGA Tour field
  console.log('📋 Fetching PGA Tour field...');
  try {
    const response = await fetch(
      `${BASE_URL}/field-updates?tour=pga&file_format=json&key=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Success!');
    console.log(`   Event: ${data.event_name}`);
    console.log(`   Course: ${data.course_name}`);
    console.log(`   Current Round: ${data.current_round || 'Pre-tournament'}`);
    console.log(`   Field Size: ${data.field?.length || 0} golfers\n`);
    
    if (data.field && data.field.length > 0) {
      console.log('📊 Sample Players (first 5):');
      data.field.slice(0, 5).forEach((player, i) => {
        console.log(`   ${i + 1}. ${player.player_name} (${player.country})`);
        console.log(`      DG ID: ${player.dg_id}`);
        if (player.r1_teetime) console.log(`      Tee Time: ${player.r1_teetime}`);
        if (player.dk_salary) console.log(`      DraftKings Salary: $${player.dk_salary}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Failed to fetch PGA field:', error.message);
    return false;
  }

  // Test European Tour field
  console.log('📋 Fetching European Tour field...');
  try {
    const response = await fetch(
      `${BASE_URL}/field-updates?tour=euro&file_format=json&key=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Success!');
    console.log(`   Event: ${data.event_name}`);
    console.log(`   Course: ${data.course_name}`);
    console.log(`   Field Size: ${data.field?.length || 0} golfers\n`);
    
  } catch (error) {
    console.error('❌ Failed to fetch European field:', error.message);
    return false;
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ ALL TESTS PASSED!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n🎉 Tournament field fetch is working!\n');
  console.log('Next steps:');
  console.log('  1. Create a tournament via AI Tournament Creator');
  console.log('  2. Golfers will be automatically added from DataGolf');
  console.log('  3. Check Admin → Tournaments to verify golfers\n');

  return true;
}

testTournamentField();
