import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { golfer_ids }: { golfer_ids: string[] } = await request.json();

    if (!golfer_ids || golfer_ids.length === 0) {
      return NextResponse.json(
        { error: 'No golfer IDs provided' },
        { status: 400 }
      );
    }

    // Check if group exists
    const { data: group, error: groupError } = await supabase
      .from('golfer_groups')
      .select('id')
      .eq('id', params.id)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Golfer group not found' },
        { status: 404 }
      );
    }

    // Get existing members to avoid duplicates
    const { data: existingMembers } = await supabase
      .from('golfer_group_members')
      .select('golfer_id')
      .eq('golfer_group_id', params.id);

    const existingGolferIds = new Set(
      existingMembers?.map((m: any) => m.golfer_id) || []
    );

    // Filter out golfers already in the group
    const newGolferIds = golfer_ids.filter(id => !existingGolferIds.has(id));

    if (newGolferIds.length === 0) {
      return NextResponse.json({
        message: 'All selected golfers are already in the group',
        added: 0,
      });
    }

    // Add new members
    const membersToAdd = newGolferIds.map(golfer_id => ({
      golfer_group_id: params.id,
      golfer_id,
    }));

    const { error: insertError } = await supabase
      .from('golfer_group_members')
      .insert(membersToAdd);

    if (insertError) {
      console.error('Error adding golfers to group:', insertError);
      return NextResponse.json(
        { error: 'Failed to add golfers to group' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Successfully added ${newGolferIds.length} golfer(s) to the group`,
      added: newGolferIds.length,
    });
  } catch (error: any) {
    console.error('Error in add-members:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
