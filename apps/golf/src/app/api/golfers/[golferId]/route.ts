import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { golferId: string } }
) {
  try {
    const supabase = await createServerClient();

    const { data: golfer, error } = await supabase
      .from('golfers')
      .select('id, name, country, salary, owgr_rank')
      .eq('id', params.golferId)
      .single();

    if (error) throw error;

    return NextResponse.json(golfer);
  } catch (error: any) {
    console.error('GET golfer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch golfer' },
      { status: 500 }
    );
  }
}
