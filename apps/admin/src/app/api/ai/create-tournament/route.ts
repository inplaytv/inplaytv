import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CompetitionData {
  name: string;
  type: string;
  typeId?: string; // Optional type ID from database
  entryFee: number;
  entrantsCap: number;
  adminFeePercent: number;
  regOpenAt: string;
  regCloseAt: string;
}

interface TournamentCreationData {
  tournament: {
    name: string;
    slug: string;
    tour: string;
    startDate: string;
    endDate: string;
    location: string;
    venue: string;
    imageUrl: string;
  };
  competitions: CompetitionData[];
  golferGroup: string;
}

/**
 * Auto-detect timezone based on tournament location
 */
function detectTimezone(location: string): string {
  const loc = location.toLowerCase();
  
  // US States
  if (loc.includes('hawaii')) return 'Pacific/Honolulu';
  if (loc.includes('alaska')) return 'America/Anchorage';
  if (loc.includes('california') || loc.includes('ca') || loc.includes('pebble beach') || loc.includes('torrey pines')) return 'America/Los_Angeles';
  if (loc.includes('oregon') || loc.includes('washington')) return 'America/Los_Angeles';
  if (loc.includes('arizona')) return 'America/Phoenix';
  if (loc.includes('nevada') || loc.includes('las vegas')) return 'America/Los_Angeles';
  if (loc.includes('utah') || loc.includes('colorado') || loc.includes('new mexico')) return 'America/Denver';
  if (loc.includes('texas') || loc.includes('dallas') || loc.includes('austin') || loc.includes('houston')) return 'America/Chicago';
  if (loc.includes('illinois') || loc.includes('chicago')) return 'America/Chicago';
  if (loc.includes('minnesota') || loc.includes('wisconsin')) return 'America/Chicago';
  if (loc.includes('florida') || loc.includes('miami') || loc.includes('orlando') || loc.includes('palm beach')) return 'America/New_York';
  if (loc.includes('georgia') || loc.includes('atlanta') || loc.includes('augusta')) return 'America/New_York';
  if (loc.includes('carolina') || loc.includes('virginia')) return 'America/New_York';
  if (loc.includes('new york') || loc.includes('ny') || loc.includes('new jersey')) return 'America/New_York';
  if (loc.includes('pennsylvania') || loc.includes('philadelphia')) return 'America/New_York';
  if (loc.includes('massachusetts') || loc.includes('boston')) return 'America/New_York';
  
  // International
  if (loc.includes('uk') || loc.includes('england') || loc.includes('scotland') || loc.includes('wales') || loc.includes('ireland')) return 'Europe/London';
  if (loc.includes('spain') || loc.includes('portugal')) return 'Europe/Madrid';
  if (loc.includes('france') || loc.includes('paris')) return 'Europe/Paris';
  if (loc.includes('italy') || loc.includes('rome')) return 'Europe/Rome';
  if (loc.includes('germany') || loc.includes('berlin')) return 'Europe/Berlin';
  if (loc.includes('dubai') || loc.includes('uae')) return 'Asia/Dubai';
  if (loc.includes('south africa') || loc.includes('johannesburg')) return 'Africa/Johannesburg';
  if (loc.includes('australia') || loc.includes('sydney') || loc.includes('melbourne')) return 'Australia/Sydney';
  if (loc.includes('japan') || loc.includes('tokyo')) return 'Asia/Tokyo';
  if (loc.includes('singapore')) return 'Asia/Singapore';
  if (loc.includes('bahamas') || loc.includes('caribbean')) return 'America/Nassau';
  if (loc.includes('mexico')) return 'America/Mexico_City';
  if (loc.includes('canada')) return 'America/Toronto';
  
  // Default to US Eastern (most PGA tournaments)
  return 'America/New_York';
}

