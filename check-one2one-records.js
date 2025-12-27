require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRecords() {
  console.log('🔍 Checking ONE 2 ONE Records...\n');

  // 1. Check all ONE 2 ONE challenges
  const { data: challenges } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      status,
      current_players,
      max_players,
      entry_fee_pennies,
      created_at,
      tournaments!tournament_competitions_tournament_id_fkey(name)
    `)
    .eq('competition_format', 'one2one')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('📋 Latest 10 ONE 2 ONE Challenges:');
  console.log('═'.repeat(100));
  
  for (const c of challenges || []) {
    const tournamentName = c.tournaments?.name || 'Unknown';
    const statusEmoji = c.status === 'full' ? '🔴' : c.status === 'open' ? '🟡' : '⚪';
    
    console.log(`${statusEmoji} ${c.id.substring(0, 8)}... | ${c.status.padEnd(8)} | ${c.current_players}/${c.max_players} players | ${tournamentName.substring(0, 30)}`);
    
    // Check entries for this challenge
    const { data: entries } = await supabase
      .from('competition_entries')
      .select(`
        id,
        status,
        created_at,
        profiles!competition_entries_user_id_fkey(display_name)
      `)
      .eq('competition_id', c.id)
      .eq('status', 'submitted');
    
    if (entries && entries.length > 0) {
      entries.forEach((e, i) => {
        const playerName = e.profiles?.display_name || 'Unknown';
        console.log(`  ${i + 1}. ${playerName} (entry: ${e.id.substring(0, 8)}...)`);
      });
    }
    console.log('');
  }

  console.log('═'.repeat(100));
  console.log('');

  // 2. Check for status mismatches
  console.log('⚠️  Checking for Status Mismatches...\n');
  
  for (const c of challenges || []) {
    const { data: entries } = await supabase
      .from('competition_entries')
      .select('id')
      .eq('competition_id', c.id)
      .eq('status', 'submitted');
    
    const actualCount = entries?.length || 0;
    const expectedStatus = actualCount === 0 ? 'pending' : actualCount === 1 ? 'open' : 'full';
    
    if (actualCount !== c.current_players || c.status !== expectedStatus) {
      console.log(`❌ Mismatch: ${c.id.substring(0, 8)}...`);
      console.log(`   Database: status='${c.status}', current_players=${c.current_players}`);
      console.log(`   Actual:   ${actualCount} submitted entries (should be '${expectedStatus}')`);
      console.log('');
    }
  }

  console.log('✅ Check complete!\n');
}

checkRecords().catch(console.error);
