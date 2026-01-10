import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    // Use service role key to bypass RLS for public competition data
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { competitionId } = await params;

    // Get competition with assigned golfer group
    const { data: competition, error: compError } = await supabase
      .from('tournament_competitions')
      .select('assigned_golfer_group_id, tournament_id')
      .eq('id', competitionId)
      .single();

    if (compError || !competition) {
      console.error('Error fetching competition:', compError);
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    // If no golfer group assigned, definitely no golfers
    if (!competition.assigned_golfer_group_id) {
      return NextResponse.json({ 
        hasGolfers: false,
        count: 0,
        reason: 'No golfer group assigned'
      });
    }

    // Check if the assigned golfer group has members
    const { count, error } = await supabase
      .from('golfer_group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', competition.assigned_golfer_group_id);

    if (error) {
      console.error('Error checking golfer group members:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      hasGolfers: (count ?? 0) > 0,
      count: count ?? 0,
      golferGroupId: competition.assigned_golfer_group_id
    });
  } catch (error) {
    console.error('Error in has-golfers API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
