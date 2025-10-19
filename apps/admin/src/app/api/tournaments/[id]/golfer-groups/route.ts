import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - List golfer groups assigned to tournament
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('tournament_golfer_groups')
      .select(`
        group_id,
        added_at,
        golfer_groups (
          id,
          name,
          slug,
          description,
          color,
          created_at
        )
      `)
      .eq('tournament_id', params.id)
      .order('added_at', { ascending: false });

    if (error) throw error;

    // Flatten and get member counts for each group
    const groups = await Promise.all((data || []).map(async (tg) => {
      const group = tg.golfer_groups as any;
      if (!group) return null;

      // Get member count
      const { count, error: countError } = await adminClient
        .from('golfer_group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id);

      if (countError) console.error('Count error:', countError);

      return {
        ...group,
        member_count: count || 0,
        added_at: tg.added_at,
      };
    }));

    return NextResponse.json(groups.filter(Boolean));
  } catch (error: any) {
    console.error('GET tournament groups error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add golfer group to tournament
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const body = await request.json();
    const { group_id } = body;

    if (!group_id) {
      return NextResponse.json({ error: 'group_id is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('tournament_golfer_groups')
      .insert({
        tournament_id: params.id,
        group_id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This group is already assigned to this tournament' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('POST tournament group error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove golfer group from tournament
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const { searchParams } = new URL(request.url);
    const group_id = searchParams.get('group_id');

    if (!group_id) {
      return NextResponse.json({ error: 'group_id is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('tournament_golfer_groups')
      .delete()
      .eq('tournament_id', params.id)
      .eq('group_id', group_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE tournament group error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
