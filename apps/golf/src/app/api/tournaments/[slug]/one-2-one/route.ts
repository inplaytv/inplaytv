import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabaseServer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/tournaments/[slug]/one-2-one
 * Get ONE 2 ONE templates with available instances for this tournament
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { slug } = await params;

    // Get tournament by slug
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, name, slug, start_date, end_date, current_round, status, is_visible, round_1_start, round_2_start, round_3_start, round_4_start')
      .eq('slug', slug)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Get all active ONE 2 ONE templates
    // Order: All Rounds first (4 rounds), then individual rounds (1-4)
    const { data: templates, error: templatesError } = await supabase
      .from('competition_templates')
      .select('*')
      .eq('status', 'active');

    if (templatesError) {
      console.error('Error fetching templates:', templatesError);
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    // Sort: All Rounds first (length=4), then by first round number
    const sortedTemplates = (templates || []).sort((a, b) => {
      const aLength = a.rounds_covered?.length || 0;
      const bLength = b.rounds_covered?.length || 0;
      
      // All Rounds (4 rounds) comes first
      if (aLength === 4 && bLength !== 4) return -1;
      if (bLength === 4 && aLength !== 4) return 1;
      
      // Otherwise sort by first round number
      const aFirst = a.rounds_covered?.[0] || 0;
      const bFirst = b.rounds_covered?.[0] || 0;
      return aFirst - bFirst;
    });

    // For each template, get first available instance or check if we need to create one
    const templatesWithAvailability = await Promise.all(
      sortedTemplates.map(async (template) => {
        // Calculate reg_close_at for this template
        let regCloseAt: string | null = null;
        if (template.reg_close_round) {
          const roundKey = `round_${template.reg_close_round}_start` as keyof typeof tournament;
          regCloseAt = tournament[roundKey] as string || null;
        } else {
          regCloseAt = tournament.start_date;
        }

        // Check if registration is still open
        const now = new Date();
        const closeDate = regCloseAt ? new Date(regCloseAt) : null;
        // If no close date is set, registration is open. Otherwise check if we're before the close date.
        const isOpen = closeDate ? now < closeDate : true;

        // Get available instance count
        const { count, error: countError } = await supabase
          .from('competition_instances')
          .select('id', { count: 'exact', head: true })
          .eq('template_id', template.id)
          .eq('tournament_id', tournament.id)
          .eq('status', 'open')
          .lt('current_players', 2);

        return {
          ...template,
          tournament_id: tournament.id,
          reg_close_at: regCloseAt,
          is_open: isOpen,
          available_instances: count || 0
        };
      })
    );

    return NextResponse.json({
      tournament: tournament,
      templates: templatesWithAvailability
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/tournaments/one-2-one:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
