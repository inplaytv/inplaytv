import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - List all golfers for a tournament
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('tournament_golfers')
      .select(`
        golfer_id,
        golfers (
          id,
          first_name,
          last_name,
          full_name,
          image_url,
          external_id
        )
      `)
      .eq('tournament_id', params.id)
      .order('golfers(last_name)', { ascending: true });

    if (error) throw error;

    // Flatten the structure
    const golfers = (data || []).map(tg => tg.golfers).filter(Boolean);

    return NextResponse.json(golfers);
  } catch (error: any) {
    console.error('GET tournament golfers error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add golfer to tournament
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const body = await request.json();
    const { golfer_id } = body;

    if (!golfer_id) {
      return NextResponse.json({ error: 'Golfer ID is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('tournament_golfers')
      .insert({
        tournament_id: params.id,
        golfer_id,
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This golfer is already added to this tournament' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('POST tournament golfer error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove golfer from tournament
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const { searchParams } = new URL(request.url);
    const golfer_id = searchParams.get('golfer_id');

    if (!golfer_id) {
      return NextResponse.json({ error: 'Golfer ID is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('tournament_golfers')
      .delete()
      .eq('tournament_id', params.id)
      .eq('golfer_id', golfer_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE tournament golfer error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
