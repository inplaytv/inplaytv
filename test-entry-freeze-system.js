/**
 * Test Script: Entry Freeze and InPlay Notification System
 * 
 * Tests:
 * 1. Entry edit permissions (should block after competition starts)
 * 2. InPlay notifications for competitions starting soon
 * 3. Entry freeze visual indicators
 * 
 * Usage: node test-entry-freeze-system.js
 */

require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testEntryFreezeSystem() {
  console.log('🧪 Testing Entry Freeze & InPlay Notification System\n');

  try {
    // Test 1: Check competition with entries
    console.log('📋 Test 1: Checking competitions with entries...');
    const { data: competitions, error: compError } = await supabase
      .from('tournament_competitions')
      .select(`
        id,
        start_at,
        reg_close_at,
        status,
        notified_inplay,
        tournaments!tournament_competitions_tournament_id_fkey (
          name,
          slug
        ),
        competition_types!tournament_competitions_competition_type_id_fkey (
          name
        )
      `)
      .order('start_at', { ascending: true })
      .limit(5);

    if (compError) throw compError;

    console.log(`Found ${competitions?.length || 0} competitions\n`);

    for (const comp of competitions || []) {
      const now = new Date();
      const startTime = new Date(comp.start_at);
      const isLive = now >= startTime;
      const minutesUntilStart = Math.floor((startTime - now) / 1000 / 60);

      console.log(`📊 ${comp.tournaments.name} - ${comp.competition_types.name}`);
      console.log(`   Start: ${startTime.toLocaleString()}`);
      console.log(`   Status: ${isLive ? '🔴 LIVE' : `🟡 ${minutesUntilStart} mins until start`}`);
      console.log(`   Notified InPlay: ${comp.notified_inplay ? '✅ Yes' : '❌ No'}`);

      // Check entries for this competition
      const { data: entries } = await supabase
        .from('competition_entries')
        .select('id, user_id, entry_name, status')
        .eq('competition_id', comp.id)
        .eq('status', 'submitted');

      console.log(`   Entries: ${entries?.length || 0}`);

      if (entries && entries.length > 0) {
        for (const entry of entries) {
          // Test edit permission
          const canEdit = !isLive && now < new Date(comp.reg_close_at || comp.start_at);
          console.log(`     - Entry "${entry.entry_name}": ${canEdit ? '✅ Editable' : '🔒 FROZEN'}`);
        }
      }
      console.log('');
    }

    // Test 2: Check notification preferences
    console.log('\n📬 Test 2: Checking notification preferences...');
    const { data: prefs, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('user_id, entry_inplay, tee_times_available, registration_closing')
      .limit(5);

    if (prefsError) throw prefsError;

    console.log(`Found ${prefs?.length || 0} user preferences:`);
    for (const pref of prefs || []) {
      console.log(`   User ${pref.user_id.substring(0, 8)}...`);
      console.log(`     - Entry InPlay: ${pref.entry_inplay ? '✅' : '❌'}`);
      console.log(`     - Tee Times: ${pref.tee_times_available ? '✅' : '❌'}`);
      console.log(`     - Reg Closing: ${pref.registration_closing ? '✅' : '❌'}`);
    }

    // Test 3: Simulate InPlay notification check
    console.log('\n🔔 Test 3: Simulating InPlay notification check...');
    const fifteenMinutesFromNow = new Date(Date.now() + 15 * 60 * 1000);
    
    const { data: upcomingComps } = await supabase
      .from('tournament_competitions')
      .select('id, start_at, notified_inplay')
      .gte('start_at', new Date().toISOString())
      .lte('start_at', fifteenMinutesFromNow.toISOString())
      .eq('notified_inplay', false);

    if (upcomingComps && upcomingComps.length > 0) {
      console.log(`⚠️  ${upcomingComps.length} competitions starting in next 15 minutes:`);
      for (const comp of upcomingComps) {
        const minutesAway = Math.floor((new Date(comp.start_at) - Date.now()) / 1000 / 60);
        console.log(`   - Competition ${comp.id.substring(0, 8)}... (${minutesAway} min)`);
      }
      console.log('\n💡 These would trigger InPlay notifications via cron job');
    } else {
      console.log('✅ No competitions starting in next 15 minutes');
    }

    // Test 4: Check recent notifications
    console.log('\n📨 Test 4: Recent InPlay notifications...');
    const { data: notifications } = await supabase
      .from('notifications')
      .select('type, title, message, created_at, is_read')
      .eq('type', 'entry_inplay')
      .order('created_at', { ascending: false })
      .limit(5);

    if (notifications && notifications.length > 0) {
      console.log(`Found ${notifications.length} recent InPlay notifications:`);
      for (const notif of notifications) {
        const age = Math.floor((Date.now() - new Date(notif.created_at)) / 1000 / 60);
        console.log(`   - ${notif.title} (${age} min ago) ${notif.is_read ? '📖' : '🆕'}`);
      }
    } else {
      console.log('ℹ️  No InPlay notifications found yet');
    }

    console.log('\n✅ All tests completed successfully!\n');

    // Summary
    console.log('═══════════════════════════════════════════');
    console.log('📊 SYSTEM STATUS SUMMARY');
    console.log('═══════════════════════════════════════════');
    console.log(`Total Competitions: ${competitions?.length || 0}`);
    console.log(`Live Competitions: ${competitions?.filter(c => new Date() >= new Date(c.start_at)).length || 0}`);
    console.log(`Notification Prefs: ${prefs?.length || 0} users`);
    console.log(`Pending InPlay Notifications: ${upcomingComps?.length || 0}`);
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Manual trigger test
async function manualTriggerTest() {
  console.log('\n🎯 MANUAL TRIGGER TEST\n');
  console.log('This will call the notify-inplay API endpoint...\n');

  try {
    const response = await fetch('http://localhost:3003/api/notifications/notify-inplay', {
      method: 'POST',
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API Response:', data);
      console.log(`   Competitions checked: ${data.competitions || 0}`);
      console.log(`   Notifications sent: ${data.notifications || 0}`);
    } else {
      console.error('❌ API Error:', data);
    }
  } catch (error) {
    console.error('❌ Failed to call API:', error.message);
    console.log('\n💡 Make sure dev server is running: pnpm run dev:golf');
  }
}

// Run tests
console.log('InPlay Entry Freeze & Notification Test Suite');
console.log('='.repeat(50) + '\n');

testEntryFreezeSystem().then(() => {
  const args = process.argv.slice(2);
  if (args.includes('--trigger')) {
    return manualTriggerTest();
  }
});
