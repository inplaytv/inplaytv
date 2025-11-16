import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get all promotional cards
export async function GET(request: NextRequest) {
  try {
    await assertAdminOrRedirect();

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('promotional_cards')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('GET promotional cards error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new promotional card
export async function POST(request: NextRequest) {
  try {
    await assertAdminOrRedirect();

    const body = await request.json();
    const {
      title,
      subtitle,
      location,
      date_range,
      prize_pool_display,
      entries_display,
      entry_fee_display,
      first_place_display,
      background_image,
      card_type,
      display_order,
      is_active,
      link_url,
      badge_text,
      badge_style,
    } = body;

    if (!title || !background_image) {
      return NextResponse.json(
        { error: 'Title and background image are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('promotional_cards')
      .insert({
        title,
        subtitle: subtitle || null,
        location: location || null,
        date_range: date_range || null,
        prize_pool_display: prize_pool_display || null,
        entries_display: entries_display || null,
        entry_fee_display: entry_fee_display || null,
        first_place_display: first_place_display || null,
        background_image,
        card_type: card_type || 'featured',
        display_order: display_order || 0,
        is_active: is_active !== undefined ? is_active : true,
        link_url: link_url || null,
        badge_text: badge_text || null,
        badge_style: badge_style || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('POST promotional card error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
