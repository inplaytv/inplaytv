import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Automated Golfer Field Sync - Cron Job
 * Runs daily to check for upcoming tournaments that need golfer fields populated
 * 
 * Schedule: Daily at 6 AM (or every 6 hours)
 * Trigger: POST /api/cron/sync-tournament-golfers
 * Authorization: Bearer token with CRON_SECRET
 */

interface CronSyncResult {
  success: boolean;
  syncedTournaments: number;
  skippedTournaments: number;
  errors: string[];
  details: Array<{
    tournamentId: string;
    tournamentName: string;
    status: 'synced' | 'skipped' | 'error';
    golfersAdded: number;
    message?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Verify cron authentication
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron secret' },
        { status: 401 }
      );
    }

    console.log('🔄 Starting automated golfer field sync...');

    // Find tournaments that start in the next 30 days that don't have golfers yet
    // Extended window to catch tournaments that may have been created early
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Format as date-only strings for comparison
    const todayStr = today.toISOString().split('T')[0];
    const thirtyDaysStr = thirtyDaysFromNow.toISOString().split('T')[0];

    console.log(`📅 Looking for tournaments between ${todayStr} and ${thirtyDaysStr}`);

    // First, let's see all tournaments that need golfers
    const { data: allUpcoming, error: checkError } = await supabase
      .from('tournaments')
      .select('id, name, start_date, status')
      .in('status', ['upcoming', 'registration_open'])
      .order('start_date', { ascending: true });

    console.log(`📊 Found ${allUpcoming?.length || 0} total tournaments needing golfers`);
    if (allUpcoming && allUpcoming.length > 0) {
      allUpcoming.forEach(t => {
        console.log(`  - ${t.name}: ${t.start_date} (${t.status})`);
      });
    }

    const { data: upcomingTournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('id, name, slug, start_date, status')
      .in('status', ['upcoming', 'registration_open'])
      .gte('start_date', todayStr)
      .lte('start_date', thirtyDaysStr)
      .order('start_date', { ascending: true });

    if (tournamentsError) {
      console.error('❌ Error fetching tournaments:', tournamentsError);
      throw tournamentsError;
    }

    console.log(`📅 Found ${upcomingTournaments?.length || 0} tournaments within 6 days`);

    const results: CronSyncResult['details'] = [];
    let syncedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const tournament of upcomingTournaments || []) {
      try {
        console.log(`\n🏌️ Processing: ${tournament.name} (${tournament.start_date})`);

        // Check if tournament already has golfers
        const { data: existingGolfers, error: checkError } = await supabase
          .from('tournament_golfers')
          .select('id')
          .eq('tournament_id', tournament.id)
          .limit(1);

        if (checkError) {
          console.error(`⚠️ Error checking golfers for ${tournament.name}:`, checkError);
          errors.push(`${tournament.name}: ${checkError.message}`);
          results.push({
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            status: 'error',
            golfersAdded: 0,
            message: `Check error: ${checkError.message}`
          });
          continue;
        }

        if (existingGolfers && existingGolfers.length > 0) {
          console.log(`✅ ${tournament.name} already has golfers - skipping`);
          skippedCount++;
          results.push({
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            status: 'skipped',
            golfersAdded: 0,
            message: 'Already has golfers'
          });
          continue;
        }

        // Sync golfers for this tournament
        console.log(`🔄 Syncing golfers for ${tournament.name}...`);
        
        const syncResult = await syncTournamentGolfers(tournament.id);
        
        if (syncResult.success) {
          syncedCount++;
          results.push({
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            status: 'synced',
            golfersAdded: syncResult.golfersAdded,
            message: `Successfully added ${syncResult.golfersAdded} golfers`
          });
          console.log(`✅ Successfully synced ${syncResult.golfersAdded} golfers for ${tournament.name}`);
        } else {
          errors.push(`${tournament.name}: ${syncResult.error}`);
          results.push({
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            status: 'error',
            golfersAdded: 0,
            message: syncResult.error
          });
          console.error(`❌ Failed to sync ${tournament.name}: ${syncResult.error}`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error';
        errors.push(`${tournament.name}: ${errorMsg}`);
        results.push({
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          status: 'error',
          golfersAdded: 0,
          message: errorMsg
        });
        console.error(`❌ Error processing ${tournament.name}:`, error);
      }
    }

    const result: CronSyncResult = {
      success: errors.length === 0,
      syncedTournaments: syncedCount,
      skippedTournaments: skippedCount,
      errors,
      details: results
    };

    console.log('\n📊 Cron sync summary:');
    console.log(`   ✅ Synced: ${syncedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errors.length}`);

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('❌ Cron sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync tournament golfers',
        syncedTournaments: 0,
        skippedTournaments: 0,
        errors: [error.message],
        details: []
      },
      { status: 500 }
    );
  }
}

