import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/tournaments/[id]/golfers/manual
 * Manually add a golfer to a tournament (creates golfer if doesn't exist)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const body = await request.json();
    const { name, country, dg_id, pga_tour_id } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Golfer name is required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const tournamentId = params.id;

    // Step 1: Check if golfer already exists by name or dg_id
    let existingGolfer = null;
    
    if (dg_id && dg_id.trim()) {
      // Try to find by DataGolf ID first (most reliable)
      const { data } = await adminClient
        .from('golfers')
        .select('id')
        .eq('dg_id', dg_id.trim())
        .single();
      
      existingGolfer = data;
    }
    
    if (!existingGolfer) {
      // Try to find by name
      const { data } = await adminClient
        .from('golfers')
        .select('id')
        .eq('name', name.trim())
        .single();
      
      existingGolfer = data;
    }

    let golferId: string;

    if (existingGolfer) {
      // Use existing golfer
      golferId = existingGolfer.id;
    } else {
      // Create new golfer - split name into first and last
      const nameParts = name.trim().split(',').map((p: string) => p.trim());
      let firstName = '';
      let lastName = '';
      
      if (nameParts.length === 2) {
        // Format: "Last, First"
        lastName = nameParts[0];
        firstName = nameParts[1];
      } else {
        // Format: "First Last" or single name
        const words = name.trim().split(' ');
        if (words.length === 1) {
          firstName = words[0];
          lastName = words[0];
        } else {
          firstName = words.slice(0, -1).join(' ');
          lastName = words[words.length - 1];
        }
      }

      const { data: newGolfer, error: createError } = await adminClient
        .from('golfers')
        .insert({
          name: name.trim(),
          first_name: firstName,
          last_name: lastName,
          country: country?.trim() || null,
          dg_id: dg_id?.trim() || null,
          pga_tour_id: pga_tour_id?.trim() || null,
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating golfer:', createError);
        throw new Error(`Failed to create golfer: ${createError.message}`);
      }

      if (!newGolfer) {
        throw new Error('Failed to create golfer: No data returned');
      }

      golferId = newGolfer.id;
    }

    // Step 2: Link golfer to tournament
    const { data: tournamentGolfer, error: linkError } = await adminClient
      .from('tournament_golfers')
      .insert({
        tournament_id: tournamentId,
        golfer_id: golferId,
        status: 'confirmed',
      })
      .select()
      .single();

    if (linkError) {
      // Check for duplicate entry
      if (linkError.code === '23505') {
        return NextResponse.json(
          { error: 'This golfer is already in this tournament' },
          { status: 400 }
        );
      }
      throw linkError;
    }

    return NextResponse.json({
      success: true,
      golfer_id: golferId,
      message: `Golfer "${name}" added to tournament`,
    });

  } catch (error: any) {
    console.error('Error adding golfer manually:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add golfer' },
      { status: 500 }
    );
  }
}
