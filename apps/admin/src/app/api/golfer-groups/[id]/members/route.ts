import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - List members of a group
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('golfer_group_members')
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
      .eq('group_id', params.id)
      .order('golfers(last_name)', { ascending: true });

    if (error) throw error;

    // Flatten structure
    const golfers = (data || []).map(m => m.golfers).filter(Boolean);

    return NextResponse.json(golfers);
  } catch (error: any) {
    console.error('GET group members error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add golfer to group (single or bulk)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const body = await request.json();
    const { golfer_id, golfer_ids } = body;

    // Support both single and bulk addition
    const idsToAdd = golfer_ids || (golfer_id ? [golfer_id] : []);

    if (idsToAdd.length === 0) {
      return NextResponse.json({ error: 'golfer_id or golfer_ids required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    
    // Prepare bulk insert
    const inserts = idsToAdd.map((id: string) => ({
      group_id: params.id,
      golfer_id: id,
    }));

    const { data, error } = await adminClient
      .from('golfer_group_members')
      .insert(inserts)
      .select();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'One or more golfers are already in this group' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      added: data?.length || 0 
    });
  } catch (error: any) {
    console.error('POST group member error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove golfer from group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const { searchParams } = new URL(request.url);
    const golfer_id = searchParams.get('golfer_id');

    if (!golfer_id) {
      return NextResponse.json({ error: 'golfer_id is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('golfer_group_members')
      .delete()
      .eq('group_id', params.id)
      .eq('golfer_id', golfer_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE group member error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
