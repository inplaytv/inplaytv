/**
 * Test the DataGolf Rankings endpoints
 */

const API_KEY = 'ac7793fb5f617626ccc418008832';

async function testRankings() {
  console.log('🔍 Testing DataGolf Rankings API...\n');
  
  try {
    // Test 1: Get top 500 rankings
    console.log('1️⃣ Fetching top 500 players...');
    const url = `https://feeds.datagolf.com/preds/get-dg-rankings?file_format=json&key=${API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    console.log(`✅ Success! Retrieved ${data.rankings?.length || 0} players`);
    console.log(`📅 Last updated: ${data.last_updated}`);
    
    // Show top 10
    console.log('\n🏆 Top 10 Players:');
    data.rankings.slice(0, 10).forEach((player, idx) => {
      console.log(`   ${idx + 1}. ${player.player_name.padEnd(25)} | DG Rank: ${player.dg_rank} | OWGR: ${player.owgr_rank} | Skill: ${player.dg_skill_estimate}`);
    });
    
    // Test 2: Test our API endpoints
    console.log('\n\n2️⃣ Testing local API endpoints...');
    
    // Note: Admin server needs to be running on localhost:3002
    console.log('\n   ⚠️  Make sure admin server is running:');
    console.log('   cd c:\\inplaytv\\apps\\admin');
    console.log('   pnpm dev\n');
    
    console.log('   Then test these endpoints:');
    console.log('   GET  http://localhost:3002/api/golfers/rankings?search=Scheffler');
    console.log('   POST http://localhost:3002/api/golfers/sync-from-rankings');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRankings();
