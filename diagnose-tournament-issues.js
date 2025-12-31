require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function diagnoseTournaments() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('\n=== TOURNAMENT DIAGNOSTIC ===\n');

  // Get all tournaments
  const { data: tournaments, error: tournamentsError } = await supabase
    .from('tournaments')
    .select('*')
    .order('start_date', { ascending: false });

  if (tournamentsError) {
    console.error('Error fetching tournaments:', tournamentsError);
    return;
  }

  console.log(`Found ${tournaments.length} tournaments:\n`);

  for (const tournament of tournaments) {
    console.log(`\n━━━ ${tournament.name} ━━━`);
    console.log(`ID: ${tournament.id}`);
    console.log(`Slug: ${tournament.slug}`);
    console.log(`Status: ${tournament.status}`);
    console.log(`Start: ${tournament.start_date}`);
    console.log(`End: ${tournament.end_date}`);
    console.log(`Reg Opens: ${tournament.registration_opens_at || 'NOT SET'}`);
    console.log(`Reg Closes: ${tournament.registration_closes_at || 'NOT SET'}`);

    // Get competitions for this tournament
    const { data: competitions, error: compsError } = await supabase
      .from('tournament_competitions')
      .select('*')
      .eq('tournament_id', tournament.id);

    if (compsError) {
      console.error('  ❌ Error fetching competitions:', compsError.message);
    } else {
      console.log(`\n  Competitions: ${competitions.length}`);
      
      for (const comp of competitions) {
        console.log(`\n    • ${comp.name}`);
        console.log(`      ID: ${comp.id}`);
        console.log(`      Status: ${comp.status}`);
        console.log(`      Format: ${comp.competition_format}`);
        console.log(`      Reg Open: ${comp.reg_open_at || 'NOT SET'}`);
        console.log(`      Reg Close: ${comp.reg_close_at || 'NOT SET'}`);
        console.log(`      Start: ${comp.start_at || 'NOT SET'}`);
        console.log(`      Golfer Group: ${comp.assigned_golfer_group_id || 'NOT ASSIGNED'}`);

        // Check entries
        const { data: entries, error: entriesError } = await supabase
          .from('competition_entries')
          .select('id, user_id, status')
          .eq('competition_id', comp.id);

        if (entriesError) {
          console.log(`      ❌ Error checking entries: ${entriesError.message}`);
        } else {
          console.log(`      Entries: ${entries.length}`);
          if (entries.length > 0) {
            const activeEntries = entries.filter(e => e.status === 'active').length;
            console.log(`        Active: ${activeEntries}`);
          }
        }

        // Check golfer group if assigned
        if (comp.assigned_golfer_group_id) {
          const { data: group, error: groupError } = await supabase
            .from('golfer_groups')
            .select('name')
            .eq('id', comp.assigned_golfer_group_id)
            .single();

          if (groupError) {
            console.log(`      ⚠️  Golfer group NOT FOUND (deleted?)`);
          } else {
            console.log(`      Group Name: ${group.name}`);
            
            // Count golfers in group
            const { data: members, error: membersError } = await supabase
              .from('golfer_group_members')
              .select('id')
              .eq('group_id', comp.assigned_golfer_group_id);

            if (!membersError) {
              console.log(`      Golfers in Group: ${members.length}`);
            }
          }
        }
      }
    }

    // Check golfer groups for this tournament
    const { data: groups, error: groupsError } = await supabase
      .from('golfer_groups')
      .select('id, name')
      .eq('tournament_id', tournament.id);

    if (!groupsError) {
      console.log(`\n  Golfer Groups: ${groups.length}`);
      groups.forEach(g => console.log(`    • ${g.name} (${g.id})`));
    }
  }

  // Check for FINAL STRIKE specifically
  console.log('\n\n=== SEARCHING FOR "FINAL STRIKE" ===\n');
  
  const { data: finalStrike } = await supabase
    .from('tournaments')
    .select('*')
    .ilike('name', '%final%strike%');

  if (finalStrike && finalStrike.length > 0) {
    console.log('✓ Found in tournaments table');
  } else {
    console.log('✗ NOT found in tournaments table');
  }

  const { data: finalStrikeComp } = await supabase
    .from('tournament_competitions')
    .select('*, tournaments(name)')
    .ilike('name', '%final%strike%');

  if (finalStrikeComp && finalStrikeComp.length > 0) {
    console.log('✓ Found in competitions table:');
    finalStrikeComp.forEach(c => {
      console.log(`  Tournament: ${c.tournaments?.name || 'UNKNOWN'}`);
      console.log(`  Competition: ${c.name}`);
      console.log(`  Status: ${c.status}`);
    });
  } else {
    console.log('✗ NOT found in competitions table');
  }
}

diagnoseTournaments().catch(console.error);
