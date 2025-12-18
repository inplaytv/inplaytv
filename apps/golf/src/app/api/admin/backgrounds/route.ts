import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch active background settings
    const { data, error } = await supabase
      .from('tournament_background_settings')
      .select('image_url, opacity, overlay')
      .eq('is_active', true)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Return settings or defaults
    const settings = data || {
      image_url: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2070',
      opacity: 0.15,
      overlay: 0.4
    };

    return NextResponse.json({
      success: true,
      data: {
        backgroundImage: settings.image_url,
        opacity: parseFloat(settings.opacity),
        overlay: parseFloat(settings.overlay)
      }
    });
  } catch (error) {
    console.error('Error fetching tournament backgrounds:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch backgrounds',
        data: {
          backgroundImage: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2070',
          opacity: 0.15,
          overlay: 0.4
        }
      },
      { status: 500 }
    );
  }
}