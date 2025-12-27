import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/one-2-one/join
 * Find or create an available ONE 2 ONE instance and return the instance ID
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
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

    // Check if templateId is actually a competition ID (user accepting existing challenge)
    const { data: existingCompetition, error: competitionCheckError } = await supabaseAdmin
      .from('tournament_competitions')
      .select('id, template_id, tournament_id, current_players, max_players, status, competition_format')
      .eq('id', templateId)
      .eq('competition_format', 'one2one')
      .maybeSingle();

    if (competitionCheckError) {
      console.error('[Join] Error checking for existing competition:', competitionCheckError);
      // Continue to create new competition
    } else if (existingCompetition) {
      // User is accepting an existing challenge
      
      // Check if user already has an entry for THIS competition
      const { data: existingUserEntry } = await supabaseAdmin
        .from('competition_entries')
        .select('id')
        .eq('competition_id', existingCompetition.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingUserEntry) {
        return NextResponse.json(
          { error: 'You have already accepted this challenge' },
          { status: 400 }
        );
      }

      // User is accepting an existing challenge - verify they're not the creator using service role
      const { data: creatorEntry } = await supabaseAdmin
        .from('competition_entries')
        .select('user_id')
        .eq('competition_id', existingCompetition.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (creatorEntry?.user_id === user.id) {
        return NextResponse.json(
          { error: 'Cannot accept your own challenge' },
          { status: 403 }
        );
      }

      const isAvailable = (existingCompetition.status === 'pending' || existingCompetition.status === 'open') 
        && existingCompetition.current_players < existingCompetition.max_players;
      
      if (isAvailable) {
        return NextResponse.json({
          instanceId: existingCompetition.id,
          isNew: false,
          message: 'Joining existing challenge'
        });
      } else {
        return NextResponse.json(
          { error: 'This challenge is no longer available' },
          { status: 400 }
        );
      }
    }

    // Template ID provided - create a new challenge competition
    
    // Get the next instance number
    const { data: existingCompetitions } = await supabase
      .from('tournament_competitions')
      .select('instance_number')
      .eq('template_id', templateId)
      .eq('tournament_id', tournamentId)
      .eq('competition_format', 'one2one')
      .order('instance_number', { ascending: false })
      .limit(1);
    
    const nextInstanceNumber = existingCompetitions && existingCompetitions.length > 0 
      ? existingCompetitions[0].instance_number + 1 
      : 1;

    // Get template details for registration close time
    const { data: template, error: templateError } = await supabase
      .from('competition_templates')
      .select('reg_close_round, rounds_covered')
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

    // Get the golfer group from an existing InPlay competition
    const { data: existingComp } = await supabase
      .from('tournament_competitions')
      .select('assigned_golfer_group_id')
      .eq('tournament_id', tournamentId)
      .eq('competition_format', 'inplay')
      .not('assigned_golfer_group_id', 'is', null)
      .limit(1)
      .maybeSingle();
    
    const golferGroupId = existingComp?.assigned_golfer_group_id;
    
    if (!golferGroupId) {
      console.error('[Join] ❌ No golfer group found for tournament!');
      return NextResponse.json(
        { error: 'No golfers available for this tournament. Please contact admin.' },
        { status: 500 }
      );
    }

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

    // Use admin client to bypass RLS for creating competition
    const { data: newCompetition, error: createError } = await supabaseAdmin
      .from('tournament_competitions')
      .insert({
        tournament_id: tournamentId,
        competition_format: 'one2one',
        template_id: templateId,
        instance_number: nextInstanceNumber,
        entry_fee_pennies: entryFeePennies,
        status: 'pending',
        current_players: 0,
        max_players: 2,
        reg_close_at: regCloseAt,
        start_at: startAt,
        end_at: endAt,
        rounds_covered: template.rounds_covered,
        assigned_golfer_group_id: golferGroupId,
      })
      .select('id')
      .single();

    if (createError) {
      console.error('[Join] Error creating competition:', createError);
      return NextResponse.json(
        { error: 'Failed to create new challenge', details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      instanceId: newCompetition.id,
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
