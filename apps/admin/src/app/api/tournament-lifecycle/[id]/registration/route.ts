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
    const { registration_opens_at, registration_closes_at } = await request.json();

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

    // Update tournament with registration windows
    const { data: updatedTournament, error: updateError } = await supabase
      .from('tournaments')
      .update({ 
        registration_opens_at,
        registration_closes_at,
        updated_at: new Date().toISOString()
      })
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
