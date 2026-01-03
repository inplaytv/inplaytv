import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { 
      start_date,
      end_date,
      registration_opens_at, 
      registration_closes_at,
      round_1_start,
      round_2_start,
      round_3_start,
      round_4_start
    } = await request.json();

    // Validate required fields
    if (!registration_opens_at || !registration_closes_at) {
      return NextResponse.json(
        { error: 'Both registration_opens_at and registration_closes_at are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const opensAt = new Date(registration_opens_at);
    const closesAt = new Date(registration_closes_at);

    if (isNaN(opensAt.getTime()) || isNaN(closesAt.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (closesAt <= opensAt) {
      return NextResponse.json(
        { error: 'Registration close time must be after open time' },
        { status: 400 }
      );
    }

    // Get tournament to validate
    const { data: tournament, error: tournamentFetchError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', params.id)
      .single();

    if (tournamentFetchError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Validate that registration closes before tournament ends
    // Use the new end_date if provided, otherwise use existing tournament end_date
    const effectiveEndDate = end_date || tournament.end_date;
    if (!effectiveEndDate) {
      return NextResponse.json(
        { error: 'Tournament must have an end date' },
        { status: 400 }
      );
    }
    const tournamentEnd = new Date(effectiveEndDate);
    if (closesAt > tournamentEnd) {
      return NextResponse.json(
        { error: 'Registration must close before the tournament ends' },
        { status: 400 }
      );
    }

    // Build updates object with tournament dates, registration times and round tee times
    interface TournamentUpdates {
      start_date?: string;
      end_date?: string;
      registration_opens_at: string;
      registration_closes_at: string;
      updated_at: string;
      round_1_start?: string;
      round_2_start?: string;
      round_3_start?: string;
      round_4_start?: string;
    }

    const updates: TournamentUpdates = {
      registration_opens_at,
      registration_closes_at,
      updated_at: new Date().toISOString()
    };

    // Add tournament dates if provided
    if (start_date) updates.start_date = start_date;
    if (end_date) updates.end_date = end_date;

    // Add round tee times if provided
    if (round_1_start) updates.round_1_start = round_1_start;
    if (round_2_start) updates.round_2_start = round_2_start;
    if (round_3_start) updates.round_3_start = round_3_start;
    if (round_4_start) updates.round_4_start = round_4_start;

    console.log('[Registration] Updating tournament with:', updates);

    // Update tournament - the ct.rounds_covered error might be from a view but update may still work
    const { error: updateError } = await supabase
      .from('tournaments')
      .update(updates)
      .eq('id', params.id);

    if (updateError) {
      console.error('Error updating registration windows:', updateError);
      console.error('Full error object:', JSON.stringify(updateError, null, 2));
      return NextResponse.json(
        { 
          error: 'Failed to update registration windows',
          details: updateError.message,
          code: updateError.code,
          hint: updateError.hint,
          fullError: updateError
        },
        { status: 500 }
      );
    }

    console.log('[Registration] Update completed successfully');

    // Fetch the updated tournament
    const { data: updatedTournament, error: fetchError } = await supabase
      .from('tournaments')
      .select('id, name, registration_opens_at, registration_closes_at, round_1_start, round_2_start, round_3_start, round_4_start, updated_at')
      .eq('id', params.id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching updated tournament:', fetchError);
      // Update succeeded but fetch failed - still count as success
      console.log('[Registration] Update was successful despite fetch error');
    }

    // Auto-calculate competition registration times based on round tee times
    console.log('[Registration] Auto-syncing competition times from lifecycle...');
    
    // CRITICAL: Calculate times manually to ensure it ALWAYS happens
    // (Don't rely on fetch to another endpoint which can fail)
    try {
      // Fetch tournament data again to ensure we have latest round times
      const { data: latestTournament } = await supabase
        .from('tournaments')
        .select('id, registration_opens_at, round_1_start, round_2_start, round_3_start, round_4_start')
        .eq('id', params.id)
        .single();
      
      console.log('[Registration] Latest tournament round times:', {
        round_1: latestTournament?.round_1_start,
        round_2: latestTournament?.round_2_start,
        round_3: latestTournament?.round_3_start,
        round_4: latestTournament?.round_4_start
      });

      const { data: competitions } = await supabase
        .from("tournament_competitions")
        .select("id, competition_types!inner(name, round_start)")
        .eq("tournament_id", params.id);

      console.log(`[Registration] Found ${competitions?.length || 0} InPlay competitions to sync`);

      if (competitions && competitions.length > 0 && latestTournament) {
        const now = new Date();
        const BUFFER_MS = 15 * 60 * 1000; // 15 minutes
        let syncedCount = 0;

        for (const comp of competitions) {
          const roundStart = (comp.competition_types as any).round_start || 1;
          const roundKey = `round_${roundStart}_start` as keyof typeof latestTournament;
          const teeTime = latestTournament[roundKey] || null;

          console.log(`[Registration] Processing ${(comp.competition_types as any).name} - Round ${roundStart}, tee time: ${teeTime}`);

          if (!teeTime) {
            console.log(`[Registration] ⚠️ No tee time for ${(comp.competition_types as any).name} (Round ${roundStart})`);
            continue;
          }

          const regCloseAt = new Date(new Date(teeTime as string).getTime() - BUFFER_MS);
          const status = now >= regCloseAt ? "registration_closed" : 
                        (latestTournament.registration_opens_at && now >= new Date(latestTournament.registration_opens_at)) ? "registration_open" : 
                        "upcoming";

          const updateData = {
            reg_open_at: latestTournament.registration_opens_at,
            reg_close_at: regCloseAt.toISOString(),
            start_at: teeTime,
            status
          };
          
          console.log(`[Registration] Updating ${(comp.competition_types as any).name} with:`, updateData);

          await supabase.from("tournament_competitions").update(updateData).eq("id", comp.id);

          syncedCount++;
        }

        console.log(`[Registration] ✅ Synced ${syncedCount} InPlay competitions directly`);
      } else {
        console.log('[Registration] ℹ️ No InPlay competitions found to sync or tournament data missing');
      }
    } catch (syncError) {
      console.error('[Registration] ❌ Failed to sync competition times:', syncError);
      // Still return success for tournament update, but log the sync failure
    }

    return NextResponse.json({ 
      success: true,
      tournament: updatedTournament 
    });
  } catch (error) {
    console.error('Error in registration update endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
