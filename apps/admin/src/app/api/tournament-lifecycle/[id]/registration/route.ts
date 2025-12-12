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
      round1_tee_time,
      round2_tee_time,
      round3_tee_time,
      round4_tee_time
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
    const { data: tournament, error: fetchError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Validate that registration closes before tournament starts
    const tournamentStart = new Date(tournament.start_date);
    if (closesAt >= tournamentStart) {
      return NextResponse.json(
        { error: 'Registration must close before the tournament starts' },
        { status: 400 }
      );
    }

    // Build updates object with registration times and round tee times
    interface TournamentUpdates {
      registration_opens_at: string;
      registration_closes_at: string;
      updated_at: string;
      round1_tee_time?: string;
      round2_tee_time?: string;
      round3_tee_time?: string;
      round4_tee_time?: string;
    }

    const updates: TournamentUpdates = {
      registration_opens_at,
      registration_closes_at,
      updated_at: new Date().toISOString()
    };

    // Add round tee times if provided
    if (round1_tee_time) updates.round1_tee_time = round1_tee_time;
    if (round2_tee_time) updates.round2_tee_time = round2_tee_time;
    if (round3_tee_time) updates.round3_tee_time = round3_tee_time;
    if (round4_tee_time) updates.round4_tee_time = round4_tee_time;

    console.log('[Registration] Updating tournament with:', updates);

    // Update tournament with registration windows and round tee times
    const { data: updatedTournament, error: updateError } = await supabase
      .from('tournaments')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating registration windows:', updateError);
      return NextResponse.json(
        { error: 'Failed to update registration windows' },
        { status: 500 }
      );
    }

    // Auto-calculate competition registration times based on round tee times
    console.log('[Registration] Auto-calculating competition times...');
    try {
      const calculateUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '')}/api/tournaments/${params.id}/competitions/calculate-times`;
      const calculateRes = await fetch(calculateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (calculateRes.ok) {
        const calcData = await calculateRes.json();
        console.log(`[Registration] ✅ Auto-calculated times for ${calcData.updated} competitions`);
      } else {
        console.warn('[Registration] ⚠️ Could not auto-calculate competition times');
      }
    } catch (calcError) {
      console.warn('[Registration] ⚠️ Competition time calculation failed:', calcError);
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
