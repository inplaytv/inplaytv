import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

/**
 * POST /api/one-2-one/instances/[instanceId]/activate
 * Activate a pending ONE 2 ONE competition (change status from 'pending' to 'open')
 * This makes the challenge visible on the Challenge Board
 * Note: URL still uses 'instanceId' for backwards compatibility, but queries tournament_competitions
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  console.log('🔵 Activation route called');
  
  try {
    const { instanceId } = await params;
    console.log('🔵 Competition ID from params:', instanceId);
    
    const supabase = await createServerClient();
    console.log('🔵 Supabase client created');

    console.log('🎯 Activating ONE 2 ONE competition:', instanceId);

    // Get current competition to verify it exists and is pending
    const { data: competition, error: fetchError } = await supabase
      .from('tournament_competitions')
      .select('id, status, current_players')
      .eq('id', instanceId)
      .eq('competition_format', 'one2one')
      .single();

    if (fetchError || !competition) {
      console.error('❌ Competition not found:', fetchError);
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    if (competition.status !== 'pending') {
      console.log('⚠️ Competition is not pending, current status:', competition.status);
      // If already open/active, that's fine - just return success
      if (competition.status === 'open') {
        return NextResponse.json({ 
          success: true, 
          message: 'Challenge already active' 
        });
      }
      return NextResponse.json(
        { error: `Cannot activate challenge with status: ${competition.status}` },
        { status: 400 }
      );
    }

    // Update status to 'open' to make it visible on Challenge Board
    const { data: updateData, error: updateError } = await supabase
      .from('tournament_competitions')
      .update({ 
        status: 'open',
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId)
      .select('id, status')
      .single();

    if (updateError) {
      console.error('❌ Failed to activate competition:', updateError);
      return NextResponse.json(
        { error: 'Failed to activate challenge' },
        { status: 500 }
      );
    }

    console.log('✅ Competition activated successfully:', updateData);

    return NextResponse.json({
      success: true,
      message: 'Challenge is now visible on the Challenge Board',
      status: updateData?.status || 'open'
    });
  } catch (error: any) {
    console.error('Activate instance error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
