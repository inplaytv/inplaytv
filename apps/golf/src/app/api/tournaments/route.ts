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

    console.log('🔍 API: Total tournaments fetched:', tournaments?.length);
    console.log('🔍 API: Tournament names:', tournaments?.map(t => t.name));
    console.log('🔍 API: Filter was: is_visible = true');

    console.log(`🏌️ Found ${tournaments?.length || 0} tournaments in database`);
    if (tournaments && tournaments.length > 0) {
      console.log('Tournament statuses:', tournaments.map(t => `${t.name}: ${t.status}`));
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

        console.log(`Tournament: ${tournament.name} (${tournament.status})`);
        console.log(`  Competitions found: ${competitions?.length || 0}`);
        if (competitions && competitions.length > 0) {
          competitions.forEach(c => {
            const types: any = c.competition_types;
            const typeName = Array.isArray(types) ? types[0]?.name : types?.name;
            console.log(`  - ${typeName}: status=${c.status}, fee=${c.entry_fee_pennies}p`);
          });
        }

        // Auto-select featured competition based on current round
        // Priority: Full Course (before R1) → THE WEEKENDER (R3-4 available) → Final Strike (R4 only)
        let featuredCompetition = null;
        
        if (competitions && competitions.length > 0 && tournament.start_date) {
          const now = new Date();
          const tournamentStart = new Date(tournament.start_date);
          
          // Calculate days since tournament started
          const daysSinceStart = Math.floor((now.getTime() - tournamentStart.getTime()) / (1000 * 60 * 60 * 24));
          
          // Helper to safely get competition type name
          const getCompName = (comp: any) => {
            const types = comp.competition_types;
            return Array.isArray(types) ? types[0]?.name : types?.name;
          };
          
          // Find competitions by name
          const fullCourse = competitions.find(c => getCompName(c) === 'Full Course');
          const weekender = competitions.find(c => getCompName(c) === 'THE WEEKENDER');
          const finalStrike = competitions.find(c => getCompName(c) === 'Final Strike');
          
          // Auto-rotation logic based on which rounds are still available
          if (daysSinceStart < 0) {
            // Before tournament starts: Show Full Course
            featuredCompetition = fullCourse;
          } else if (daysSinceStart >= 0 && daysSinceStart < 2) {
            // Day 0-1 (Rounds 1-2): Show Full Course
            featuredCompetition = fullCourse;
          } else if (daysSinceStart >= 2 && daysSinceStart < 3) {
            // Day 2 (Round 3): Show THE WEEKENDER (Rounds 3-4)
            featuredCompetition = weekender || finalStrike || fullCourse;
          } else if (daysSinceStart >= 3) {
            // Day 3+ (Round 4): Show Final Strike
            featuredCompetition = finalStrike || fullCourse;
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
