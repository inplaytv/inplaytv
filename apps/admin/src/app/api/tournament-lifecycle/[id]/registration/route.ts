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
    const tournamentEnd = new Date(tournament.end_date);
    if (closesAt > tournamentEnd) {
      return NextResponse.json(
        { error: 'Registration must close before the tournament ends' },
        { status: 400 }
      );
    }

    // Build updates object with registration times and round tee times
    interface TournamentUpdates {
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
    try {
      // Construct the internal API URL correctly
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';
      const calculateUrl = `${baseUrl}/api/tournaments/${params.id}/competitions/calculate-times`;
      
      console.log('[Registration] Calling:', calculateUrl);
      
      const calculateRes = await fetch(calculateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (calculateRes.ok) {
        const calcData = await calculateRes.json();
        console.log(`[Registration] ✅ Synced ${calcData.updated} competitions from lifecycle`);
      } else {
        const errorText = await calculateRes.text();
        console.warn('[Registration] ⚠️ Could not sync competition times:', errorText);
      }
    } catch (calcError) {
      console.warn('[Registration] ⚠️ Competition time sync failed:', calcError);
      // Don't fail the whole request if this fails
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
