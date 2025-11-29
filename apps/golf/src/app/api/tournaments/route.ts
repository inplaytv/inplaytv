import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all visible tournaments
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select(`
        id,
        name,
        slug,
        description,
        location,
        start_date,
        end_date,
        status,
        image_url,
        created_at,
        featured_competition_id
      `)
      .eq('is_visible', true)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching tournaments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // For each tournament, fetch its competitions and featured competition details
    const tournamentsWithCompetitions = await Promise.all(
      (tournaments || []).map(async (tournament) => {
        const { data: competitions, error: compError } = await supabase
          .from('tournament_competitions')
          .select(`
            id,
            entry_fee_pennies,
            entrants_cap,
            admin_fee_percent,
            reg_open_at,
            reg_close_at,
            start_at,
            end_at,
            status,
            tournament_id,
            competition_type_id,
            competition_types (
              id,
              name,
              slug,
              description,
              rounds_count
            )
          `)
          .eq('tournament_id', tournament.id)
          .order('entry_fee_pennies', { ascending: false });

        if (compError) {
          console.error(`Competition fetch error for tournament ${tournament.name}:`, compError);
        }

        // Auto-select featured competition based on current round
        // Logic: Show competition for rounds that are still playable
        let featuredCompetition = null;
        
        if (competitions && competitions.length > 0 && tournament.start_date && tournament.end_date) {
          const now = new Date();
          const tournamentStart = new Date(tournament.start_date);
          const tournamentEnd = new Date(tournament.end_date);
          
          // Calculate which day of the tournament we're on (1-4)
          // For a 4-day tournament: Day 1 = Round 1, Day 2 = Round 2, Day 3 = Round 3, Day 4 = Round 4
          const daysSinceStart = Math.floor((now.getTime() - tournamentStart.getTime()) / (1000 * 60 * 60 * 24));
          const tournamentDayNumber = daysSinceStart + 1; // Day 1, 2, 3, or 4
          
          // Calculate rounds remaining (what rounds can still be played)
          // If we're on Day 3 (Round 3 playing/just finished), only Round 4 remains
          const roundsRemaining = Math.max(0, 4 - tournamentDayNumber);
          
          // Helper to safely get competition type name
          const getCompName = (comp: any) => {
            const types = comp.competition_types;
            return Array.isArray(types) ? types[0]?.name : types?.name;
          };
          
          // Find competitions by name
          const fullCourse = competitions.find(c => getCompName(c) === 'Full Course');
          const firstStrike = competitions.find(c => getCompName(c) === 'First To Strike');
          const beatTheCut = competitions.find(c => getCompName(c) === 'Beat The Cut');
          const weekender = competitions.find(c => getCompName(c) === 'THE WEEKENDER');
          const finalStrike = competitions.find(c => getCompName(c) === 'Final Strike');
          
          // Select based on rounds remaining:
          // 3+ rounds left → Full Course (all 4 rounds)
          // 2 rounds left → THE WEEKENDER (last 2 rounds)
          // 1 round left → Final Strike (last round only)
          // 0 rounds left → Full Course (tournament complete, show results)
          if (roundsRemaining >= 3) {
            // 3-4 rounds remaining: Show Full Course
            featuredCompetition = fullCourse;
          } else if (roundsRemaining === 2) {
            // 2 rounds remaining: Show THE WEEKENDER
            featuredCompetition = weekender || fullCourse;
          } else if (roundsRemaining === 1) {
            // 1 round remaining: Show Final Strike
            featuredCompetition = finalStrike || fullCourse;
          } else {
            // Tournament finished: Show Full Course for results
            featuredCompetition = fullCourse;
          }
          
          // Fallback to full course if no match
          if (!featuredCompetition) {
            featuredCompetition = fullCourse;
          }
        }

        return {
          ...tournament,
          competitions: competitions || [],
          featured_competition: featuredCompetition,
        };
      })
    );

    return NextResponse.json({
      tournaments: tournamentsWithCompetitions,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('GET tournaments error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
