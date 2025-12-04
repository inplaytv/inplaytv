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
      .select('id, name, slug, start_date, current_round, round_1_start, round_2_start, round_3_start, round_4_start')
      .eq('slug', slug)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Get all active ONE 2 ONE templates
    const { data: templates, error: templatesError } = await supabase
      .from('competition_templates')
      .select('*')
      .eq('status', 'active')
      .order('rounds_covered');

    if (templatesError) {
      console.error('Error fetching templates:', templatesError);
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    // For each template, get first available instance or check if we need to create one
    const templatesWithAvailability = await Promise.all(
      (templates || []).map(async (template) => {
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
        const isOpen = closeDate ? now < closeDate : false;

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
