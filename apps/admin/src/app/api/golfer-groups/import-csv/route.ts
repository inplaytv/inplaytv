import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { groupName, golfers } = await request.json();

    console.log('Import CSV request:', { groupName, golferCount: golfers?.length });

    if (!groupName || !golfers || !Array.isArray(golfers)) {
      return NextResponse.json(
        { error: 'Group name and golfers array required' },
        { status: 400 }
      );
    }

    // Create slug from group name
    const baseSlug = groupName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Check if slug exists and make it unique
    const timestamp = Date.now();
    const slug = `${baseSlug}-${timestamp}`;

    console.log('Creating group:', { name: groupName, slug, golferCount: golfers.length });

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
        { error: `Failed to create group: ${groupError.message || JSON.stringify(groupError)}` },
        { status: 500 }
      );
    }

    console.log('Group created successfully:', group.id);

    let golfersCreated = 0;
    const groupMembers: { group_id: string; golfer_id: string }[] = [];

    // Batch fetch existing golfers
    const { data: existingGolfers } = await supabase
      .from('golfers')
      .select('id, first_name, last_name');

    const existingMap = new Map();
    if (existingGolfers) {
      for (const g of existingGolfers) {
        const key = g.first_name + '___' + g.last_name;
        existingMap.set(key, g.id);
      }
    }

    // Separate new vs existing golfers
    const newGolfers: any[] = [];
    
    for (const golfer of golfers) {
      const { firstName, lastName, worldRanking, pointsWon } = golfer;
      const key = firstName + '___' + lastName;
      
      if (existingMap.has(key)) {
        // Use existing golfer
        groupMembers.push({
          group_id: group.id,
          golfer_id: existingMap.get(key)!,
        });
      } else {
        // Prepare for batch insert
        newGolfers.push({
          first_name: firstName,
          last_name: lastName,
          world_ranking: worldRanking || null,
        });
      }
    }

    // Batch insert new golfers
    if (newGolfers.length > 0) {
      const { data: createdGolfers, error: batchError } = await supabase
        .from('golfers')
        .insert(newGolfers)
        .select('id, first_name, last_name');

      if (batchError) {
        console.error('Batch golfer creation error:', batchError);
        return NextResponse.json(
          { error: 'Failed to create golfers: ' + batchError.message },
          { status: 500 }
        );
      }

      if (createdGolfers) {
        golfersCreated = createdGolfers.length;
        
        // Add newly created golfers to group members
        for (const golfer of createdGolfers) {
          groupMembers.push({
            group_id: group.id,
            golfer_id: golfer.id,
          });
        }
      }
    }

    // Add all golfers to the group in batch
    if (groupMembers.length > 0) {
      const { error: membersError } = await supabase
        .from('golfer_group_members')
        .insert(groupMembers);

      if (membersError) {
        console.error('Group members error:', membersError);
        return NextResponse.json(
          { error: 'Failed to add golfers to group: ' + membersError.message },
          { status: 500 }
        );
      }
    }

    console.log(`Import complete: ${golfersCreated} new golfers created, ${groupMembers.length} total in group`);

    return NextResponse.json({
      success: true,
      groupId: group.id,
      groupName: group.name,
      golfersCreated,
      totalGolfers: groupMembers.length,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to import CSV' },
      { status: 500 }
    );
  }
}
