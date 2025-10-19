import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST - Create new tournament
export async function POST(request: NextRequest) {
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
      .insert({
        name,
        slug,
        description: description || null,
        location: location || null,
        timezone: timezone || 'Europe/London',
        start_date,
        end_date,
        status: status || 'draft',
        external_id: external_id || null,
        image_url: image_url || null,
      })
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
    console.error('POST tournament error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
