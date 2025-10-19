import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - List all competition templates
export async function GET() {
  try {
    await assertAdminOrRedirect();
    
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('competition_templates')
      .select(`
        *,
        competition_types (
          id,
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('GET competition templates error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new competition template
export async function POST(request: NextRequest) {
  try {
    await assertAdminOrRedirect();
    
    const body = await request.json();
    const {
      name,
      description,
      competition_type_id,
      entry_fee_pennies,
      entrants_cap,
      admin_fee_percent,
      reg_open_days_before,
    } = body;

    if (!name || !competition_type_id) {
      return NextResponse.json({ error: 'Name and competition type are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('competition_templates')
      .insert({
        name,
        description: description || null,
        competition_type_id,
        entry_fee_pennies: entry_fee_pennies || 0,
        entrants_cap: entrants_cap || 0,
        admin_fee_percent: admin_fee_percent || 10.0,
        reg_open_days_before: reg_open_days_before || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A template with this name already exists' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('POST competition template error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update competition template
export async function PUT(request: NextRequest) {
  try {
    await assertAdminOrRedirect();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      description,
      competition_type_id,
      entry_fee_pennies,
      entrants_cap,
      admin_fee_percent,
      reg_open_days_before,
    } = body;

    if (!name || !competition_type_id) {
      return NextResponse.json({ error: 'Name and competition type are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('competition_templates')
      .update({
        name,
        description: description || null,
        competition_type_id,
        entry_fee_pennies: entry_fee_pennies || 0,
        entrants_cap: entrants_cap || 0,
        admin_fee_percent: admin_fee_percent || 10.0,
        reg_open_days_before: reg_open_days_before || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A template with this name already exists' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('PUT competition template error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete competition template
export async function DELETE(request: NextRequest) {
  try {
    await assertAdminOrRedirect();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('competition_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE competition template error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
