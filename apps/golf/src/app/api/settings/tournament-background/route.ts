import { createServerClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/settings/tournament-background
 * Fetches tournament page background settings from database
 */
export async function GET() {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'tournament_page_background')
      .single();
    
    if (error) {
      console.error('[Tournament Background API] Database error:', error);
      // Return default background if no setting exists
      return NextResponse.json({
        backgroundImage: '/backgrounds/golf-course-green.jpg',
        opacity: 0.15,
        overlay: 0.4
      });
    }
    
    // Parse stored JSON settings
    const settings = data?.setting_value ? JSON.parse(data.setting_value) : {
      backgroundImage: '/backgrounds/golf-course-green.jpg',
      opacity: 0.15,
      overlay: 0.4
    };
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('[Tournament Background API] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch background settings',
        backgroundImage: '/backgrounds/golf-course-green.jpg',
        opacity: 0.15,
        overlay: 0.4
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/tournament-background
 * Updates tournament page background settings (admin only)
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createServerClient();
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Get settings from request body
    const body = await request.json();
    const { backgroundImage, opacity, overlay } = body;
    
    // Validate settings
    if (!backgroundImage || typeof opacity !== 'number' || typeof overlay !== 'number') {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      );
    }
    
    const settings = JSON.stringify({
      backgroundImage,
      opacity,
      overlay
    });
    
    // Update or insert setting
    const { error: upsertError } = await supabase
      .from('site_settings')
      .upsert({
        setting_key: 'tournament_page_background',
        setting_value: settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key'
      });
    
    if (upsertError) {
      console.error('[Tournament Background API] Update error:', upsertError);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      settings: { backgroundImage, opacity, overlay }
    });
  } catch (error) {
    console.error('[Tournament Background API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to update background settings' },
      { status: 500 }
    );
  }
}
