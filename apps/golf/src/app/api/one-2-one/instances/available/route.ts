import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/one-2-one/instances/available
 * Gets the first available (open) instance for a template/tournament
 * If none exist, creates the first one
 * Query params: template_id, tournament_id
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get('template_id');
    const tournamentId = searchParams.get('tournament_id');

    if (!templateId || !tournamentId) {
      return NextResponse.json(
        { error: 'template_id and tournament_id are required' },
        { status: 400 }
      );
    }

    // Check if template exists and is active
    const { data: template, error: templateError } = await supabase
      .from('competition_templates')
      .select('*')
      .eq('id', templateId)
      .eq('status', 'active')
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found or inactive' },
        { status: 404 }
      );
    }

    // Get tournament details for reg_close calculation
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, name, start_date, current_round, round_1_start, round_2_start, round_3_start, round_4_start')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Calculate reg_close_at based on template.reg_close_round
    let regCloseAt: string | null = null;
    if (template.reg_close_round) {
      // Round-specific: closes when that round starts
      const roundKey = `round_${template.reg_close_round}_start` as keyof typeof tournament;
      regCloseAt = tournament[roundKey] as string || null;
    } else {
      // All Rounds: use tournament start_date
      regCloseAt = tournament.start_date;
    }

    if (!regCloseAt) {
      return NextResponse.json(
        { error: 'Unable to determine registration deadline' },
        { status: 500 }
      );
    }

    // Check if registration is still open
    const now = new Date();
    const closeDate = new Date(regCloseAt);
    if (now >= closeDate) {
      return NextResponse.json(
        { error: 'Registration is closed for this competition' },
        { status: 403 }
      );
    }

    // Look for first available open competition
    const { data: competitions, error: competitionsError } = await supabase
      .from('tournament_competitions')
      .select('*')
      .eq('template_id', templateId)
      .eq('tournament_id', tournamentId)
      .eq('competition_format', 'one2one')
      .eq('status', 'open')
      .lt('current_players', 2) // Not full
      .order('instance_number')
      .limit(1);

    if (competitionsError) {
      console.error('Error fetching competitions:', competitionsError);
      return NextResponse.json(
        { error: 'Failed to fetch competitions' },
        { status: 500 }
      );
    }

    // If we found an available competition, return it
    if (competitions && competitions.length > 0) {
      return NextResponse.json({
        instance: competitions[0], // Keep 'instance' key for frontend compatibility
        template: template,
        tournament: tournament
      });
    }

    // No open competitions exist, create the first one
    const { data: newCompetition, error: createError } = await supabase
      .from('tournament_competitions')
      .insert({
        template_id: templateId,
        tournament_id: tournamentId,
        competition_format: 'one2one',
        instance_number: 1,
        current_players: 0,
        max_players: 2,
        status: 'open',
        reg_close_at: regCloseAt,
        start_at: tournament.start_date,
        end_at: null // Will be set when tournament completes
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating competition:', createError);
      return NextResponse.json(
        { error: 'Failed to create competition' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      instance: newCompetition, // Keep 'instance' key for frontend compatibility
      template: template,
      tournament: tournament,
      created: true // Flag to indicate this is a new competition
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/one-2-one/instances/available:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
