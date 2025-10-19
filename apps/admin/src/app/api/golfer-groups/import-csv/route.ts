import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { groupName, golfers } = await request.json();

    if (!groupName || !golfers || !Array.isArray(golfers)) {
      return NextResponse.json(
        { error: 'Group name and golfers array required' },
        { status: 400 }
      );
    }

    // Create slug from group name
    const slug = groupName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('golfer_groups')
      .insert({
        name: groupName,
        slug,
        description: `Imported from CSV - ${golfers.length} golfers`,
        color: '#10b981', // Green for CSV imports
      })
      .select()
      .single();

    if (groupError) {
      console.error('Group creation error:', groupError);
      return NextResponse.json(
        { error: 'Failed to create group' },
        { status: 500 }
      );
    }

    let golfersCreated = 0;
    const groupMembers: { group_id: string; golfer_id: string }[] = [];

    // Process each golfer
    for (const golfer of golfers) {
      const { firstName, lastName, worldRanking, pointsWon } = golfer;

      // Try to find existing golfer
      const { data: existing } = await supabase
        .from('golfers')
        .select('id')
        .eq('first_name', firstName)
        .eq('last_name', lastName)
        .single();

      let golferId: string;

      if (existing) {
        // Update existing golfer with new data
        await supabase
          .from('golfers')
          .update({
            world_ranking: worldRanking || null,
            points_won: pointsWon || 0,
          })
          .eq('id', existing.id);
        
        golferId = existing.id;
      } else {
        // Create new golfer
        const { data: newGolfer, error: golferError } = await supabase
          .from('golfers')
          .insert({
            first_name: firstName,
            last_name: lastName,
            world_ranking: worldRanking || null,
            points_won: pointsWon || 0,
          })
          .select('id')
          .single();

        if (golferError || !newGolfer) {
          console.error('Golfer creation error:', golferError);
          continue;
        }

        golferId = newGolfer.id;
        golfersCreated++;
      }

      groupMembers.push({
        group_id: group.id,
        golfer_id: golferId,
      });
    }

    // Add all golfers to the group
    if (groupMembers.length > 0) {
      const { error: membersError } = await supabase
        .from('golfer_group_members')
        .insert(groupMembers);

      if (membersError) {
        console.error('Group members error:', membersError);
        return NextResponse.json(
          { error: 'Failed to add golfers to group' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      groupId: group.id,
      groupName: group.name,
      golfersCreated,
      totalGolfers: groupMembers.length,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import CSV' },
      { status: 500 }
    );
  }
}
