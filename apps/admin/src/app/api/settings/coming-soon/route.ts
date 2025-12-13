import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

/**
 * GET /api/settings/coming-soon
 * Fetch coming soon page customization settings
 */
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value')
      .in('setting_key', [
        'coming_soon_headline',
        'coming_soon_description',
        'coming_soon_background_image',
        'coming_soon_logo_text',
        'coming_soon_tagline'
      ]);

    if (error) throw error;

    // Transform array to object
    const settings = {
      headline: data?.find(s => s.setting_key === 'coming_soon_headline')?.setting_value || 'COMING SOON',
      description: data?.find(s => s.setting_key === 'coming_soon_description')?.setting_value || 'Precision meets passion in a live, immersive format. Competition will never emerge the same.',
      backgroundImage: data?.find(s => s.setting_key === 'coming_soon_background_image')?.setting_value || '/backgrounds/golf-03.jpg',
      logoText: data?.find(s => s.setting_key === 'coming_soon_logo_text')?.setting_value || 'InPlayTV',
      tagline: data?.find(s => s.setting_key === 'coming_soon_tagline')?.setting_value || 'A new way to follow what matters.'
    };

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error fetching coming soon settings:', error);
    return NextResponse.json(
      { 
        headline: 'COMING SOON',
        description: 'Precision meets passion in a live, immersive format. Competition will never emerge the same.',
        backgroundImage: '/backgrounds/golf-03.jpg',
        logoText: 'InPlayTV',
        tagline: 'A new way to follow what matters.'
      },
      { status: 200 } // Return defaults instead of error
    );
  }
}

/**
 * PUT /api/settings/coming-soon
 * Update coming soon page customization settings
 */
export async function PUT(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    
    console.log('[DEBUG] Received PUT request with body:', body);
    console.log('[DEBUG] Database URL:', supabaseUrl);
    console.log('[DEBUG] Service key exists:', !!supabaseServiceKey);

    const updates = [
      { key: 'coming_soon_headline', value: body.headline },
      { key: 'coming_soon_description', value: body.description },
      { key: 'coming_soon_background_image', value: body.backgroundImage },
      { key: 'coming_soon_logo_text', value: body.logoText },
      { key: 'coming_soon_tagline', value: body.tagline }
    ];

    console.log('[DEBUG] Updates to apply:', updates);

    // Update each setting
    for (const update of updates) {
      console.log('[DEBUG] Updating:', update);
      const { error, data } = await supabase
        .from('site_settings')
        .upsert({
          setting_key: update.key,
          setting_value: update.value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (error) {
        console.error('[DEBUG] Database error:', error);
        throw error;
      }
      console.log('[DEBUG] Update result:', data);
    }

    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (error: any) {
    console.error('Error updating coming soon settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
