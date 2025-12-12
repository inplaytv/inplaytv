import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Manually sync golfers for an existing tournament from DataGolf
 * POST /api/tournaments/[id]/sync-golfers
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: tournamentId } = params;
    const { tour, replace } = await request.json();
    
    if (!tournamentId) {
      return NextResponse.json(
        { success: false, error: 'Tournament ID required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Syncing golfers for tournament ${tournamentId}...`);

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, name, slug')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Determine tour parameter (default to pga if not specified)
    const tourParam = tour || 'pga';

    // Fetch current field from DataGolf
    const apiKey = process.env.DATAGOLF_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'DataGolf API key not configured' },
        { status: 500 }
      );
    }

    const dgRes = await fetch(
      `https://feeds.datagolf.com/field-updates?tour=${tourParam}&file_format=json&key=${apiKey}`
    );

    if (!dgRes.ok) {
      console.error(`❌ DataGolf API error: ${dgRes.status} ${dgRes.statusText}`);
      throw new Error(`DataGolf API returned ${dgRes.status}`);
    }

    let fieldData = await dgRes.json();
    console.log(`📡 DataGolf field-updates response:`, {
      event: fieldData.event_name,
      fieldCount: fieldData.field?.length || 0,
      tour: tourParam,
    });

    // If field-updates returns no data, try live-tournament-stats as fallback
    if (!fieldData.field || fieldData.field.length === 0) {
      console.log('⚠️ No field data from field-updates, trying live-tournament-stats...');
      
      const liveStatsRes = await fetch(
        `https://feeds.datagolf.com/preds/live-tournament-stats?tour=${tourParam}&file_format=json&key=${apiKey}`
      );
      
      if (liveStatsRes.ok) {
        const liveStatsData = await liveStatsRes.json();
        console.log(`📡 DataGolf live-tournament-stats response:`, {
          event: liveStatsData.event_name,
          playerCount: liveStatsData.live_stats?.length || 0,
        });
        
        if (liveStatsData.live_stats && liveStatsData.live_stats.length > 0) {
          // Convert live stats format to field format
          fieldData = {
            event_name: liveStatsData.event_name,
            course_name: liveStatsData.course_name,
            field: liveStatsData.live_stats.map((player: any) => ({
              dg_id: player.dg_id,
              player_name: player.player_name,
              country: player.country || 'USA', // Default if not provided
            })),
          };
          console.log(`✅ Converted ${fieldData.field.length} players from live stats`);
        }
      }
    }

    if (!fieldData.field || fieldData.field.length === 0) {
      console.warn('⚠️ No field data from any DataGolf endpoint:', fieldData);
      return NextResponse.json({
        success: false,
        error: 'No field data available from DataGolf',
        message: 'Tournament field may not be announced yet or tournament is not current. Tried field-updates and live-tournament-stats endpoints.',
        dataGolfResponse: fieldData,
      });
    }

    console.log(`✅ Found ${fieldData.field.length} golfers from DataGolf`);
    console.log(`📋 Event: ${fieldData.event_name}`);
    console.log(`🔍 First player sample:`, fieldData.field[0]);
    console.log(`🔍 DataGolf response keys:`, Object.keys(fieldData));
    console.log(`🔍 Field is array:`, Array.isArray(fieldData.field));

    // Fetch world rankings from DataGolf to get OWGR data
    console.log('📊 Fetching world rankings for salary calculation...');
    let rankingsMap = new Map();
    try {
      const rankingsRes = await fetch(
        `https://feeds.datagolf.com/preds/get-dg-rankings?file_format=json&key=${apiKey}`
      );
      
      if (rankingsRes.ok) {
        const rankingsData = await rankingsRes.json();
        // Create a map of dg_id -> owgr_rank for quick lookup
        rankingsData.rankings.forEach((player: any) => {
          rankingsMap.set(player.dg_id, {
            owgr_rank: player.owgr_rank,
            dg_skill: player.dg_skill_estimate,
          });
        });
        console.log(`✅ Loaded rankings for ${rankingsMap.size} players`);
      }
    } catch (rankingsError) {
      console.warn('⚠️ Could not fetch rankings, will use defaults:', rankingsError);
    }

    // Extract tee times from field data (find earliest tee time for each round)
    const roundTeeTimes = {
      round1: null as string | null,
      round2: null as string | null,
      round3: null as string | null,
      round4: null as string | null,
    };

    fieldData.field.forEach((player: any) => {
      if (player.r1_teetime && (!roundTeeTimes.round1 || player.r1_teetime < roundTeeTimes.round1)) {
        roundTeeTimes.round1 = player.r1_teetime;
      }
      if (player.r2_teetime && (!roundTeeTimes.round2 || player.r2_teetime < roundTeeTimes.round2)) {
        roundTeeTimes.round2 = player.r2_teetime;
      }
      if (player.r3_teetime && (!roundTeeTimes.round3 || player.r3_teetime < roundTeeTimes.round3)) {
        roundTeeTimes.round3 = player.r3_teetime;
      }
      if (player.r4_teetime && (!roundTeeTimes.round4 || player.r4_teetime < roundTeeTimes.round4)) {
        roundTeeTimes.round4 = player.r4_teetime;
      }
    });

    console.log('⏰ Round tee times:', roundTeeTimes);

    // Update tournament with tee times if we have them
    let teeTimesUpdated = false;
    if (roundTeeTimes.round1 || roundTeeTimes.round2 || roundTeeTimes.round3 || roundTeeTimes.round4) {
      const teeTimeUpdate: any = {};
      if (roundTeeTimes.round1) teeTimeUpdate.round1_tee_time = roundTeeTimes.round1;
      if (roundTeeTimes.round2) teeTimeUpdate.round2_tee_time = roundTeeTimes.round2;
      if (roundTeeTimes.round3) teeTimeUpdate.round3_tee_time = roundTeeTimes.round3;
      if (roundTeeTimes.round4) teeTimeUpdate.round4_tee_time = roundTeeTimes.round4;

      const { error: teeTimeError } = await supabase
        .from('tournaments')
        .update(teeTimeUpdate)
        .eq('id', tournamentId);

      if (teeTimeError) {
        console.error('⚠️ Error updating tee times:', teeTimeError);
      } else {
        console.log('✅ Updated tournament tee times');
        teeTimesUpdated = true;
        
        // Auto-trigger Calculate Times to update competition registration close times
        console.log('🔄 Auto-calculating competition times...');
        try {
          const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '') || 'http://localhost:3002';
          const calculateUrl = `${baseUrl}/api/tournaments/${tournamentId}/competitions/calculate-times`;
          const calculateRes = await fetch(calculateUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (calculateRes.ok) {
            const calcData = await calculateRes.json();
            console.log(`✅ Auto-calculated times for ${calcData.updated} competitions`);
          } else {
            console.warn('⚠️ Could not auto-calculate competition times');
          }
        } catch (calcError) {
          console.warn('⚠️ Error auto-calculating competition times:', calcError);
        }
      }
    }

    // If replace=true, remove existing golfers first
    if (replace) {
      console.log('🗑️ Removing existing tournament golfers...');
      const { error: deleteError } = await supabase
        .from('tournament_golfers')
        .delete()
        .eq('tournament_id', tournamentId);

      if (deleteError) {
        console.error('⚠️ Error removing existing golfers:', deleteError);
      } else {
        console.log('✅ Existing golfers removed');
      }
    }

    // Get or create golfers and link to tournament
    const golfersToInsert = [];
    let created = 0;
    let existing = 0;
    let rankingsUpdated = 0;

    for (const player of fieldData.field) {
      // Get OWGR rank from rankings data
      const rankingData = rankingsMap.get(player.dg_id);
      const worldRank = rankingData?.owgr_rank || null;

      // Debug: Log first few players
      if (created + existing < 3) {
        console.log(`🔍 Player: ${player.player_name} (dg_id: ${player.dg_id}) - OWGR: ${worldRank}`);
      }

      // Check if golfer exists
      const { data: existingGolfer } = await supabase
        .from('golfers')
        .select('id, world_rank')
        .eq('dg_id', player.dg_id)
        .single();

      let golferId;

      if (!existingGolfer) {
        // Create new golfer - split name into first and last
        const nameParts = player.player_name.split(' ');
        const firstName = nameParts[0] || player.player_name;
        const lastName = nameParts.slice(1).join(' ') || '-';
        
        const { data: newGolfer, error: insertError } = await supabase
          .from('golfers')
          .insert({
            dg_id: player.dg_id,
            name: player.player_name, // REQUIRED: Full name
            first_name: firstName,
            last_name: lastName,
            country: player.country,
            pga_tour_id: player.pga_number?.toString(),
            world_rank: worldRank, // Add OWGR rank
          })
          .select('id')
          .single();

        if (insertError) {
          console.error(`⚠️ Error creating golfer ${player.player_name}:`, insertError);
        } else {
          golferId = newGolfer?.id;
          created++;
          if (worldRank) rankingsUpdated++;
        }
      } else {
        golferId = existingGolfer.id;
        existing++;
        
        // Update world_rank if we have new data (even if current is null)
        if (worldRank !== null && worldRank !== existingGolfer.world_rank) {
          const { error: updateError } = await supabase
            .from('golfers')
            .update({ world_rank: worldRank })
            .eq('id', golferId);
          
          if (!updateError) {
            rankingsUpdated++;
          }
        }
      }

      if (golferId) {
        golfersToInsert.push({
          tournament_id: tournamentId,
          golfer_id: golferId,
          status: 'confirmed',
        });
      }
    }

    console.log(`📊 Golfers processed: ${created} new, ${existing} existing`);
    console.log(`🏆 World rankings updated: ${rankingsUpdated} players`);

    // Insert tournament_golfers relationships (use upsert to handle duplicates)
    let golfersAdded = 0;
    if (golfersToInsert.length > 0) {
      // Use upsert to insert new and update existing (onConflict handles duplicates)
      const { data: addedGolfers, error: golfersError } = await supabase
        .from('tournament_golfers')
        .upsert(golfersToInsert, {
          onConflict: 'tournament_id,golfer_id',
          ignoreDuplicates: false, // Update if exists
        })
        .select();

      if (golfersError) {
        console.error('❌ Error upserting golfers:', golfersError);
        throw golfersError;
      } else if (addedGolfers) {
        golfersAdded = addedGolfers.length;
        console.log(`✅ Upserted ${golfersAdded} golfers to tournament (new + existing)`);
      }
    }

    // ========================================================================
    // STEP 3: AUTO-CREATE GOLFER GROUP AND LINK TO COMPETITIONS
    // ========================================================================
    console.log('👥 Creating/updating golfer group...');
    
    const groupName = `${tournament.name} - Field`;
    const groupSlug = `${tournament.slug}-field`;

    // Check if group exists
    const { data: existingGroup } = await supabase
      .from('golfer_groups')
      .select('id')
      .eq('slug', groupSlug)
      .single();

    let groupId;

    if (existingGroup) {
      // Update existing group
      groupId = existingGroup.id;
      console.log(`♻️ Using existing group: ${groupId}`);
      
      // Clear existing golfers from group
      await supabase
        .from('golfer_group_members')
        .delete()
        .eq('group_id', groupId);
      
      console.log('🗑️ Cleared old group members');
    } else {
      // Create new group
      const { data: newGroup, error: groupError } = await supabase
        .from('golfer_groups')
        .insert({
          name: groupName,
          slug: groupSlug,
          description: `Tournament field for ${tournament.name}`,
        })
        .select('id')
        .single();

      if (groupError) {
        console.error('⚠️ Error creating group:', groupError);
      } else {
        groupId = newGroup.id;
        console.log(`✅ Created new group: ${groupId}`);
      }
    }

    // Add all tournament golfers to the group
    if (groupId) {
      const { data: tournamentGolfers } = await supabase
        .from('tournament_golfers')
        .select('golfer_id')
        .eq('tournament_id', tournamentId);

      if (tournamentGolfers && tournamentGolfers.length > 0) {
        const groupMembers = tournamentGolfers.map(tg => ({
          group_id: groupId,
          golfer_id: tg.golfer_id,
        }));

        const { error: membersError } = await supabase
          .from('golfer_group_members')
          .insert(groupMembers);

        if (membersError) {
          console.error('⚠️ Error adding golfers to group:', membersError);
        } else {
          console.log(`✅ Added ${groupMembers.length} golfers to group`);
        }
      }

      // Link group to ALL competitions for this tournament
      console.log('🔗 Linking group to tournament competitions...');
      
      const { data: competitions } = await supabase
        .from('tournament_competitions')
        .select('id')
        .eq('tournament_id', tournamentId);

      let competitionsLinked = 0;

      if (competitions && competitions.length > 0) {
        // Update each competition with assigned_golfer_group_id
        const { error: linkError } = await supabase
          .from('tournament_competitions')
          .update({ assigned_golfer_group_id: groupId })
          .in('id', competitions.map(c => c.id));

        if (linkError) {
          console.error('⚠️ Error linking group to competitions:', linkError);
        } else {
          competitionsLinked = competitions.length;
          console.log(`✅ Linked group to ${competitionsLinked} competitions`);
        }
      } else {
        console.log('⚠️ No competitions found for this tournament');
      }

      return NextResponse.json({
        success: true,
        tournament: {
          id: tournament.id,
          name: tournament.name,
          slug: tournament.slug,
        },
        dataGolfEvent: fieldData.event_name,
        golfersAdded,
        golfersCreated: created,
        golfersExisting: existing,
        replaced: replace || false,
        golferGroup: {
          id: groupId,
          name: groupName,
          slug: groupSlug,
        },
        competitionsLinked,
      });
    }

    return NextResponse.json({
      success: true,
      tournament: {
        id: tournament.id,
        name: tournament.name,
        slug: tournament.slug,
      },
      dataGolfEvent: fieldData.event_name,
      golfersAdded,
      golfersCreated: created,
      golfersExisting: existing,
      replaced: replace || false,
      golferGroup: null,
      competitionsLinked: 0,
    });

  } catch (error) {
    console.error('❌ Error syncing golfers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sync golfers' 
      },
      { status: 500 }
    );
  }
}
