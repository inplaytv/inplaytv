#!/usr/bin/env node
/**
 * Check and fix tournament round times that have been reset to 00:00
 * This affects registration close times for competitions
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🔍 Checking for tournaments with invalid round times...\n');

  // Get all active tournaments
  const { data: tournaments, error: tErr } = await supabase
    .from('tournaments')
    .select('*')
    .in('status', ['upcoming', 'registration_open', 'in_progress'])
    .order('start_date');

  if (tErr) {
    console.error('Error fetching tournaments:', tErr);
    return;
  }

  console.log(`Found ${tournaments.length} active tournaments\n`);

  const issues = [];

  for (const t of tournaments) {
    const problems = [];

    // Check if any round times are at midnight (00:00:00)
    for (let i = 1; i <= 4; i++) {
      const roundStart = t[`round_${i}_start`];
      if (roundStart) {
        const date = new Date(roundStart);
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        
        if (hours === 0 && minutes === 0) {
          problems.push(`Round ${i} time is 00:00 (likely reset)`);
        }
      } else {
        problems.push(`Round ${i} time is NULL`);
      }
    }

    if (problems.length > 0) {
      issues.push({
        tournament: t.name,
        slug: t.slug,
        id: t.id,
        start_date: t.start_date,
        problems,
        round_times: {
          round_1: t.round_1_start,
          round_2: t.round_2_start,
          round_3: t.round_3_start,
          round_4: t.round_4_start
        }
      });
    }
  }

  if (issues.length === 0) {
    console.log('✅ No issues found! All tournaments have valid round times.');
    return;
  }

  console.log(`⚠️  Found ${issues.length} tournaments with timing issues:\n`);
  
  issues.forEach((issue, i) => {
    console.log(`${i + 1}. ${issue.tournament} (${issue.slug})`);
    console.log(`   Start Date: ${issue.start_date}`);
    issue.problems.forEach(p => console.log(`   ❌ ${p}`));
    console.log(`   Round Times:`);
    console.log(`     R1: ${issue.round_times.round_1}`);
    console.log(`     R2: ${issue.round_times.round_2}`);
    console.log(`     R3: ${issue.round_times.round_3}`);
    console.log(`     R4: ${issue.round_times.round_4}`);
    console.log('');
  });

  // Check affected competitions
  console.log('\n📋 Checking affected competitions...\n');

  for (const issue of issues) {
    const { data: comps } = await supabase
      .from('tournament_competitions')
      .select(`
        id,
        reg_close_at,
        status,
        competition_types (name, slug)
      `)
      .eq('tournament_id', issue.id);

    if (comps && comps.length > 0) {
      console.log(`${issue.tournament}:`);
      comps.forEach(c => {
        const regCloseDate = new Date(c.reg_close_at);
        const isMidnight = regCloseDate.getUTCHours() === 0 && regCloseDate.getUTCMinutes() === 0;
        console.log(`  - ${c.competition_types.name}: ${c.reg_close_at} ${isMidnight ? '⚠️  MIDNIGHT' : ''} (${c.status})`);
      });
      console.log('');
    }
  }

  console.log('\n📝 To fix these issues, you need to:');
  console.log('1. Update round start times in tournament settings (admin panel)');
  console.log('2. Or run the fix SQL script for each tournament');
  console.log('\nExample fix for Hero World Challenge:');
  console.log('  node scripts/fix-hero-world-challenge-round-times.sql');
}

main().catch(console.error);
