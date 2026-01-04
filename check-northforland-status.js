require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== NORTHFORLAND OPEN INVESTIGATION ===\n');
  console.log('Current Time:', new Date().toISOString(), '\n');

  // 1. Check if auto-update functions exist
  console.log('1. Checking if auto-update RPC functions exist...');
  const { data: funcs, error: funcError } = await supabase.rpc('detect_tournament_status_mismatches').limit(0);
  
  if (funcError && funcError.code === '42883') {
    console.log('❌ AUTO-UPDATE FUNCTIONS DO NOT EXIST!');
    console.log('   Functions need to be created from: scripts/2025-01-auto-status-updater.sql\n');
  } else if (funcError) {
    console.log('❌ Error checking functions:', funcError.message, '\n');
  } else {
    console.log('✅ Auto-update functions exist\n');
  }

  // 2. Get NORTHFORLAND OPEN details
  console.log('2. NORTHFORLAND OPEN Tournament Status:');
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, status, start_date, end_date, registration_opens_at, registration_closes_at')
    .ilike('name', '%NORTHFORLAND%')
    .single();

  if (tournament) {
    const now = new Date();
    const startDate = new Date(tournament.start_date);
    const endDate = new Date(tournament.end_date);
    const regOpens = tournament.registration_opens_at ? new Date(tournament.registration_opens_at) : null;
    const regCloses = tournament.registration_closes_at ? new Date(tournament.registration_closes_at) : null;

    console.log('   Name:', tournament.name);
    console.log('   Current Status:', tournament.status);
    console.log('   Start Date:', tournament.start_date);
    console.log('   End Date:', tournament.end_date);
    console.log('   Reg Opens:', tournament.registration_opens_at);
    console.log('   Reg Closes:', tournament.registration_closes_at);
    console.log('');
    console.log('   Tournament ended:', now > endDate ? '✅ YES (ended ' + Math.floor((now - endDate) / (1000 * 60 * 60 * 24)) + ' days ago)' : '❌ NO');
    console.log('   Days since end:', Math.floor((now - endDate) / (1000 * 60 * 60 * 24)));
    console.log('');
    
    if (tournament.status !== 'completed' && now > endDate) {
      console.log('   🚨 STATUS MISMATCH: Tournament ended but status is "' + tournament.status + '"');
      console.log('   ✅ Correct status should be: "completed"\n');
    }

    // 3. Check competitions
    console.log('3. Checking Competition Statuses:');
    const { data: comps } = await supabase
      .from('tournament_competitions')
      .select('id, status, start_at, end_at, competition_format')
      .eq('tournament_id', tournament.id);

    if (comps) {
      console.log('   Total competitions:', comps.length);
      comps.forEach((comp, i) => {
        const compEnd = new Date(comp.end_at);
        const ended = now > compEnd;
        console.log(`   Comp ${i + 1}: status="${comp.status}", ended=${ended ? 'YES' : 'NO'}, format=${comp.competition_format}`);
      });
      
      const wrongStatus = comps.filter(c => new Date(c.end_at) < now && c.status !== 'completed');
      if (wrongStatus.length > 0) {
        console.log(`\n   🚨 ${wrongStatus.length} competitions with wrong status!`);
      }
    }
  } else {
    console.log('   ❌ Tournament not found');
  }

  console.log('\n=== SOLUTION ===');
  console.log('Option 1: Run auto-update API manually:');
  console.log('   curl http://localhost:3003/api/tournaments/auto-update-statuses');
  console.log('\nOption 2: Apply database functions (if missing):');
  console.log('   1. Open Supabase SQL Editor');
  console.log('   2. Paste contents of scripts/2025-01-auto-status-updater.sql');
  console.log('   3. Execute');
  console.log('   4. Then run: SELECT * FROM auto_update_tournament_statuses();');
  console.log('\nOption 3: Set up cron job (Vercel):');
  console.log('   Add to vercel.json:');
  console.log('   {');
  console.log('     "crons": [{');
  console.log('       "path": "/api/tournaments/auto-update-statuses",');
  console.log('       "schedule": "*/5 * * * *"');
  console.log('     }]');
  console.log('   }');
})();
