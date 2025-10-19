import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get single competition
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
        ),
        tournaments (
          id,
          name,
          slug
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('GET competition error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update competition
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();

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
        entry_fee_pennies: parseInt(entry_fee_pennies),
        entrants_cap: parseInt(entrants_cap),
        admin_fee_percent: parseFloat(admin_fee_percent) || 10.0,
        reg_open_at: reg_open_at || null,
        reg_close_at: reg_close_at || null,
        start_at: start_at || null,
        end_at: end_at || null,
        status: status || 'draft',
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('PUT competition error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete competition
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('tournament_competitions')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE competition error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
