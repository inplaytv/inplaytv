import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Fetch all tournaments
export async function GET(request: NextRequest) {
  try {
    await assertAdminOrRedirect();
    
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('tournaments')
      .select('id, name, slug, status, is_visible')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tournaments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('GET tournaments error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
      auto_manage_timing = true, // Default to auto-manage
    } = body;

    if (!name || !slug || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Name, slug, start date, and end date are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    
    // Calculate registration dates if auto-manage enabled: 7 days before start, 15 minutes before start
    let registrationOpenDate = null;
    let registrationCloseDate = null;
    
    if (auto_manage_timing && start_date) {
      const startDateObj = new Date(start_date);
      registrationOpenDate = new Date(startDateObj.getTime() - 7 * 24 * 60 * 60 * 1000); // -7 days
      registrationCloseDate = new Date(startDateObj.getTime() - 15 * 60 * 1000); // -15 minutes
    }
    
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
        registration_opens_at: registrationOpenDate ? registrationOpenDate.toISOString() : null,
        registration_closes_at: registrationCloseDate ? registrationCloseDate.toISOString() : null,
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
