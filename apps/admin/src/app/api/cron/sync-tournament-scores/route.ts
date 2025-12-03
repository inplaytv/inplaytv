// ============================================================================
// Automated Tournament Scoring Sync - Cron Job
// ============================================================================
// Purpose: Automatically fetch and update scores for live tournaments
// Schedule: Every 5 minutes during tournament hours
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface CronSyncResult {
  success: boolean;
  timestamp: string;
  tournamentsProcessed: number;
  tournamentResults: {
    id: string;
    name: string;
    success: boolean;
    scoresUpdated: number;
    error?: string;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron secret' },
        { status: 401 }
      );
    }

    console.log('🔄 Starting automated tournament scoring sync...');
    const startTime = Date.now();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find all tournaments that need score updates
    // Only sync tournaments that are:
    // 1. Status = 'live' (currently happening)
    // 2. Status = 'registration_closed' (about to start)
    const { data: liveTournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('id, name, event_id, status, start_date, end_date, current_round')
      .in('status', ['registration_closed', 'live'])
      .not('event_id', 'is', null)
      .order('start_date', { ascending: true });

    if (tournamentsError) {
      throw new Error(`Failed to fetch tournaments: ${tournamentsError.message}`);
    }

    if (!liveTournaments || liveTournaments.length === 0) {
      console.log('ℹ️  No live tournaments to sync');
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        tournamentsProcessed: 0,
        tournamentResults: [],
        message: 'No live tournaments to sync',
      });
    }

    console.log(`📊 Found ${liveTournaments.length} tournaments to sync`);

    // Process each tournament
    const results: CronSyncResult['tournamentResults'] = [];

    for (const tournament of liveTournaments) {
      try {
        console.log(`\n🏌️ Syncing ${tournament.name}...`);

        // Call the sync API endpoint
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
        const syncUrl = `${baseUrl}/api/admin/tournaments/${tournament.id}/sync-scores`;

        const syncResponse = await fetch(syncUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CRON_SECRET}`,
          },
        });

        const syncResult = await syncResponse.json();

        if (syncResponse.ok || syncResponse.status === 207) {
          // Success or partial success
          results.push({
            id: tournament.id,
            name: tournament.name,
            success: true,
            scoresUpdated: syncResult.stats?.scoresCreated + syncResult.stats?.scoresUpdated || 0,
          });
          console.log(
            `✅ ${tournament.name}: ${syncResult.stats?.scoresCreated} created, ${syncResult.stats?.scoresUpdated} updated`
          );
        } else {
          throw new Error(syncResult.error || 'Sync failed');
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Error syncing ${tournament.name}:`, errorMessage);
        
        results.push({
          id: tournament.id,
          name: tournament.name,
          success: false,
          scoresUpdated: 0,
          error: errorMessage,
        });

        // Log error to database for admin review
        await logSyncError(supabase, tournament.id, errorMessage);
      }
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;

    console.log(
      `\n✅ Sync complete: ${successCount}/${liveTournaments.length} tournaments successful (${duration}ms)`
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tournamentsProcessed: liveTournaments.length,
      tournamentResults: results,
      duration: `${duration}ms`,
    });

  } catch (error) {
    console.error('❌ Cron sync error:', error);
    
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER: Log sync errors to database
// ============================================================================

async function logSyncError(
  supabase: any,
  tournamentId: string,
  errorMessage: string
) {
  try {
    // TODO: Create a sync_errors table in Phase 2
    // For now, just console log
    console.error(`[DB LOG] Tournament ${tournamentId} sync error: ${errorMessage}`);
    
    // You could also update tournament with error flag:
    // await supabase
    //   .from('tournaments')
    //   .update({ last_sync_error: errorMessage, last_sync_attempt: new Date() })
    //   .eq('id', tournamentId);
    
  } catch (logError) {
    console.error('Failed to log sync error:', logError);
  }
}

// ============================================================================
// POST - Manual trigger (for testing)
// ============================================================================

export async function POST(request: NextRequest) {
  // Allow POST requests for manual testing
  // In production, you might want to restrict this to admin users only
  
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid cron secret' },
      { status: 401 }
    );
  }

  // Reuse the GET logic
  return GET(request);
}