export async function POST(request: NextRequest) {
  try {
    const body: TournamentCreationData = await request.json();
    const { tournament, competitions, golferGroup } = body;
    
    if (!tournament || !competitions || competitions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid tournament data' },
        { status: 400 }
      );
    }
    
    console.log('🏗️ Creating tournament:', tournament.name);
    console.log('📋 Competitions:', competitions.length);
    
    // Step 1: Check if tournament already exists
    const { data: existingTournament } = await supabase
      .from('tournaments')
      .select('id')
      .eq('slug', tournament.slug)
      .single();
    
    if (existingTournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament with this slug already exists' },
        { status: 400 }
      );
    }
    
    // Step 2: Auto-detect timezone based on location
    const timezone = detectTimezone(tournament.location);
    console.log(`🌍 Detected timezone: ${timezone} for ${tournament.location}`);
    
    // Step 3: Calculate registration dates (open 14 days before start)
    const startDate = new Date(tournament.startDate);
    const regOpenDate = new Date(startDate);
    regOpenDate.setDate(startDate.getDate() - 14); // 14 days before
    const regCloseDate = new Date(startDate);
    regCloseDate.setHours(0, 0, 0, 0); // Midnight on tournament start
    
    console.log(`📅 Registration: Opens ${regOpenDate.toISOString().split('T')[0]}, Closes ${regCloseDate.toISOString().split('T')[0]}`);
    
    // Step 4: Create tournament
    const { data: createdTournament, error: tournamentError } = await supabase
      .from('tournaments')
      .insert({
        name: tournament.name,
        slug: tournament.slug,
        tour: tournament.tour.toLowerCase(), // Store normalized tour identifier
        start_date: tournament.startDate,
        end_date: tournament.endDate,
        location: `${tournament.venue}, ${tournament.location}`,
        description: `${tournament.tour} Tour - ${tournament.name}`,
        image_url: tournament.imageUrl,
        status: 'upcoming',
        timezone: timezone,
        admin_fee_percent: 10.00,
        is_visible: true,
        registration_open_date: regOpenDate.toISOString(),
        registration_close_date: regCloseDate.toISOString(),
      })
      .select()
      .single();
    
    if (tournamentError || !createdTournament) {
      console.error('❌ Tournament creation error:', tournamentError);
      throw new Error('Failed to create tournament');
    }
    
    console.log('✅ Tournament created:', createdTournament.id);
    
    // Step 3: Create competitions with typeId from AI generation
    const competitionsToInsert = competitions.map((comp) => {
      // Use typeId if provided (from new database-driven generator), otherwise fall back to name lookup
      let competitionTypeId = comp.typeId || null;
      
      if (!competitionTypeId && comp.name) {
        console.log(`⚠️ No typeId for "${comp.name}", competition will be created without type reference`);
      }
      
      // Convert entry fee from pounds to pennies
      const entryFeePennies = Math.round(comp.entryFee * 100);
      
      return {
        tournament_id: createdTournament.id,
        competition_type_id: competitionTypeId,
        entry_fee_pennies: entryFeePennies,
        entrants_cap: comp.entrantsCap,
        admin_fee_percent: comp.adminFeePercent,
        reg_open_at: comp.regOpenAt,
        reg_close_at: comp.regCloseAt,
        status: 'upcoming',
      };
    });
    
    const { data: createdCompetitions, error: competitionsError } = await supabase
      .from('tournament_competitions')
      .insert(competitionsToInsert)
      .select();
    
    if (competitionsError || !createdCompetitions) {
      console.error('❌ Competitions creation error:', competitionsError);
      // Rollback: Delete tournament
      await supabase.from('tournaments').delete().eq('id', createdTournament.id);
      throw new Error('Failed to create competitions');
    }
    
    console.log('✅ Competitions created:', createdCompetitions.length);
    
    // Step 5: Fetch and assign golfers from DataGolf
    let golfersAdded = 0;
    try {
      console.log('🏌️ Fetching tournament field from DataGolf...');
      
      // Determine tour for DataGolf API (pga, euro, kft, alt)
      // Check tournament name for special cases
      let tourParam = 'pga'; // default
      
      if (tournament.name.toLowerCase().includes('q-school') || 
          tournament.name.toLowerCase().includes('korn ferry')) {
        tourParam = 'kft'; // Korn Ferry Tour
      } else if (tournament.tour === 'European') {
        tourParam = 'euro';
      } else if (tournament.tour === 'LPGA') {
        tourParam = 'lpga';
      } else {
        tourParam = 'pga';
      }
      
      console.log(`📍 Using DataGolf tour: ${tourParam} for ${tournament.name}`);
      
      const apiKey = process.env.DATAGOLF_API_KEY;
      if (apiKey) {
        const dgRes = await fetch(
          `https://feeds.datagolf.com/field-updates?tour=${tourParam}&file_format=json&key=${apiKey}`
        );
        
        if (dgRes.ok) {
          const fieldData = await dgRes.json();
          
          if (fieldData.field && fieldData.field.length > 0) {
            console.log(`✅ Found ${fieldData.field.length} golfers in field`);
            
            // Get or create golfers and link to tournament
            const golfersToInsert = [];
            
            for (const player of fieldData.field) {
              // Check if golfer exists
              const { data: existingGolfer } = await supabase
                .from('golfers')
                .select('id')
                .eq('dg_id', player.dg_id)
                .single();
              
              let golferId;
              
              if (!existingGolfer) {
                // Create new golfer
                const { data: newGolfer } = await supabase
                  .from('golfers')
                  .insert({
                    dg_id: player.dg_id,
                    name: player.player_name,
                    country: player.country,
                    pga_tour_id: player.pga_number?.toString(),
                  })
                  .select('id')
                  .single();
                
                golferId = newGolfer?.id;
              } else {
                golferId = existingGolfer.id;
              }
              
              if (golferId) {
                golfersToInsert.push({
                  tournament_id: createdTournament.id,
                  golfer_id: golferId,
                  status: 'confirmed',
                });
              }
            }
            
            // Insert tournament_golfers relationships in batches
            if (golfersToInsert.length > 0) {
              const { data: addedGolfers, error: golfersError } = await supabase
                .from('tournament_golfers')
                .insert(golfersToInsert)
                .select();
              
              if (!golfersError && addedGolfers) {
                golfersAdded = addedGolfers.length;
                console.log(`✅ Added ${golfersAdded} golfers to tournament`);
              } else {
                console.error('⚠️ Error adding golfers:', golfersError);
              }
            }
          } else {
            console.log('⚠️ No field data available for this tournament');
          }
        }
      }
    } catch (error) {
      console.error('⚠️ Error fetching/adding golfers (non-fatal):', error);
      // Don't fail tournament creation if golfer fetch fails
    }
    
    // Step 6: Calculate salaries for each competition
    // This would be done based on golfer rankings and competition type
    console.log('💰 Salary calculation would happen here');
    
    // Step 7: Update tournament status based on registration dates
    const { error: statusUpdateError } = await supabase.rpc('auto_update_tournament_statuses');
    if (statusUpdateError) {
      console.warn('⚠️ Failed to auto-update tournament status:', statusUpdateError);
    } else {
      console.log('✅ Tournament status auto-updated');
    }
    
    return NextResponse.json({
      success: true,
      tournament: {
        id: createdTournament.id,
        slug: createdTournament.slug,
        name: createdTournament.name,
        competitionsCreated: createdCompetitions.length,
        golfersAdded: golfersAdded,
      },
    });
  } catch (error) {
    console.error('❌ Error creating tournament:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create tournament' 
      },
      { status: 500 }
    );
  }
}
