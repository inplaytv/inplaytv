require('dotenv').config({ path: './apps/admin/.env.local' });

async function testLifecycleAPI() {
  console.log('=== TESTING LIFECYCLE API ===\n');
  
  try {
    const response = await fetch('http://localhost:3002/api/tournament-lifecycle');
    
    if (!response.ok) {
      console.error('❌ API returned error:', response.status, response.statusText);
      const text = await response.text();
      console.error('Response:', text);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ API Response received');
    console.log('Tournament count:', data.tournaments?.length || 0);
    
    if (data.tournaments && data.tournaments.length > 0) {
      const tournament = data.tournaments[0];
      console.log('\n📊 THE GREENIDGE OPEN data:');
      console.log('  ID:', tournament.id);
      console.log('  Status:', tournament.status);
      console.log('  Golfer Count:', tournament.golfer_count);
      console.log('  assigned_golfer_group_id:', tournament.assigned_golfer_group_id);
      console.log('  Competition Count:', tournament.competition_count);
      console.log('  Entry Count:', tournament.entry_count);
      
      console.log('\n🔍 Checks:');
      console.log('  Has golfer group?', tournament.assigned_golfer_group_id ? '✅ YES' : '❌ NO');
      console.log('  Status is registration_open?', tournament.status === 'registration_open' ? '✅ YES' : '❌ NO (is: ' + tournament.status + ')');
      console.log('  Has competitions?', tournament.competition_count > 0 ? '✅ YES' : '❌ NO');
      
      console.log('\n⚠️ Lifecycle Manager will show:');
      const needsGolfers = tournament.golfer_count === 0 && !tournament.assigned_golfer_group_id;
      console.log('  "No golfers assigned"?', needsGolfers ? '❌ YES (BUG!)' : '✅ NO');
      console.log('  Status badge:', tournament.status.replace('_', ' ').toUpperCase());
    } else {
      console.log('❌ No tournaments returned by API');
    }
    
  } catch (error) {
    console.error('❌ Failed to call API:', error.message);
  }
}

testLifecycleAPI();
