import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const tournamentId = params.id;

    // Check if tournament has golfers assigned
    const { count, error } = await supabase
      .from('tournament_golfers')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournamentId)
      .eq('status', 'confirmed'); // Only count confirmed golfers

    if (error) {
      console.error('Error checking golfer count:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      count: count || 0,
      hasGolfers: (count || 0) > 0
    });
  } catch (error: any) {
    console.error('Error in golfers-count route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
