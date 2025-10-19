import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get single tournament
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('tournaments')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('GET tournament error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update tournament
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const body = await request.json();
    const {
      name,
      slug,
      description,
      location,
      timezone,
      start_date,
      end_date,
      status,
      admin_fee_percent,
      external_id,
      image_url,
    } = body;

    if (!name || !slug || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Name, slug, start date, and end date are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('tournaments')
      .update({
        name,
        slug,
        description: description || null,
        location: location || null,
        timezone: timezone || 'Europe/London',
        start_date,
        end_date,
        status: status || 'draft',
        admin_fee_percent: parseFloat(admin_fee_percent) || 10.0,
        external_id: external_id || null,
        image_url: image_url || null,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A tournament with this slug already exists' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('PUT tournament error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete tournament
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('tournaments')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE tournament error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
