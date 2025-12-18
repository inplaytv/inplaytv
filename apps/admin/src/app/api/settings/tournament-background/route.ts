import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'tournament_page_background')
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        backgroundUrl: '/backgrounds/golf-course-green.jpg',
        backgroundImage: '/backgrounds/golf-course-green.jpg',
        opacity: 0.15,
        overlay: 0.4
      });
    }

    // Parse JSON settings or use plain string for backwards compatibility
    let settings;
    try {
      settings = data?.setting_value ? JSON.parse(data.setting_value) : null;
    } catch {
      settings = { backgroundImage: data?.setting_value || '/backgrounds/golf-course-green.jpg' };
    }

    return NextResponse.json({ 
      backgroundUrl: settings.backgroundImage || settings.backgroundUrl || '/backgrounds/golf-course-green.jpg',
      backgroundImage: settings.backgroundImage || settings.backgroundUrl || '/backgrounds/golf-course-green.jpg',
      opacity: settings.opacity ?? 0.15,
      overlay: settings.overlay ?? 0.4
    });
  } catch (error) {
    console.error('Error fetching background:', error);
    return NextResponse.json({ 
      backgroundUrl: '/backgrounds/golf-02.jpg' // Default fallback
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { backgroundUrl } = await request.json();

    console.log('Received background URL:', backgroundUrl);
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Service role key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (!backgroundUrl) {
      return NextResponse.json({ error: 'Background URL is required' }, { status: 400 });
    }

    // Store as JSON to support opacity and overlay settings
    const settingsJson = JSON.stringify({
      backgroundImage: backgroundUrl,
      backgroundUrl: backgroundUrl, // Keep for backwards compatibility
      opacity: 0.15,
      overlay: 0.4
    });

    // Update or insert the tournament background setting
    const { data, error } = await supabase
      .from('site_settings')
      .upsert({
        setting_key: 'tournament_page_background',
        setting_value: settingsJson,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key'
      });

    console.log('Database operation result:', { data, error });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    // Verify the update by reading it back
    const { data: verifyData, error: verifyError } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'tournament_page_background')
      .single();

    console.log('Verification read:', { verifyData, verifyError });

    return NextResponse.json({ 
      message: 'Background updated successfully',
      backgroundUrl,
      verified: verifyData?.setting_value
    });

  } catch (error) {
    console.error('Error updating background:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}