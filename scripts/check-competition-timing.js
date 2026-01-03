#!/usr/bin/env node
/**
 * Competition Timing Health Check
 * Verifies that all InPlay competitions have correct registration times
 * based on their tournament's round tee times
 */

require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCompetitionTiming() {
  console.log('🔍 Checking competition timing health...\n');

  // Get all tournaments with competitions
  const { data: tournaments, error: tourError } = await supabase
    .from('tournaments')
    .select(`
      id,
      name,
      slug,
      registration_opens_at,
      round_1_start,
      round_2_start,
      round_3_start,
      round_4_start
    `)
    .order('start_date', { ascending: false })
    .limit(10);

  if (tourError) {
    console.error('❌ Error fetching tournaments:', tourError);
    process.exit(1);
  }

  let totalComps = 0;
  let correctComps = 0;
  let incorrectComps = 0;

  for (const tournament of tournaments) {
    // Get InPlay competitions only (exclude ONE 2 ONE)
    const { data: competitions, error: compError } = await supabase
      .from('tournament_competitions')
      .select('id, reg_close_at, start_at, status, competition_types!inner(name, round_start)')
      .eq('tournament_id', tournament.id)
      .eq('competition_format', 'inplay');

    if (compError) {
      console.error(`❌ Error fetching competitions for ${tournament.name}:`, compError);
      continue;
    }

    if (!competitions || competitions.length === 0) {
      console.log(`⚠️  ${tournament.name}: No InPlay competitions found`);
      continue;
    }

    console.log(`\n📋 ${tournament.name} (${competitions.length} competitions):`);

    for (const comp of competitions) {
      totalComps++;
      const roundStart = comp.competition_types.round_start;
      const expectedTeeTime = tournament[`round_${roundStart}_start`];

      if (!expectedTeeTime) {
        console.log(`   ⚠️  ${comp.competition_types.name}: No round ${roundStart} tee time in tournament`);
        continue;
      }

      // Expected: reg_close_at should be 15 minutes before start_at
      const expectedRegClose = new Date(new Date(expectedTeeTime).getTime() - 15 * 60000).toISOString();
      const actualRegClose = comp.reg_close_at;
      const actualStart = comp.start_at;

      const regCloseMatches = expectedRegClose === actualRegClose;
      const startMatches = expectedTeeTime === actualStart;

      if (regCloseMatches && startMatches) {
        correctComps++;
        console.log(`   ✅ ${comp.competition_types.name}: Correct (closes ${new Date(actualRegClose).toLocaleString('en-GB')})`);
      } else {
        incorrectComps++;
        console.log(`   ❌ ${comp.competition_types.name}: MISMATCH`);
        if (!startMatches) {
          console.log(`      Expected start_at: ${expectedTeeTime}`);
          console.log(`      Actual start_at:   ${actualStart}`);
        }
        if (!regCloseMatches) {
          console.log(`      Expected reg_close: ${expectedRegClose}`);
          console.log(`      Actual reg_close:   ${actualRegClose}`);
        }
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Summary:`);
  console.log(`   Total InPlay Competitions: ${totalComps}`);
  console.log(`   ✅ Correct Timing: ${correctComps}`);
  console.log(`   ❌ Incorrect Timing: ${incorrectComps}`);
  
  if (incorrectComps > 0) {
    console.log(`\n⚠️  Run this to fix timing issues:`);
    console.log(`   curl -X POST http://localhost:3002/api/tournaments/{tournament-id}/competitions/calculate-times`);
  } else {
    console.log(`\n✅ All competition timings are correct!`);
  }
}

checkCompetitionTiming().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
