import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

/**
 * POST /api/one-2-one/instances/[instanceId]/activate
 * Activate a pending ONE 2 ONE instance (change status from 'pending' to 'open')
 * This makes the challenge visible on the Challenge Board
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  console.log('🔵 Activation route called');
  
  try {
    const { instanceId } = await params;
    console.log('🔵 Instance ID from params:', instanceId);
    
    const supabase = await createServerClient();
    console.log('🔵 Supabase client created');

    console.log('🎯 Activating ONE 2 ONE instance:', instanceId);

    // Get current instance to verify it exists and is pending
    const { data: instance, error: fetchError } = await supabase
      .from('competition_instances')
      .select('id, status, current_players')
      .eq('id', instanceId)
      .single();

    if (fetchError || !instance) {
      console.error('❌ Instance not found:', fetchError);
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    if (instance.status !== 'pending') {
      console.log('⚠️ Instance is not pending, current status:', instance.status);
      // If already open/active, that's fine - just return success
      if (instance.status === 'open') {
        return NextResponse.json({ 
          success: true, 
          message: 'Challenge already active' 
        });
      }
      return NextResponse.json(
        { error: `Cannot activate challenge with status: ${instance.status}` },
        { status: 400 }
      );
    }

    // Update status to 'open' to make it visible on Challenge Board
    const { data: updateData, error: updateError } = await supabase
      .from('competition_instances')
      .update({ 
        status: 'open',
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId)
      .select('id, status')
      .single();

    if (updateError) {
      console.error('❌ Failed to activate instance:', updateError);
      return NextResponse.json(
        { error: 'Failed to activate challenge' },
        { status: 500 }
      );
    }

    console.log('✅ Instance activated successfully:', updateData);

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
