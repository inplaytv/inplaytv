import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';

/**
 * GET /api/one-2-one-templates
 * Returns all ONE 2 ONE templates (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient();

    // Fetch all ONE 2 ONE templates
    const { data: templates, error } = await adminClient
      .from('competition_templates')
      .select('*')
      .order('rounds_covered', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(templates || []);
  } catch (error) {
    console.error('Error fetching ONE 2 ONE templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/one-2-one-templates
 * Create a new ONE 2 ONE template (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    const {
      name,
      short_name,
      description,
      entry_fee_pennies,
      admin_fee_percent,
      max_players,
      rounds_covered,
      reg_close_round,
      status
    } = body;

    // Validate required fields
    if (!name || !short_name || !rounds_covered || rounds_covered.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert new template
    const { data: template, error } = await adminClient
      .from('competition_templates')
      .insert({
        name,
        short_name,
        description,
        entry_fee_pennies: entry_fee_pennies || 0,
        admin_fee_percent: admin_fee_percent || 10,
        max_players: 2, // Always 2 for ONE 2 ONE
        rounds_covered,
        reg_close_round,
        status: status || 'active'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('Error creating ONE 2 ONE template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/one-2-one-templates?id={templateId}
 * Update an existing ONE 2 ONE template (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const adminClient = createAdminClient();

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      short_name,
      description,
      entry_fee_pennies,
      admin_fee_percent,
      rounds_covered,
      reg_close_round,
      status
    } = body;

    // Update template
    const { data: template, error } = await adminClient
      .from('competition_templates')
      .update({
        name,
        short_name,
        description,
        entry_fee_pennies,
        admin_fee_percent,
        rounds_covered,
        reg_close_round,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('Error updating ONE 2 ONE template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update template' },
      { status: 500 }
    );
  }
}
