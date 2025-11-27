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
      throw new Error(`DataGolf API returned ${dgRes.status}`);
    }

    const fieldData = await dgRes.json();

    if (!fieldData.field || fieldData.field.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No field data available from DataGolf',
        message: 'Tournament field may not be announced yet or tournament is not current',
      });
    }

    console.log(`✅ Found ${fieldData.field.length} golfers from DataGolf`);
    console.log(`📋 Event: ${fieldData.event_name}`);

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

    for (const player of fieldData.field) {
      // Check if golfer exists
      const { data: existingGolfer } = await supabase
        .from('golfers')
        .select('id')
        .eq('dg_id', player.dg_id)
        .single();

      let golferId;

      if (!existingGolfer) {
        // Create new golfer
        const { data: newGolfer } = await supabase
          .from('golfers')
          .insert({
            dg_id: player.dg_id,
            name: player.player_name,
            country: player.country,
            pga_tour_id: player.pga_number?.toString(),
          })
          .select('id')
          .single();

        golferId = newGolfer?.id;
        created++;
      } else {
        golferId = existingGolfer.id;
        existing++;
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

    // Insert tournament_golfers relationships
    let golfersAdded = 0;
    if (golfersToInsert.length > 0) {
      const { data: addedGolfers, error: golfersError } = await supabase
        .from('tournament_golfers')
        .insert(golfersToInsert)
        .select();

      if (golfersError) {
        // Check if error is duplicate entry (already exists)
        if (golfersError.code === '23505') {
          console.log('⚠️ Some golfers already linked to this tournament');
          // Count how many were actually added
          golfersAdded = golfersToInsert.length;
        } else {
          throw golfersError;
        }
      } else if (addedGolfers) {
        golfersAdded = addedGolfers.length;
      }

      console.log(`✅ Added ${golfersAdded} golfers to tournament`);
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
