/**
 * Test DataGolf API Connection
 * Run this after adding your API key to verify everything works
 */

const API_KEY = process.env.DATAGOLF_API_KEY;
const BASE_URL = 'https://feeds.datagolf.com';

async function testDataGolfConnection() {
  console.log('\n🏌️ Testing DataGolf API Connection...\n');

  if (!API_KEY) {
    console.error('❌ ERROR: DATAGOLF_API_KEY not found in environment variables');
    console.log('\n💡 Add it to your .env.local file:');
    console.log('   DATAGOLF_API_KEY=dg-your-key-here\n');
    process.exit(1);
  }

  console.log('✅ API Key found:', API_KEY.substring(0, 10) + '...\n');

  // Test 1: Get Player List
  console.log('👥 Test 1: Fetching player list...');
  try {
    const rankingsResponse = await fetch(
      `${BASE_URL}/get-player-list?file_format=json&key=${API_KEY}`
    );
    
    if (!rankingsResponse.ok) {
      throw new Error(`HTTP ${rankingsResponse.status}: ${rankingsResponse.statusText}`);
    }

    const rankingsData = await rankingsResponse.json();
    
    console.log(`✅ Success! Found ${rankingsData.length} players`);
    if (rankingsData.length > 0) {
      const player = rankingsData[0];
      console.log(`   Sample player: ${player.player_name}`);
      console.log(`   Country: ${player.country}\n`);
    }
  } catch (error) {
    console.error('❌ Failed to fetch rankings:', error.message);
    console.log('\n⚠️  This might mean:');
    console.log('   1. API key is invalid or expired');
    console.log('   2. Subscription not active yet');
    console.log('   3. Wrong API key format\n');
    return false;
  }

  // Test 2: Get Tournament Schedule
  console.log('📅 Test 2: Fetching PGA Tour schedule...');
  try {
    const fieldResponse = await fetch(
      `${BASE_URL}/get-schedule?tour=pga&file_format=json&key=${API_KEY}`
    );
    
    if (!fieldResponse.ok) {
      throw new Error(`HTTP ${fieldResponse.status}: ${fieldResponse.statusText}`);
    }

    const fieldData = await fieldResponse.json();
    
    console.log(`✅ Success! Found ${fieldData.schedule.length} tournaments`);
    if (fieldData.schedule.length > 0) {
      console.log(`   Next event: ${fieldData.schedule[0].event_name}\n`);
    }  } catch (error) {
    console.error('❌ Failed to fetch field updates:', error.message);
    return false;
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ ALL TESTS PASSED!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n🎉 Your DataGolf integration is ready to use!\n');
  console.log('Next steps:');
  console.log('  1. Restart your dev server: turbo dev');
  console.log('  2. Go to Admin → AI Tournament Creator');
  console.log('  3. Real tournament data will load automatically');
  console.log('  4. Add DATAGOLF_API_KEY to production environment variables\n');

  return true;
}

// Run the tests
testDataGolfConnection().catch(error => {
  console.error('\n❌ Test failed with error:', error);
  process.exit(1);
});
