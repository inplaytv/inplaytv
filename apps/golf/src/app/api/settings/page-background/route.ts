import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', pageKey)
      .maybeSingle();

    if (error || !data) {
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
      opacity: 0.15,
      overlay: 0.4,
      source: 'fallback'
    }, { status: 500 });
  }
}
