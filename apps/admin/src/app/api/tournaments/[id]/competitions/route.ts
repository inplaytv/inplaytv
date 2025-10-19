import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - List competition instances for a tournament
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('tournament_competitions')
      .select(`
        *,
        competition_types (
          id,
          name,
          slug
        )
      `)
      .eq('tournament_id', params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('GET tournament competitions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add competition instance to tournament
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const body = await request.json();
    const {
      competition_type_id,
      entry_fee_pennies,
      entrants_cap,
      admin_fee_percent,
      reg_open_at,
      reg_close_at,
      start_at,
      end_at,
      status,
    } = body;

    if (!competition_type_id) {
      return NextResponse.json(
        { error: 'Competition type ID is required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('tournament_competitions')
      .insert({
        tournament_id: params.id,
        competition_type_id,
        entry_fee_pennies: parseInt(entry_fee_pennies) || 0,
        entrants_cap: parseInt(entrants_cap) || 0,
        admin_fee_percent: parseFloat(admin_fee_percent) || 10.00,
        reg_open_at: reg_open_at || null,
        reg_close_at: reg_close_at || null, // If null, DB trigger auto-sets to 15 mins before start_at
        start_at: start_at || null,
        end_at: end_at || null,
        status: status || 'draft',
      })
      .select(`
        *,
        competition_types (
          id,
          name,
          slug
        )
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This competition type is already added to this tournament' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('POST tournament competition error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update competition instance
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get('competitionId');

    if (!competitionId) {
      return NextResponse.json(
        { error: 'Competition ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      entry_fee_pennies,
      entrants_cap,
      admin_fee_percent,
      reg_open_at,
      reg_close_at,
      start_at,
      end_at,
      status,
    } = body;

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('tournament_competitions')
      .update({
        entry_fee_pennies: parseInt(entry_fee_pennies) || 0,
        entrants_cap: parseInt(entrants_cap) || 0,
        admin_fee_percent: parseFloat(admin_fee_percent) || 10.00,
        reg_open_at: reg_open_at || null,
        reg_close_at: reg_close_at || null, // If null, DB trigger auto-sets to 15 mins before start_at
        start_at: start_at || null,
        end_at: end_at || null,
        status: status || 'draft',
      })
      .eq('id', competitionId)
      .eq('tournament_id', params.id)
      .select(`
        *,
        competition_types (
          id,
          name,
          slug
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('PUT tournament competition error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove competition instance from tournament
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get('competitionId');

    if (!competitionId) {
      return NextResponse.json(
        { error: 'Competition ID is required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('tournament_competitions')
      .delete()
      .eq('id', competitionId)
      .eq('tournament_id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE tournament competition error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
