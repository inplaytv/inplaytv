import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['upcoming', 'registration_open', 'live', 'completed', 'cancelled'];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    // Validate status
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`🔄 Updating tournament ${id} status to: ${status}`);

    // Get tournament details first for validation
    const { data: tournament, error: fetchError } = await supabase
      .from('tournaments')
      .select('*, tournament_golfers(count)')
      .eq('id', id)
      .single();

    if (fetchError || !tournament) {
      console.error('❌ Tournament not found:', fetchError);
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Validation rules
    if (status === 'registration_open') {
      const golferCount = tournament.tournament_golfers?.[0]?.count || 0;
      if (golferCount === 0) {
        return NextResponse.json(
          { error: 'Cannot open registration: No golfers assigned to this tournament' },
          { status: 400 }
        );
      }
    }

    if (status === 'live') {
      // Check if we have competitions (FIXED: use tournament_competitions table)
      const { count: competitionCount } = await supabase
        .from('tournament_competitions')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', id);

      if (competitionCount === 0) {
        return NextResponse.json(
          { error: 'Cannot start tournament: No competitions created yet' },
          { status: 400 }
        );
      }
    }

    // Update tournament status
    const { data: updatedTournament, error: updateError } = await supabase
      .from('tournaments')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating tournament status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update tournament status' },
        { status: 500 }
      );
    }

    console.log(`✅ Tournament status updated to: ${status}`);

    return NextResponse.json({ 
      success: true,
      tournament: updatedTournament 
    });
  } catch (error) {
    console.error('❌ Error in status update endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
