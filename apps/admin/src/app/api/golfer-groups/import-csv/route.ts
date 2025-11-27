import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Calculate golfer salary based on world ranking and skill rating
 * Formula: Base salary (rank-based) + Skill bonus
 * Range: £10.00 to £150.00
 */
function calculateSalary(worldRank: number, skillRating?: number): number {
  // Base salary: Higher rank = lower salary
  // Rank 1 = £150, Rank 300+ = £10
  const baseSalary = Math.max(1000, 15000 - (worldRank * 45)); // In pennies

  // Skill bonus: Add up to £30 for high skill ratings
  const skillBonus = skillRating ? Math.round(skillRating * 300) : 0;

  // Total: Min £10, Max £150
  const totalSalary = Math.min(15000, Math.max(1000, baseSalary + skillBonus));
  
  return totalSalary;
}

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
    const golfersToUpdate: { id: string; updates: any }[] = [];
    
    console.log('Processing golfers, first 3:', golfers.slice(0, 3));
    
    for (const golfer of golfers) {
      const { firstName, lastName, worldRanking, skillRating, pointsWon } = golfer;
      const key = firstName + '___' + lastName;
      
      if (existingMap.has(key)) {
        const golferId = existingMap.get(key)!;
        
        // Use existing golfer and add to group
        groupMembers.push({
          group_id: group.id,
          golfer_id: golferId,
        });

        // If rankings provided, update the golfer
        if (worldRanking || skillRating) {
          const updates: any = {};
          
          if (worldRanking) {
            updates.world_rank = worldRanking;
          }
          if (skillRating) {
            updates.skill_rating = skillRating;
          }
          
          // Calculate salary if we have ranking data
          if (worldRanking) {
            updates.salary_pennies = calculateSalary(worldRanking, skillRating);
          }
          
          if (Object.keys(updates).length > 0) {
            updates.last_ranking_update = new Date().toISOString();
            updates.ranking_source = 'manual';
            golfersToUpdate.push({ id: golferId, updates });
          }
        }
      } else {
        // Calculate salary for new golfer
        const salaryPennies = worldRanking 
          ? calculateSalary(worldRanking, skillRating)
          : 10000; // Default £100 if no ranking
        
        // Prepare for batch insert
        newGolfers.push({
          first_name: firstName,
          last_name: lastName,
          world_rank: worldRanking || null,
          skill_rating: skillRating || null,
          salary_pennies: salaryPennies,
          last_ranking_update: worldRanking ? new Date().toISOString() : null,
          ranking_source: worldRanking ? 'manual' : null,
        });
      }
    }

    // Update existing golfers with new rankings
    for (const { id, updates } of golfersToUpdate) {
      const { error: updateError } = await supabase
        .from('golfers')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        console.warn(`Failed to update golfer ${id}:`, updateError);
      } else {
        // Log to history
        await supabase.from('golfer_ranking_history').insert({
          golfer_id: id,
          world_rank: updates.world_rank,
          skill_rating: updates.skill_rating,
          salary_pennies: updates.salary_pennies,
          source: 'manual',
          recorded_at: new Date().toISOString(),
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

    // Log the ranking sync if rankings were provided
    const golfersWithRankings = golfers.filter((g: any) => g.worldRanking);
    if (golfersWithRankings.length > 0) {
      await supabase.from('ranking_sync_logs').insert({
        source: 'manual',
        sync_type: 'csv_upload',
        golfers_updated: golfersWithRankings.length,
        status: 'success',
        metadata: {
          group_name: groupName,
          total_golfers: golfers.length,
          with_rankings: golfersWithRankings.length,
        },
        synced_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      groupId: group.id,
      groupName: group.name,
      golfersCreated,
      totalGolfers: groupMembers.length,
      rankingsUpdated: golfersWithRankings.length,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to import CSV' },
      { status: 500 }
    );
  }
}
