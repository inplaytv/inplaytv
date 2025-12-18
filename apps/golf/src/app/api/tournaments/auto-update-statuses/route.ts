import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add a secret key check for security (for cron jobs)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_KEY || 'default-cron-secret';
    
    if (authHeader && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call tournament status update function
    const { data: tournamentData, error: tournamentError } = await supabase
      .rpc('auto_update_tournament_statuses');

    if (tournamentError) {
      console.error('Error updating tournament statuses:', tournamentError);
      return NextResponse.json(
        { error: 'Failed to update tournament statuses', details: tournamentError.message },
        { status: 500 }
      );
    }

    // Call competition status update function
    const { data: competitionData, error: competitionError } = await supabase
      .rpc('auto_update_competition_statuses');

    if (competitionError) {
      console.error('Error updating competition statuses:', competitionError);
      return NextResponse.json(
        { error: 'Failed to update competition statuses', details: competitionError.message },
        { status: 500 }
      );
    }

    // CRITICAL: Hide completed tournaments from golf app
    // This ensures completed tournaments don't show in the slider/list
    const { error: visibilityError } = await supabase
      .from('tournaments')
      .update({ is_visible: false })
      .eq('status', 'completed');

    if (visibilityError) {
      console.error('Error hiding completed tournaments:', visibilityError);
      // Don't fail the whole request, just log it
    }

    const result = {
      success: true,
      message: 'Statuses updated successfully',
      timestamp: new Date().toISOString(),
      tournaments: tournamentData?.[0] || { updated_count: 0 },
      competitions: competitionData?.[0] || { updated_count: 0 },
    };

    console.log('Auto-update results:', result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in auto status update:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Allow GET for manual triggering from browser
export async function GET(request: NextRequest) {
  return POST(request);
}
