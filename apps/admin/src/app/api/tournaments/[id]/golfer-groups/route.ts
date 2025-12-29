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
    
    // 1. Add group to tournament
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

    // 2. Get all golfers from this group
    const { data: groupMembers, error: membersError } = await adminClient
      .from('golfer_group_members')
      .select('golfer_id')
      .eq('group_id', group_id);

    if (membersError) {
      console.error('Error fetching group members:', membersError);
      throw membersError;
    }

    // 3. Copy golfers to tournament_golfers (only if they don't already exist)
    if (groupMembers && groupMembers.length > 0) {
      const golfersToAdd = groupMembers.map(m => ({
        tournament_id: params.id,
        golfer_id: m.golfer_id,
        status: 'confirmed'
      }));

      const { error: insertError } = await adminClient
        .from('tournament_golfers')
        .upsert(golfersToAdd, { 
          onConflict: 'tournament_id,golfer_id',
          ignoreDuplicates: true 
        });

      if (insertError) {
        console.error('Error adding golfers to tournament:', insertError);
        // Don't throw - group is added, just log the error
      }
    }

    // 4. Assign this golfer group to ALL InPlay competitions in this tournament
    // This ensures both manual and automatic workflows work consistently
    const { data: competitions, error: compsError } = await adminClient
      .from('tournament_competitions')
      .select('id')
      .eq('tournament_id', params.id)
      .eq('competition_format', 'inplay');

    if (compsError) {
      console.error('Error fetching competitions:', compsError);
    } else if (competitions && competitions.length > 0) {
      const { error: updateError } = await adminClient
        .from('tournament_competitions')
        .update({ assigned_golfer_group_id: group_id })
        .eq('tournament_id', params.id)
        .eq('competition_format', 'inplay');

      if (updateError) {
        console.error('Error assigning group to competitions:', updateError);
      } else {
        console.log(`✅ Assigned golfer group to ${competitions.length} competitions`);
      }
    }

    return NextResponse.json({ 
      ...data, 
      golfers_added: groupMembers?.length || 0,
      competitions_updated: competitions?.length || 0
    });
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
