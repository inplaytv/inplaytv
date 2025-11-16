import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { entryId: string } }
) {
  try {
    const supabase = await createServerClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the entry belongs to the user
    const { data: entry, error: entryError } = await supabase
      .from('competition_entries')
      .select('user_id')
      .eq('id', params.entryId)
      .single();

    if (entryError || !entry || entry.user_id !== user.id) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Fetch picks for this entry
    const { data: picks, error: picksError } = await supabase
      .from('entry_picks')
      .select('*')
      .eq('entry_id', params.entryId)
      .order('slot_position', { ascending: true });

    if (picksError) throw picksError;

    return NextResponse.json({ picks: picks || [] });
  } catch (error: any) {
    console.error('GET entry picks error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch picks' },
      { status: 500 }
    );
  }
}
