import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('advertisement_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching advertisement settings:', error);
      return NextResponse.json({}, { status: 200 }); // Return empty object as fallback
    }

    return NextResponse.json(data || {});
  } catch (error) {
    console.error('Error in advertisements API:', error);
    return NextResponse.json({}, { status: 200 }); // Return empty object as fallback
  }
}
