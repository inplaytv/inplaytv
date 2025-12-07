require('dotenv').config({ path: require('path').join(__dirname, '..', 'apps', 'admin', '.env.local') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== FIXING COMPETITION REGISTRATION TIMES ===\n');
  
  // Get all active tournaments and their competitions
  const { data: before, error: beforeErr } = await client
    .from('tournament_competitions')
    .select(`
      id,
      reg_close_at,
      status,
      tournament_id,
      tournaments!tournament_competitions_tournament_id_fkey (name, slug, round_1_start, round_2_start, round_3_start, round_4_start, status),
      competition_types (name, slug)
    `);
  
  if (beforeErr) {
    console.error('Error fetching data:', beforeErr);
    return;
  }
  
  // Filter to only active tournaments
  const active = before.filter(c => 
    c.tournaments && 
    !['completed', 'cancelled'].includes(c.tournaments.status)
  );
  
  console.log('BEFORE UPDATE:');
  console.table(active.map(c => ({
    tournament: c.tournaments.name.substring(0, 30),
    competition: c.competition_types.name,
    reg_close_at: c.reg_close_at,
    status: c.status
  })));
  
  console.log('\n=== APPLYING FIXES ===\n');
  
  // Group by competition type and update
  let updatedCount = 0;
  
  for (const comp of active) {
    const tournament = comp.tournaments;
    const compType = comp.competition_types;
    let newRegClose = null;
    
    // Determine the correct registration close time based on competition type
    switch (compType.slug) {
      case 'final-strike':
        if (tournament.round_4_start) {
          newRegClose = new Date(new Date(tournament.round_4_start).getTime() - 15 * 60 * 1000);
        }
        break;
      case 'first-to-strike':
      case 'beat-the-cut':
      case 'full-course':
        if (tournament.round_1_start) {
          newRegClose = new Date(new Date(tournament.round_1_start).getTime() - 15 * 60 * 1000);
        }
        break;
      case 'the-weekender':
        if (tournament.round_3_start) {
          newRegClose = new Date(new Date(tournament.round_3_start).getTime() - 15 * 60 * 1000);
        }
        break;
    }
    
    if (newRegClose && newRegClose.toISOString() !== comp.reg_close_at) {
      const { error: updateErr } = await client
        .from('tournament_competitions')
        .update({
          reg_close_at: newRegClose.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', comp.id);
      
      if (updateErr) {
        console.error(`❌ Failed to update ${compType.name} for ${tournament.name}:`, updateErr);
      } else {
        console.log(`✅ Updated ${compType.name} for ${tournament.name}`);
        console.log(`   Old: ${comp.reg_close_at}`);
        console.log(`   New: ${newRegClose.toISOString()}`);
        updatedCount++;
      }
    }
  }
  
  console.log(`\n=== COMPLETED: ${updatedCount} competitions updated ===\n`);
  
  // Verify Nedbank specifically
  const { data: nedbank } = await client
    .from('tournament_competitions')
    .select(`
      id,
      reg_close_at,
      status,
      tournaments!tournament_competitions_tournament_id_fkey (name, round_4_start),
      competition_types (name)
    `)
    .eq('tournaments.slug', 'nedbank-golf-challenge-in-honour-of-gary-player')
    .eq('competition_types.slug', 'final-strike')
    .single();
  
  if (nedbank) {
    const round4Start = new Date(nedbank.tournaments.round_4_start);
    const regClose = new Date(nedbank.reg_close_at);
    const minutesBefore = (round4Start - regClose) / 1000 / 60;
    
    console.log('=== NEDBANK FINAL STRIKE VERIFICATION ===');
    console.log('Tournament:', nedbank.tournaments.name);
    console.log('Round 4 Start:', round4Start.toISOString());
    console.log('Reg Close:', regClose.toISOString());
    console.log('Minutes before start:', minutesBefore);
    console.log('Status:', nedbank.status);
    console.log(minutesBefore === 15 ? '✅ CORRECT' : '❌ STILL WRONG');
  }
})().catch(console.error);
