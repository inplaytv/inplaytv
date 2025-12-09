import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

/**
 * POST /api/one-2-one/join
 * Find or create an available ONE 2 ONE instance and return the instance ID
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();
    const { templateId, tournamentId, entryFeePennies } = body;

    if (!templateId || !tournamentId) {
      console.error('[Join] Missing required fields:', { templateId: !!templateId, tournamentId: !!tournamentId });
      return NextResponse.json(
        { error: 'Template ID and Tournament ID are required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if templateId is actually an instance ID (user accepting existing challenge)
    const { data: existingInstance, error: instanceCheckError } = await supabase
      .from('competition_instances')
      .select('id, template_id, tournament_id, current_players, max_players, status')
      .eq('id', templateId)
      .maybeSingle();

    if (instanceCheckError) {
      console.error('[Join] Error checking for existing instance:', instanceCheckError);
      // Continue to create new instance
    } else if (existingInstance) {
      console.log('[Join] 🔍 User accepting existing challenge:', existingInstance.id);
      
      // CRITICAL: Check if user already has an entry for THIS instance
      const { data: existingUserEntry } = await supabase
        .from('competition_entries')
        .select('id')
        .eq('instance_id', existingInstance.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingUserEntry) {
        console.log('[Join] ❌ BLOCKED: User already has entry for this instance');
        return NextResponse.json(
          { error: 'You have already accepted this challenge' },
          { status: 400 }
        );
      }

      // User is accepting an existing challenge - verify they're not the creator
      const { data: creatorEntry } = await supabase
        .from('competition_entries')
        .select('user_id')
        .eq('instance_id', existingInstance.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (creatorEntry?.user_id === user.id) {
        console.log('[Join] ❌ BLOCKED: Cannot accept own challenge');
        return NextResponse.json(
          { error: 'Cannot accept your own challenge' },
          { status: 403 }
        );
      }

      const isAvailable = (existingInstance.status === 'pending' || existingInstance.status === 'open') 
        && existingInstance.current_players < existingInstance.max_players;
      
      if (isAvailable) {
        console.log('[Join] ✅ ALLOWING: User can join this instance');
        return NextResponse.json({
          instanceId: existingInstance.id,
          isNew: false,
          message: 'Joining existing challenge'
        });
      } else {
        console.log('[Join] ❌ BLOCKED: Challenge no longer available');
        return NextResponse.json(
          { error: 'This challenge is no longer available' },
          { status: 400 }
        );
      }
    }

    // Template ID provided - create a new challenge instance
    
    // Get the next instance number
    const { data: existingInstances } = await supabase
      .from('competition_instances')
      .select('instance_number')
      .eq('template_id', templateId)
      .eq('tournament_id', tournamentId)
      .order('instance_number', { ascending: false })
      .limit(1);
    
    const nextInstanceNumber = existingInstances && existingInstances.length > 0 
      ? existingInstances[0].instance_number + 1 
      : 1;

    console.log('📊 Next instance number:', nextInstanceNumber);

    // Get template details for registration close time
    const { data: template, error: templateError } = await supabase
      .from('competition_templates')
      .select('reg_close_round')
      .eq('id', templateId)
      .single();
    
    if (templateError) {
      console.error('[Join] Error fetching template:', templateError);
      return NextResponse.json(
        { error: 'Failed to fetch template details', details: templateError.message },
        { status: 500 }
      );
    }

    // Get tournament round times to calculate reg_close_at
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('round_1_start, round_2_start, round_3_start, round_4_start, end_date')
      .eq('id', tournamentId)
      .single();
    
    if (tournamentError) {
      console.error('[Join] Error fetching tournament:', tournamentError);
      return NextResponse.json(
        { error: 'Failed to fetch tournament details', details: tournamentError.message },
        { status: 500 }
      );
    }

    console.log('✅ Tournament rounds loaded');

    // Determine reg_close_at based on template's reg_close_round
    let regCloseAt: string | null = null;
    let startAt: string | null = null;
    let endAt: string | null = tournament.end_date;
    
    if (template.reg_close_round === 1) {
      regCloseAt = tournament.round_1_start;
      startAt = tournament.round_1_start;
    } else if (template.reg_close_round === 2) {
      regCloseAt = tournament.round_2_start;
      startAt = tournament.round_1_start;
    } else if (template.reg_close_round === 3) {
      regCloseAt = tournament.round_3_start;
      startAt = tournament.round_1_start;
    } else if (template.reg_close_round === 4) {
      regCloseAt = tournament.round_4_start;
      startAt = tournament.round_1_start;
    }

    const { data: newInstance, error: createError } = await supabase
      .from('competition_instances')
      .insert({
        template_id: templateId,
        tournament_id: tournamentId,
        instance_number: nextInstanceNumber,
        entry_fee_pennies: entryFeePennies,
        status: 'pending',
        current_players: 0,
        max_players: 2,
        reg_close_at: regCloseAt,
        start_at: startAt,
        end_at: endAt,
      })
      .select('id')
      .single();

    if (createError) {
      console.error('[Join] Error creating instance:', createError);
      return NextResponse.json(
        { error: 'Failed to create new instance', details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      instanceId: newInstance.id,
      isNew: true,
      currentPlayers: 0
    });
  } catch (error: any) {
    console.error('[Join] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
