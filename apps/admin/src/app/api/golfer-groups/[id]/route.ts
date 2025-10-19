import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get group details with members
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const adminClient = createAdminClient();
    
    // Get group details
    const { data: group, error: groupError } = await adminClient
      .from('golfer_groups')
      .select('*')
      .eq('id', params.id)
      .single();

    if (groupError) throw groupError;
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Get members
    const { data: members, error: membersError } = await adminClient
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

    if (membersError) throw membersError;

    // Flatten members structure
    const golfers = (members || []).map(m => m.golfers).filter(Boolean);

    return NextResponse.json({
      ...group,
      golfers,
      member_count: golfers.length,
    });
  } catch (error: any) {
    console.error('GET golfer group error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update group details
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const body = await request.json();
    const { name, slug, description, color } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('golfer_groups')
      .update({
        name,
        slug,
        description: description || null,
        color: color || '#3b82f6',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A group with this slug already exists' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('PUT golfer group error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const adminClient = createAdminClient();
    
    // Check if group is used in any tournaments
    const { data: usage, error: usageError } = await adminClient
      .from('tournament_golfer_groups')
      .select('tournament_id')
      .eq('group_id', params.id)
      .limit(1);

    if (usageError) throw usageError;

    if (usage && usage.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete group that is assigned to tournaments. Remove from tournaments first.' 
      }, { status: 400 });
    }

    // Delete group (CASCADE will delete members)
    const { error } = await adminClient
      .from('golfer_groups')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE golfer group error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
