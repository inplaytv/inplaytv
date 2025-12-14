import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Create fresh Supabase connection with cache busting
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      }
    );
    
    console.log('🌐 WEB APP: Getting fresh tournament background with cache busting...');
    
    const { data, error } = await supabase
      .from('settings')
      .select('setting_value')
      .eq('setting_key', 'tournament_page_background')
      .single();

    console.log('🌐 WEB APP: Query result:', { data, error, timestamp: new Date().toISOString() });

    if (error) {
      console.error('🌐 WEB APP: Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Get the setting_value from the result
    const backgroundUrl = data?.setting_value || '/backgrounds/golf-course-green.jpg';
    
    // Return with cache-busting headers
    const response = NextResponse.json({ 
      backgroundUrl: backgroundUrl
    });
    
    // Force no caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;

  } catch (error) {
    console.error('🌐 WEB APP: Error fetching background:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}