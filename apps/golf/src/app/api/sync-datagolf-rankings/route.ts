import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const dataGolfKey = process.env.DATAGOLF_API_KEY!;

export const dynamic = 'force-dynamic';

/**
 * Syncs world rankings from DataGolf to our database
 * GET /api/sync-datagolf-rankings
 */
export async function GET(request: NextRequest) {
  try {
    console.log(`🔄 Syncing world rankings from DataGolf...`);

    // Fetch DataGolf rankings (top 500 players)
    const dataGolfUrl = `https://feeds.datagolf.com/preds/get-dg-rankings?file_format=json&key=${dataGolfKey}`;
    const response = await fetch(dataGolfUrl, { next: { revalidate: 3600 } });
    
    if (!response.ok) {
      throw new Error(`DataGolf API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`📊 Last updated: ${data.last_updated}`);
    console.log(`👥 Players in rankings: ${data.rankings?.length || 0}`);

    if (!data.rankings || data.rankings.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No rankings data available from DataGolf'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Match players and update rankings
    let matched = 0;
    let notMatched = 0;
    let updated = 0;
    const notMatchedPlayers: string[] = [];

    for (const player of data.rankings) {
      const playerName = player.player_name; // Format: "Last, First"
      const dgRank = player.datagolf_rank;
      const owgrRank = player.owgr_rank;

      // Use OWGR rank (Official World Golf Ranking)
      const worldRank = owgrRank && owgrRank !== 501 ? owgrRank : dgRank;

      // DataGolf format: "Hovland, Viktor"
      // Our format: "Viktor Hovland"
      const [lastName, firstName] = playerName.split(', ');
      const fullName = `${firstName} ${lastName}`.trim();

      // Try multiple name variations to find the player
      const { data: golfers, error } = await supabase
        .from('golfers')
        .select('id, full_name, first_name, last_name, world_rank')
        .or(`full_name.ilike.%${fullName}%,and(first_name.ilike.%${firstName}%,last_name.ilike.%${lastName}%)`)
        .limit(1);

      if (error) {
        console.error(`❌ Error finding ${fullName}:`, error);
        continue;
      }

      if (!golfers || golfers.length === 0) {
        notMatched++;
        notMatchedPlayers.push(fullName);
        continue;
      }

      matched++;
      const golfer = golfers[0];

      // Update world rank if different
      if (golfer.world_rank !== worldRank) {
        const { error: updateError } = await supabase
          .from('golfers')
          .update({ world_rank: worldRank })
          .eq('id', golfer.id);

        if (updateError) {
          console.error(`❌ Error updating ${fullName}:`, updateError);
        } else {
          updated++;
          console.log(`✅ ${fullName}: Rank ${golfer.world_rank || 'unranked'} → ${worldRank}`);
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Matched: ${matched}`);
    console.log(`   Not Matched: ${notMatched}`);
    console.log(`   Updated: ${updated}`);

    return NextResponse.json({
      success: true,
      last_updated: data.last_updated,
      stats: {
        total_players: data.rankings.length,
        matched,
        not_matched: notMatched,
        updated,
      },
      not_matched_players: notMatchedPlayers.slice(0, 20), // Only return first 20
    });

  } catch (error: any) {
    console.error('❌ Sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
