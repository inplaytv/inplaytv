import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ entries: 0 }, { status: 200 });
    }

    // Count user's entries across all competitions
    const { count, error } = await supabase
      .from('competition_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error counting entries:', error);
      return NextResponse.json({ entries: 0 }, { status: 200 });
    }

    return NextResponse.json({ entries: count || 0 });
  } catch (error: any) {
    console.error('GET user entries error:', error);
    return NextResponse.json({ entries: 0 }, { status: 200 });
  }
}
