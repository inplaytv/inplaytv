import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

const VALID_PAGE_KEYS = [
  'tournament_page_background',
  'lobby_page_background',
  'entries_page_background',
  'leaderboards_page_background',
  'one2one_page_background'
];

const DEFAULT_BACKGROUNDS: Record<string, string> = {
  tournament_page_background: '/backgrounds/golf-03.jpg',
  lobby_page_background: '/backgrounds/golf-01.jpg',
  entries_page_background: '/backgrounds/golf-02.jpg',
  leaderboards_page_background: '/backgrounds/golf-04.jpg',
  one2one_page_background: '/backgrounds/golf-05.jpg'
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageKey = searchParams.get('page');

    if (!pageKey || !VALID_PAGE_KEYS.includes(pageKey)) {
      return NextResponse.json({ 
        error: 'Invalid page key',
        validKeys: VALID_PAGE_KEYS 
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', pageKey)
      .single();

    if (error) {
      console.log(`No custom background for ${pageKey}, using default`);
      return NextResponse.json({ 
        backgroundUrl: DEFAULT_BACKGROUNDS[pageKey],
        backgroundImage: DEFAULT_BACKGROUNDS[pageKey],
        opacity: 0.15,
        overlay: 0.4,
        source: 'default'
      });
    }

    // Parse JSON settings
    let settings;
    try {
      settings = data?.setting_value ? JSON.parse(data.setting_value) : null;
    } catch {
      settings = { backgroundImage: data?.setting_value || DEFAULT_BACKGROUNDS[pageKey] };
    }

    return NextResponse.json({ 
      backgroundUrl: settings.backgroundImage || settings.backgroundUrl || DEFAULT_BACKGROUNDS[pageKey],
      backgroundImage: settings.backgroundImage || settings.backgroundUrl || DEFAULT_BACKGROUNDS[pageKey],
      opacity: settings.opacity ?? 0.15,
      overlay: settings.overlay ?? 0.4,
      source: 'database'
    });
  } catch (error) {
    console.error('Error fetching background:', error);
    return NextResponse.json({ 
      backgroundUrl: '/backgrounds/golf-course-green.jpg',
      source: 'fallback'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pageKey, backgroundUrl, opacity, overlay } = await request.json();

    console.log('🎨 Updating page background:', { pageKey, backgroundUrl, opacity, overlay });

    if (!pageKey || !VALID_PAGE_KEYS.includes(pageKey)) {
      return NextResponse.json({ 
        error: 'Invalid page key',
        validKeys: VALID_PAGE_KEYS 
      }, { status: 400 });
    }

    if (!backgroundUrl) {
      return NextResponse.json({ error: 'Background URL is required' }, { status: 400 });
    }

    // Store as JSON to support opacity and overlay settings
    const settingsJson = JSON.stringify({
      backgroundImage: backgroundUrl,
      backgroundUrl: backgroundUrl,
      opacity: opacity ?? 0.15,
      overlay: overlay ?? 0.4
    });

    // Update or insert the page background setting
    const { data, error } = await supabase
      .from('site_settings')
      .upsert({
        setting_key: pageKey,
        setting_value: settingsJson,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key'
      })
      .select();

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ error: 'Failed to update background' }, { status: 500 });
    }

    console.log('✅ Background updated successfully for:', pageKey);

    return NextResponse.json({ 
      success: true,
      pageKey,
      backgroundUrl,
      data
    });
  } catch (error) {
    console.error('❌ Error updating background:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
