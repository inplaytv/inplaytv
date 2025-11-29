import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tournaments/[id]/create-group-from-golfers
 * Creates a golfer group from all tournament golfers and assigns it to the tournament
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const adminClient = createAdminClient();
    const tournamentId = params.id;

    // Get tournament details
    const { data: tournament, error: tournamentError } = await adminClient
      .from('tournaments')
      .select('name, slug')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      throw new Error('Tournament not found');
    }

    // Get all golfers for this tournament
    const { data: tournamentGolfers, error: golfersError } = await adminClient
      .from('tournament_golfers')
      .select('golfer_id')
      .eq('tournament_id', tournamentId);

    if (golfersError) throw golfersError;

    if (!tournamentGolfers || tournamentGolfers.length === 0) {
      return NextResponse.json(
        { error: 'No golfers found in this tournament. Add some golfers first.' },
        { status: 400 }
      );
    }

    const golferIds = tournamentGolfers.map(tg => tg.golfer_id);

    // Create golfer group
    const groupName = `${tournament.name} Field`;
    const groupSlug = `${tournament.slug}-field-${Date.now()}`;

    const { data: newGroup, error: createGroupError } = await adminClient
      .from('golfer_groups')
      .insert({
        name: groupName,
        slug: groupSlug,
        description: `Auto-generated group for ${tournament.name} tournament golfers`,
        color: '#10b981',
      })
      .select('id')
      .single();

    if (createGroupError || !newGroup) {
      console.error('Error creating group:', createGroupError);
      throw new Error('Failed to create golfer group');
    }

    const groupId = newGroup.id;

    // Add all golfers to the group
    const groupMembers = golferIds.map(golferId => ({
      group_id: groupId,
      golfer_id: golferId,
    }));

    const { error: addMembersError } = await adminClient
      .from('golfer_group_members')
      .insert(groupMembers);

    if (addMembersError) {
      console.error('Error adding members:', addMembersError);
      // Clean up the group if adding members fails
      await adminClient.from('golfer_groups').delete().eq('id', groupId);
      throw new Error('Failed to add golfers to group');
    }

    // Assign group to tournament
    const { error: assignGroupError } = await adminClient
      .from('tournament_golfer_groups')
      .insert({
        tournament_id: tournamentId,
        group_id: groupId,
      });

    if (assignGroupError) {
      console.error('Error assigning group:', assignGroupError);
      // Check for duplicate
      if (assignGroupError.code === '23505') {
        return NextResponse.json(
          { error: 'This group is already assigned to the tournament' },
          { status: 400 }
        );
      }
      throw assignGroupError;
    }

    return NextResponse.json({
      success: true,
      group_id: groupId,
      group_name: groupName,
      golfer_count: golferIds.length,
      message: `Created group "${groupName}" with ${golferIds.length} golfers and assigned to tournament`,
    });

  } catch (error: any) {
    console.error('Error creating group from golfers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create group from golfers' },
      { status: 500 }
    );
  }
}
