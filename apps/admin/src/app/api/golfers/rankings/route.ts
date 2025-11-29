import { NextRequest, NextResponse } from 'next/server';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface DataGolfRanking {
  am: number;
  country: string;
  datagolf_rank: number;
  dg_id: number;
  dg_skill_estimate: number;
  owgr_rank: number;
  player_name: string;
  primary_tour: string;
}

interface DataGolfRankingsResponse {
  last_updated: string;
  notes: string;
  rankings: DataGolfRanking[];
}

/**
 * GET /api/golfers/rankings
 * Fetch top 500 players from DataGolf rankings
 * Can be used for player search, discovery, and data validation
 */
export async function GET(request: NextRequest) {
  try {
    await assertAdminOrRedirect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const tour = searchParams.get('tour') || 'all'; // pga, euro, all

    const apiKey = process.env.DATAGOLF_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DataGolf API key not configured' },
        { status: 500 }
      );
    }

    console.log('🏆 Fetching DataGolf rankings...');
    const url = `https://feeds.datagolf.com/preds/get-dg-rankings?file_format=json&key=${apiKey}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DataGolf API error:', response.status, errorText);
      return NextResponse.json(
        { error: `DataGolf API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data: DataGolfRankingsResponse = await response.json();
    
    console.log(`✅ Fetched ${data.rankings.length} ranked players`);
    console.log(`📅 Last updated: ${data.last_updated}`);

    // Filter rankings based on params
    let filteredRankings = data.rankings;

    // Filter by tour
    if (tour !== 'all') {
      filteredRankings = filteredRankings.filter(r => 
        r.primary_tour.toLowerCase() === tour.toLowerCase()
      );
    }

    // Search by name
    if (search) {
      const searchLower = search.toLowerCase();
      filteredRankings = filteredRankings.filter(r =>
        r.player_name.toLowerCase().includes(searchLower)
      );
    }

    // Limit results
    filteredRankings = filteredRankings.slice(0, limit);

    return NextResponse.json({
      success: true,
      lastUpdated: data.last_updated,
      notes: data.notes,
      total: filteredRankings.length,
      rankings: filteredRankings.map(r => ({
        dgId: r.dg_id,
        name: r.player_name,
        country: r.country,
        dgRank: r.datagolf_rank,
        owgrRank: r.owgr_rank,
        skillEstimate: r.dg_skill_estimate,
        tour: r.primary_tour,
        isAmateur: r.am === 1
      }))
    });

  } catch (error: any) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch rankings' },
      { status: 500 }
    );
  }
}
