import { createClient } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { competitionId, golferIds, captainId } = await request.json();

    const supabase = createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get competition details to check entry cost
    const { data: competition, error: compError } = await supabase
      .from('clubhouse_competitions')
      .select('entry_credits, max_entries')
      .eq('id', competitionId)
      .single();

    if (compError || !competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    // Use atomic RPC function to create entry with payment
    const { data: entryId, error: entryError } = await supabase.rpc('create_entry_with_payment', {
      p_user_id: user.id,
      p_competition_id: competitionId,
      p_golfer_ids: golferIds,
      p_captain_id: captainId,
      p_credits: competition.entry_credits
    });

    if (entryError) {
      console.error('Entry creation failed:', entryError);
      
      // Check for specific error messages
      if (entryError.message.includes('Insufficient credits')) {
        return NextResponse.json({ 
          error: 'Insufficient credits',
          details: entryError.message 
        }, { status: 400 });
      }
      
      if (entryError.message.includes('duplicate')) {
        return NextResponse.json({ 
          error: 'You have already entered this competition' 
        }, { status: 400 });
      }

      return NextResponse.json({ 
        error: 'Failed to create entry',
        details: entryError.message 
      }, { status: 500 });
    }

    // Get updated wallet balance
    const { data: wallet } = await supabase
      .from('clubhouse_wallets')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      entryId,
      newBalance: wallet?.credits || 0,
      message: 'Entry created successfully'
    });

  } catch (error: any) {
    console.error('Error in clubhouse entry:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
