import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

// GET - Get active promotional cards (public)
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('promotional_cards')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('GET promotional cards error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
