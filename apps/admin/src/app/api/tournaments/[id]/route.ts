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
      featured_competition_id,
      round1_tee_time,
      round2_tee_time,
      round3_tee_time,
      round4_tee_time,
    } = body;

    if (!name || !slug || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Name, slug, start date, and end date are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    
    // Preserve existing status if not provided (don't default to 'draft')
    let updateData: any = {
      name,
      slug,
      description: description || null,
      location: location || null,
      timezone: timezone || 'Europe/London',
      start_date,
      end_date,
      admin_fee_percent: parseFloat(admin_fee_percent) || 10.0,
      external_id: external_id || null,
      image_url: image_url || null,
      featured_competition_id: featured_competition_id || null,
      round_1_start: round1_tee_time || null,
      round_2_start: round2_tee_time || null,
      round_3_start: round3_tee_time || null,
      round_4_start: round4_tee_time || null,
    };
    
    // Only update status if explicitly provided (lifecycle manager controls this)
    if (status) {
      updateData.status = status;
    }
    
    const { data, error } = await adminClient
      .from('tournaments')
      .update(updateData)
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

    // Auto-sync competition times from lifecycle manager if round tee times were provided
    if (round1_tee_time || round2_tee_time || round3_tee_time || round4_tee_time) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';
        const syncResponse = await fetch(`${baseUrl}/api/tournaments/${params.id}/competitions/calculate-times`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          console.log('✅ Auto-synced competition times:', syncData);
        } else {
          console.warn('⚠️ Failed to auto-sync competition times');
        }
      } catch (syncError) {
        console.error('❌ Error auto-syncing competition times:', syncError);
        // Don't fail the tournament update if sync fails
      }
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

// PATCH - Partial update (e.g., visibility toggle)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const body = await request.json();
    const { is_visible } = body;

    console.log('🔄 PATCH visibility - Tournament ID:', params.id);
    console.log('🔄 PATCH visibility - New value:', is_visible);

    if (typeof is_visible !== 'boolean') {
      return NextResponse.json(
        { error: 'is_visible must be a boolean' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('tournaments')
      .update({ is_visible })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ PATCH visibility - Updated tournament:', data.name, 'is_visible:', data.is_visible);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('PATCH tournament error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
