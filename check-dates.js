const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateDates() {
  // Get Nedbank tournament
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, start_date, end_date')
    .eq('slug', 'nedbank-golf-challenge-in-honour-of-gary-player')
    .single();

  console.log('Tournament:', {
    name: tournament.name,
    start_date: tournament.start_date,
    end_date: tournament.end_date
  });

  // Get competitions
  const { data: competitions, error } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      status,
      reg_open_at,
      reg_close_at,
      competition_types (name, slug)
    `)
    .eq('tournament_id', tournament.id);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\nUpdating competition deadlines...');
  
  // Define proper close times based on competition type
  // Full Course, First Strike, Beat The Cut close before R1 (Dec 4)
  // THE WEEKENDER closes before R3 (Dec 6)
  // Final Strike closes before R4 (Dec 7)
  // ONE 2 ONE stays open throughout (closes Dec 7 end)
  
  for (const comp of competitions) {
    const typeName = comp.competition_types.name;
    let newCloseDate;
    
    if (['Full Course', 'First To Strike', 'Beat The Cut'].includes(typeName)) {
      // Close before R1 starts (Dec 4 midnight)
      newCloseDate = '2025-12-04T00:00:00+00:00';
    } else if (typeName === 'THE WEEKENDER') {
      // Close before R3 starts (Dec 6 midnight)
      newCloseDate = '2025-12-06T00:00:00+00:00';
    } else if (typeName === 'Final Strike') {
      // Close before R4 starts (Dec 7 midnight)
      newCloseDate = '2025-12-07T00:00:00+00:00';
    } else if (typeName === 'ONE 2 ONE') {
      // Stays open throughout tournament (close at end of tournament)
      newCloseDate = '2025-12-07T23:59:00+00:00';
    }
    
    console.log(`\n${typeName}:`);
    console.log('  Current close:', comp.reg_close_at);
    console.log('  New close:', newCloseDate);
    
    // Update the competition
    const { error: updateError } = await supabase
      .from('tournament_competitions')
      .update({ reg_close_at: newCloseDate })
      .eq('id', comp.id);
    
    if (updateError) {
      console.error(`  ❌ Error updating ${typeName}:`, updateError);
    } else {
      console.log(`  ✅ Updated ${typeName}`);
    }
  }
  
  console.log('\n✨ All updates complete!');
}

updateDates().catch(console.error);
