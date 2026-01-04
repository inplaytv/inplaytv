export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';
import { createAdminClient } from '@/lib/supabaseAdminServer';

// GET - List all entries (admin)
export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Fetch entries with event and user details
    const { data: entries, error } = await supabase
      .from('clubhouse_entries')
      .select(`
        id,
        event_id,
        user_id,
        golfer_ids,
        captain_id,
        credits_paid,
        created_at,
        clubhouse_events!inner (
          name
        ),
        profiles!inner (
          email,
          first_name,
          last_name,
          display_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch entries:', error);
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
    }

    // Fetch golfer names for each entry
    const enrichedEntries = await Promise.all(
      (entries || []).map(async (entry: any) => {
        const { data: golfers } = await supabase
          .from('golfers')
          .select('id, first_name, last_name')
          .in('id', entry.golfer_ids);

        const golferNames = entry.golfer_ids.map((id: string) => {
          const golfer = golfers?.find((g: any) => g.id === id);
          return golfer ? `${golfer.first_name} ${golfer.last_name}` : 'Unknown';
        });

        const captain = golfers?.find((g: any) => g.id === entry.captain_id);
        const captainName = captain ? `${captain.first_name} ${captain.last_name}` : 'Unknown';

        return {
          id: entry.id,
          event_id: entry.event_id,
          event_name: entry.clubhouse_events.name,
          user_id: entry.user_id,
          user_email: entry.profiles.email,
          user_name: entry.profiles.display_name,
          golfer_ids: entry.golfer_ids,
          captain_id: entry.captain_id,
          credits_paid: entry.credits_paid,
          created_at: entry.created_at,
          golfer_names: golferNames,
          captain_name: captainName,
        };
      })
    );

    return NextResponse.json(enrichedEntries);

  } catch (error: any) {
    console.error('Unexpected error fetching entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Submit entry (user-facing)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { competition_id, golfer_ids, captain_id } = await req.json();

    // Validate input
    if (!competition_id || !golfer_ids || !Array.isArray(golfer_ids) || golfer_ids.length !== 6 || !captain_id) {
      return NextResponse.json({ 
        error: 'Invalid entry data. Must provide competition_id, 6 golfer_ids, and captain_id' 
      }, { status: 400 });
    }

    if (!golfer_ids.includes(captain_id)) {
      return NextResponse.json({ 
        error: 'Captain must be one of the selected golfers' 
      }, { status: 400 });
    }

    // Get competition details for entry fee
    const { data: competition, error: compError } = await supabase
      .from('clubhouse_competitions')
      .select('entry_credits')
      .eq('id', competition_id)
      .single();

    if (compError || !competition) {
      return NextResponse.json({ 
        error: 'Competition not found' 
      }, { status: 404 });
    }

    // Call RPC function to handle entry submission (atomic transaction)
    const { data, error } = await supabase.rpc('create_clubhouse_entry', {
      p_user_id: user.id,
      p_competition_id: competition_id,
      p_golfer_ids: golfer_ids,
      p_captain_id: captain_id,
      p_credits: competition.entry_credits
    });

    if (error) {
      console.error('Entry submission error:', error);
      return NextResponse.json({ 
        error: error.message || 'Failed to submit entry' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      entry_id: data
    });

  } catch (error: any) {
    console.error('Unexpected error in entry submission:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