/**
 * Sync golfers for a specific tournament from DataGolf API
 */
async function syncTournamentGolfers(tournamentId: string): Promise<{
  success: boolean;
  golfersAdded: number;
  error?: string;
}> {
  try {
    const apiKey = process.env.DATAGOLF_API_KEY;
    if (!apiKey) {
      return { success: false, golfersAdded: 0, error: 'DataGolf API key not configured' };
    }

    // Try PGA tour first
    let dgRes = await fetch(
      `https://feeds.datagolf.com/field-updates?tour=pga&file_format=json&key=${apiKey}`
    );

    if (!dgRes.ok) {
      return { success: false, golfersAdded: 0, error: `DataGolf API error: ${dgRes.status}` };
    }

    let fieldData = await dgRes.json();

    // If no field data, try European tour
    if (!fieldData.field || fieldData.field.length === 0) {
      dgRes = await fetch(
        `https://feeds.datagolf.com/field-updates?tour=euro&file_format=json&key=${apiKey}`
      );
      if (dgRes.ok) {
        fieldData = await dgRes.json();
      }
    }

    // If still no field data, try live tournament stats as fallback
    if (!fieldData.field || fieldData.field.length === 0) {
      dgRes = await fetch(
        `https://feeds.datagolf.com/preds/live-tournament-stats?tour=pga&file_format=json&key=${apiKey}`
      );
      
      if (dgRes.ok) {
        const liveStatsData = await dgRes.json();
        if (liveStatsData.live_stats && liveStatsData.live_stats.length > 0) {
          fieldData = {
            event_name: liveStatsData.event_name,
            field: liveStatsData.live_stats.map((player: any) => ({
              dg_id: player.dg_id,
              player_name: player.player_name,
              country: player.country || 'USA',
            })),
          };
        }
      }
    }

    if (!fieldData.field || fieldData.field.length === 0) {
      return { success: false, golfersAdded: 0, error: 'No field data available from DataGolf' };
    }

    console.log(`📡 Got ${fieldData.field.length} players from DataGolf`);

    // Get or create golfers and link to tournament
    const golfersToInsert = [];
    let created = 0;

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
        const nameParts = player.player_name.split(' ');
        const firstName = nameParts[0] || player.player_name;
        const lastName = nameParts.slice(1).join(' ') || '-';
        
        const { data: newGolfer, error: insertError } = await supabase
          .from('golfers')
          .insert({
            dg_id: player.dg_id,
            first_name: firstName,
            last_name: lastName,
            name: player.player_name,
            country: player.country || 'USA',
          })
          .select('id')
          .single();

        if (insertError) {
          console.error(`⚠️ Error creating golfer ${player.player_name}:`, insertError);
          continue;
        }

        golferId = newGolfer.id;
        created++;
      } else {
        golferId = existingGolfer.id;
      }

      golfersToInsert.push({
        tournament_id: tournamentId,
        golfer_id: golferId,
      });
    }

    // Insert tournament_golfers relationships
    if (golfersToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('tournament_golfers')
        .upsert(golfersToInsert, {
          onConflict: 'tournament_id,golfer_id',
          ignoreDuplicates: false
        });

      if (insertError) {
        return { success: false, golfersAdded: 0, error: insertError.message };
      }
    }

    return {
      success: true,
      golfersAdded: golfersToInsert.length
    };

  } catch (error: any) {
    return {
      success: false,
      golfersAdded: 0,
      error: error.message || 'Unknown error during sync'
    };
  }
}

// Allow GET for manual testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Tournament Golfer Sync Cron Job',
    usage: 'POST with Authorization: Bearer {CRON_SECRET}',
    schedule: 'Daily at 6 AM or every 6 hours',
    purpose: 'Automatically sync golfer fields for tournaments starting within 6 days'
  });
}
