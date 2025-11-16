import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Fetch golfers available in a competition
export async function GET(
  request: NextRequest,
  { params }: { params: { competitionId: string } }
) {
  try {
    console.log('🏌️ Fetching golfers for competition:', params.competitionId);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, let's check if there are ANY rows in competition_golfers for this competition
    const { data: checkData, error: checkError } = await supabase
      .from('competition_golfers')
      .select('golfer_id, salary')
      .eq('competition_id', params.competitionId);

    console.log('🔍 competition_golfers rows:', checkData?.length || 0);
    if (checkData && checkData.length > 0) {
      console.log('📝 Sample row:', checkData[0]);
    }

    // Get golfers assigned to this competition with their salaries
    const { data, error } = await supabase
      .from('competition_golfers')
      .select(`
        golfer_id,
        salary,
        golfers (
          id,
          first_name,
          last_name,
          full_name,
          world_ranking,
          image_url
        )
      `)
      .eq('competition_id', params.competitionId)
      .order('golfers(world_ranking)', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('❌ Error fetching competition golfers:', error);
      throw error;
    }

    console.log('📊 Raw data from DB:', data?.length, 'rows');

    // Flatten the data structure
    const golfers = (data || [])
      .filter((cg: any) => cg.golfers)
      .map((cg: any) => ({
        id: cg.golfers.id,
        first_name: cg.golfers.first_name,
        last_name: cg.golfers.last_name,
        full_name: cg.golfers.full_name,
        world_ranking: cg.golfers.world_ranking,
        image_url: cg.golfers.image_url,
        salary: cg.salary || 5000, // Default salary if not set
      }));

    console.log('✅ Returning', golfers.length, 'golfers');
    return NextResponse.json(golfers);
  } catch (error: any) {
    console.error('GET competition golfers error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch golfers' },
      { status: 500 }
    );
  }
}
