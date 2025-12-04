import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabaseServer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/one-2-one/templates/[tournamentId]
 * Returns all ONE 2 ONE templates with their available instances for a tournament
 * Templates without instances will have an empty instances array
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { tournamentId } = await params;

    // Get all active templates
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

    // For each template, get its instances for this tournament
    const templatesWithInstances = await Promise.all(
      templates.map(async (template) => {
        // Get all open instances for this template/tournament
        const { data: instances, error: instancesError } = await supabase
          .from('competition_instances')
          .select('id, instance_number, current_players, max_players, status, reg_close_at')
          .eq('template_id', template.id)
          .eq('tournament_id', tournamentId)
          .eq('status', 'open')
          .order('instance_number');

        if (instancesError) {
          console.error('Error fetching instances:', instancesError);
          return { ...template, instances: [] };
        }

        return {
          ...template,
          instances: instances || []
        };
      })
    );

    return NextResponse.json({
      templates: templatesWithInstances,
      tournament_id: tournamentId
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/one-2-one/templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
