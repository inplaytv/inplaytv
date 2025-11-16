import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Fetch all active competitions with their featured status
export async function GET(request: NextRequest) {
  try {
    await assertAdminOrRedirect();
    
    const adminClient = createAdminClient();

    // First check if columns exist by doing a simple query
    const { data: testData, error: testError } = await adminClient
      .from('tournament_competitions')
      .select('id, is_featured')
      .limit(1);

    // If columns don't exist, return helpful error
    if (testError && testError.message.includes('column')) {
      console.error('Featured columns not found. Run migration: scripts/2025-01-featured-competitions.sql');
      return NextResponse.json({ 
        error: 'Database schema needs update. Run featured competitions migration.',
        details: testError.message 
      }, { status: 500 });
    }

    const { data: competitions, error } = await adminClient
      .from('tournament_competitions')
      .select(`
        id,
        tournament_id,
        entry_fee_pennies,
        entrants_cap,
        admin_fee_percent,
        status,
        is_featured,
        featured_order,
        featured_message,
        competition_types (
          id,
          name,
          slug
        ),
        tournaments (
          id,
          name,
          slug,
          location,
          start_date,
          end_date,
          status
        )
      `)
      .in('status', ['draft', 'upcoming', 'reg_open', 'reg_closed', 'live'])
      .order('is_featured', { ascending: false })
      .order('featured_order', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Query error:', error);
      throw error;
    }

    return NextResponse.json(competitions || []);
  } catch (error: any) {
    console.error('GET featured competitions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update featured status, order, or message
export async function PUT(request: NextRequest) {
  try {
    await assertAdminOrRedirect();
    
    const adminClient = createAdminClient();
    const body = await request.json();
    const { competition_id, is_featured, featured_order, featured_message } = body;

    if (!competition_id) {
      return NextResponse.json({ error: 'competition_id is required' }, { status: 400 });
    }

    // Build update object based on provided fields
    const updates: any = {};
    
    if (typeof is_featured === 'boolean') {
      updates.is_featured = is_featured;
      // If unfeaturing, clear order and message
      if (!is_featured) {
        updates.featured_order = null;
        updates.featured_message = null;
      }
    }
    
    if (featured_order !== undefined) {
      updates.featured_order = featured_order;
    }
    
    if (featured_message !== undefined) {
      updates.featured_message = featured_message;
    }

    const { data, error } = await adminClient
      .from('tournament_competitions')
      .update(updates)
      .eq('id', competition_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, competition: data });
  } catch (error: any) {
    console.error('PUT featured competition error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
