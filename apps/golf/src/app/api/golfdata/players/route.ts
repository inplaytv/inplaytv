import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface PlayerListItem {
  id: string;
  name: string;
  country: string | null;
  photoUrl: string | null;
  form: {
    status: 'hot' | 'cold' | 'neutral';
    sgTotalL5: number | null;
    sgTotalL20: number | null;
    momentum: number;
  };
  stats: {
    totalRounds: number;
    lastRoundDate: string | null;
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'form'; // form, name, rounds
    const formFilter = searchParams.get('form'); // hot, cold, neutral
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query the hot_cold view which joins golfers with SG averages
    let query = supabase
      .from('player_hot_cold_list')
      .select('*');

    // Apply search filter
    if (search) {
      query = query.ilike('player_name', `%${search}%`);
    }

    // Apply form filter
    if (formFilter) {
      query = query.eq('form_status', formFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case 'form':
        query = query.order('sg_total_l5', { ascending: false });
        break;
      case 'name':
        query = query.order('player_name', { ascending: true });
        break;
      case 'rounds':
        query = query.order('total_rounds', { ascending: false });
        break;
    }
    
    const { data: hotColdData, error } = await query.limit(limit);

    if (error) {
      console.error('Error fetching players:', error);
      return NextResponse.json(
        { error: 'Failed to fetch players', details: error.message },
        { status: 500 }
      );
    }

    // Get additional golfer details
    const playerIds = (hotColdData || []).map(p => p.golfer_id);
    const { data: golferData } = await supabase
      .from('golfers')
      .select('id, country, image_url')
      .in('id', playerIds);

    const golferMap = new Map(golferData?.map(g => [g.id, g]) || []);

    // Transform data
    const playersWithForm: PlayerListItem[] = (hotColdData || []).map((p: any) => {
      const golfer = golferMap.get(p.golfer_id);
      
      return {
        id: p.golfer_id,
        name: p.player_name,
        country: golfer?.country || null,
        photoUrl: golfer?.image_url || null,
        form: {
          status: p.form_status,
          sgTotalL5: p.sg_total_l5,
          sgTotalL20: p.sg_total_l20,
          momentum: p.momentum,
        },
        stats: {
          totalRounds: p.total_rounds,
          lastRoundDate: p.last_round_date,
        },
      };
    });

    return NextResponse.json({
      players: playersWithForm,
      total: playersWithForm.length,
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
