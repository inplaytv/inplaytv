import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - List golfers in a competition
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('competition_golfers')
      .select(`
        golfer_id,
        added_at,
        golfers (
          id,
          first_name,
          last_name,
          full_name,
          image_url,
          external_id
        )
      `)
      .eq('competition_id', params.id)
      .order('golfers(last_name)', { ascending: true });

    if (error) throw error;

    // Flatten structure
    const golfers = (data || []).map(cg => cg.golfers).filter(Boolean);

    return NextResponse.json(golfers);
  } catch (error: any) {
    console.error('GET competition golfers error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add golfer(s) to competition
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const body = await request.json();
    const { golfer_id, golfer_ids, from_group_id } = body;

    const adminClient = createAdminClient();
    let idsToAdd: string[] = [];

    // Option 1: Add from group
    if (from_group_id) {
      const { data: members, error: membersError } = await adminClient
        .from('golfer_group_members')
        .select('golfer_id')
        .eq('group_id', from_group_id);

      if (membersError) throw membersError;
      idsToAdd = (members || []).map(m => m.golfer_id);
    }
    // Option 2: Add specific golfers
    else {
      idsToAdd = golfer_ids || (golfer_id ? [golfer_id] : []);
    }

    if (idsToAdd.length === 0) {
      return NextResponse.json({ error: 'No golfers to add' }, { status: 400 });
    }

    // Prepare bulk insert
    const inserts = idsToAdd.map(id => ({
      competition_id: params.id,
      golfer_id: id,
    }));

    const { data, error } = await adminClient
      .from('competition_golfers')
      .insert(inserts)
      .select();

    if (error) {
      // Ignore duplicate errors, just return success for unique inserts
      if (error.code === '23505') {
        return NextResponse.json({ 
          success: true, 
          added: 0,
          message: 'Some golfers were already in this competition'
        });
      }
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      added: data?.length || 0 
    });
  } catch (error: any) {
    console.error('POST competition golfer error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove golfer(s) from competition
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const { searchParams } = new URL(request.url);
    const golfer_id = searchParams.get('golfer_id');
    const remove_all = searchParams.get('all') === 'true';

    const adminClient = createAdminClient();

    if (remove_all) {
      // Remove all golfers from competition
      const { error } = await adminClient
        .from('competition_golfers')
        .delete()
        .eq('competition_id', params.id);

      if (error) throw error;
    } else if (golfer_id) {
      // Remove specific golfer
      const { error } = await adminClient
        .from('competition_golfers')
        .delete()
        .eq('competition_id', params.id)
        .eq('golfer_id', golfer_id);

      if (error) throw error;
    } else {
      return NextResponse.json({ error: 'golfer_id or all=true required' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE competition golfer error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
