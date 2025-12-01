import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; scoreId: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { score, notes } = body;

    // Get current user from session
    const cookieStore = cookies();
    const authToken = cookieStore.get('sb-access-token')?.value;
    
    let userId = null;
    if (authToken) {
      const { data: { user } } = await supabase.auth.getUser(authToken);
      userId = user?.id;
    }

    // Calculate to_par (assuming par 72 for now - can be enhanced)
    const par = 72;
    const toPar = score ? score - par : null;

    // Update the score with manual override flag
    const { data, error } = await supabase
      .from('tournament_round_scores')
      .update({
        score: parseInt(score),
        to_par: toPar,
        is_manual_override: true,
        updated_by: userId,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.scoreId)
      .select()
      .single();

    if (error) throw error;

    // Also update the denormalized columns in tournament_golfers
    const roundNumber = data.round_number;
    const roundColumn = `r${roundNumber}_score`;
    
    await supabase
      .from('tournament_golfers')
      .update({
        [roundColumn]: parseInt(score),
        last_score_update: new Date().toISOString()
      })
      .eq('tournament_id', params.id)
      .eq('golfer_id', data.golfer_id);

    return NextResponse.json({ 
      success: true, 
      message: 'Score updated successfully',
      data 
    });
  } catch (error: any) {
    console.error('Error updating score:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update score' },
      { status: 500 }
    );
  }
}
