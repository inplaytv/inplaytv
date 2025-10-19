import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - List all competition types
export async function GET() {
  try {
    await assertAdminOrRedirect();
    
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('competition_types')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('GET competition types error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new competition type
export async function POST(request: NextRequest) {
  try {
    await assertAdminOrRedirect();
    
    const body = await request.json();
    const {
      name,
      slug,
      description,
      is_template,
      default_entry_fee_pennies,
      default_entrants_cap,
      default_admin_fee_percent,
      default_reg_open_days_before,
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('competition_types')
      .insert({
        name,
        slug,
        description: description || null,
        is_template: is_template || false,
        default_entry_fee_pennies: default_entry_fee_pennies || null,
        default_entrants_cap: default_entrants_cap || null,
        default_admin_fee_percent: default_admin_fee_percent || null,
        default_reg_open_days_before: default_reg_open_days_before || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'A competition type with this name or slug already exists' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('POST competition type error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update competition type
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
      slug,
      description,
      is_template,
      default_entry_fee_pennies,
      default_entrants_cap,
      default_admin_fee_percent,
      default_reg_open_days_before,
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('competition_types')
      .update({
        name,
        slug,
        description: description || null,
        is_template: is_template || false,
        default_entry_fee_pennies: default_entry_fee_pennies || null,
        default_entrants_cap: default_entrants_cap || null,
        default_admin_fee_percent: default_admin_fee_percent || null,
        default_reg_open_days_before: default_reg_open_days_before || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A competition type with this name or slug already exists' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('PUT competition type error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete competition type
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
      .from('competition_types')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE competition type error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
