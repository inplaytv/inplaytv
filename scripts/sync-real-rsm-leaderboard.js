import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qemosikbhrnstcormhuz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';
const DATAGOLF_API_KEY = process.env.DATAGOLF_API_KEY || 'ac7793fb5f617626ccc418008832';
const TOURNAMENT_ID = 'd9cdd4d8-75bc-401c-9472-c297bfa718ce';

async function syncRealLeaderboard() {
  console.log('🏌️ Fetching RSM Classic live leaderboard from DataGolf...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    // Fetch live leaderboard from DataGolf
    const url = `https://feeds.datagolf.com/preds/in-play?tour=pga&key=${DATAGOLF_API_KEY}`;
    const response = await fetch(url);
    const rsmData = await response.json();
    
    if (!rsmData.info || !rsmData.data) {
      console.log('❌ Invalid response from DataGolf API');
      return;
    }
    
    console.log(`✅ Found: ${rsmData.info.event_name}`);
    console.log(`📅 Current Round: ${rsmData.info.current_round}`);
    console.log(`⏰ Last Update: ${rsmData.info.last_update}`);
    console.log(`📊 Total field: ${rsmData.data.length} golfers\n`);
    
    // Filter to only players who made the cut
    const activePlayers = rsmData.data
      .filter(p => p.current_pos !== 'CUT')
      .sort((a, b) => a.current_score - b.current_score)
      .slice(0, 25); // Top 25 for testing
    
    console.log(`✅ ${activePlayers.length} golfers made the cut\n`);
    console.log('🏆 Top 25 Leaderboard:\n');
    activePlayers.forEach((player, idx) => {
      const score = player.current_score > 0 ? `+${player.current_score}` : player.current_score;
      console.log(`${player.current_pos.padEnd(4)} ${player.player_name.padEnd(25)} ${score.toString().padStart(4)} (${player.R1}-${player.R2}-${player.R3})`);
    });
    
    console.log('\n📝 Adding golfers to database...\n');
    
    let added = 0;
    let skipped = 0;
    
    for (const player of activePlayers) {
      const nameParts = player.player_name.includes(',') 
        ? [player.player_name.split(',')[1]?.trim(), player.player_name.split(',')[0]?.trim()]
        : [player.player_name.split(' ')[0], player.player_name.split(' ').slice(1).join(' ')];
      
      // Check if golfer already exists by datagolf_id
      const { data: existingGolfer } = await supabase
        .from('golfers')
        .select('id')
        .eq('datagolf_id', player.dg_id)
        .single();
      
      let golferId = existingGolfer?.id;
      
      if (!golferId) {
        const { data: newGolfer, error: golferError } = await supabase
          .from('golfers')
          .insert({
            first_name: nameParts[0] || '',
            last_name: nameParts[1] || '',
            name: `${nameParts[0]} ${nameParts[1]}`.trim(),
            country: player.country || 'USA',
            datagolf_id: player.dg_id
          })
          .select('id')
          .single();
        
        if (golferError) {
          console.log(`❌ Error adding ${player.player_name}:`, golferError.message);
          skipped++;
          continue;
        }
        
        golferId = newGolfer.id;
      }
      
      // Add/update tournament_golfer entry
      const { error: tournamentGolferError } = await supabase
        .from('tournament_golfers')
        .upsert({
          tournament_id: TOURNAMENT_ID,
          golfer_id: golferId,
          r1_score: player.R1 ? player.R1 - 72 : null,
          r2_score: player.R2 ? player.R2 - 72 : null,
          r3_score: player.R3 ? player.R3 - 72 : null,
          r4_score: null,
          total_score: player.current_score || null,
          position: player.current_pos || null
        }, {
          onConflict: 'tournament_id,golfer_id'
        });
      
      if (tournamentGolferError) {
        console.log(`❌ Error linking ${player.player_name}:`, tournamentGolferError.message);
        skipped++;
      } else {
        console.log(`✅ Added ${player.player_name}`);
        added++;
      }
    }
    
    console.log(`\n🎯 Summary: ${added} golfers added, ${skipped} skipped`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

syncRealLeaderboard();
