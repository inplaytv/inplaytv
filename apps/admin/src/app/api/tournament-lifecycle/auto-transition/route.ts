import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

interface TransitionLog {
  tournamentId: string;
  tournamentName: string;
  fromStatus: string;
  toStatus: string;
  reason: string;
  success: boolean;
  error?: string;
}

/**
 * Automated Status Transition Handler
 * 
 * This endpoint checks all tournaments and automatically transitions their status based on:
 * - registration_opens_at: upcoming → registration_open
 * - registration_closes_at: registration_open → registration_closed (then to live if tournament started)
 * - start_date: → live
 * - end_date: live → completed
 * 
 * Call this from a cron job every 1-5 minutes for reliable automation.
 * 
 * Security: Should be protected by a secret token in production
 */
export async function POST(request: Request) {
  try {
    // Optional: Verify secret token for production security
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Auto-Transition] Starting automated status check...');
    
    const now = new Date();
    const transitions: TransitionLog[] = [];
    
    // Fetch all active tournaments (not cancelled or completed)
    const { data: tournaments, error: fetchError } = await supabase
      .from('tournaments')
      .select('*')
      .in('status', ['upcoming', 'registration_open', 'live'])
      .order('start_date', { ascending: true });

    if (fetchError) {
      console.error('[Auto-Transition] Error fetching tournaments:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch tournaments', details: fetchError.message },
        { status: 500 }
      );
    }

    console.log(`[Auto-Transition] Checking ${tournaments?.length || 0} active tournaments...`);

    // Process each tournament
    for (const tournament of tournaments || []) {
      const startDate = new Date(tournament.start_date);
      const endDate = new Date(tournament.end_date);
      const regOpensAt = tournament.registration_opens_at ? new Date(tournament.registration_opens_at) : null;
      const regClosesAt = tournament.registration_closes_at ? new Date(tournament.registration_closes_at) : null;

      let newStatus: string | null = null;
      let reason = '';

      // Determine if transition is needed
      if (tournament.status === 'upcoming' && regOpensAt && now >= regOpensAt) {
        // Check if tournament has golfers before opening registration
        const { count: golferCount } = await supabase
          .from('tournament_golfers')
          .select('*', { count: 'exact', head: true })
          .eq('tournament_id', tournament.id);

        if (golferCount && golferCount > 0) {
          newStatus = 'registration_open';
          reason = 'Registration window opened';
        } else {
          console.warn(`[Auto-Transition] ${tournament.name}: Cannot open registration - no golfers assigned`);
          transitions.push({
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            fromStatus: tournament.status,
            toStatus: 'registration_open',
            reason: 'Registration window reached',
            success: false,
            error: 'No golfers assigned to tournament'
          });
          continue;
        }
      } 
      else if (tournament.status === 'registration_open' && regClosesAt && now >= regClosesAt) {
        // Check if tournament should start immediately or wait
        if (now >= startDate) {
          // Tournament has already started, go directly to live
          const { count: competitionCount } = await supabase
            .from('tournament_competitions')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', tournament.id);

          if (competitionCount && competitionCount > 0) {
            newStatus = 'live';
            reason = 'Registration closed and tournament started';
          } else {
            console.warn(`[Auto-Transition] ${tournament.name}: Cannot start tournament - no competitions created`);
            transitions.push({
              tournamentId: tournament.id,
              tournamentName: tournament.name,
              fromStatus: tournament.status,
              toStatus: 'live',
              reason: 'Tournament start time reached',
              success: false,
              error: 'No competitions created for tournament'
            });
            continue;
          }
        } else {
          // Just close registration, don't start tournament yet
          newStatus = 'upcoming'; // Or create a new 'registration_closed' status
          reason = 'Registration window closed';
        }
      }
      else if ((tournament.status === 'upcoming' || tournament.status === 'registration_open') && now >= startDate) {
        // Tournament start time reached
        const { count: competitionCount } = await supabase
          .from('tournament_competitions')
          .select('*', { count: 'exact', head: true })
          .eq('tournament_id', tournament.id);

        if (competitionCount && competitionCount > 0) {
          newStatus = 'live';
          reason = 'Tournament start time reached';
        } else {
          console.warn(`[Auto-Transition] ${tournament.name}: Cannot start tournament - no competitions created`);
          transitions.push({
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            fromStatus: tournament.status,
            toStatus: 'live',
            reason: 'Tournament start time reached',
            success: false,
            error: 'No competitions created for tournament'
          });
          continue;
        }
      }
      else if (tournament.status === 'live' && now >= endDate) {
        // Tournament end time reached - should be completed
        // NOTE: In production, you might want to wait for final scores to be synced
        // For now, we'll auto-complete but this could be manual
        console.log(`[Auto-Transition] ${tournament.name}: Tournament ended, should be marked complete`);
        // Uncomment to enable auto-completion:
        // newStatus = 'completed';
        // reason = 'Tournament end time reached';
        
        // For safety, just log a warning instead of auto-completing
        transitions.push({
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          fromStatus: tournament.status,
          toStatus: 'completed',
          reason: 'Tournament end time reached',
          success: false,
          error: 'Auto-completion disabled for safety - please complete manually'
        });
        continue;
      }

      // Perform transition if needed
      if (newStatus) {
        const { error: updateError } = await supabase
          .from('tournaments')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', tournament.id);

        if (updateError) {
          console.error(`[Auto-Transition] Error updating ${tournament.name}:`, updateError);
          transitions.push({
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            fromStatus: tournament.status,
            toStatus: newStatus,
            reason,
            success: false,
            error: updateError.message
          });
        } else {
          console.log(`[Auto-Transition] ✅ ${tournament.name}: ${tournament.status} → ${newStatus} (${reason})`);
          
          // 🆕 AUTO-SYNC: Update competition dates after status transition
          try {
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';
            const syncResponse = await fetch(`${baseUrl}/api/tournaments/${tournament.id}/competitions/calculate-times`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (syncResponse.ok) {
              const syncData = await syncResponse.json();
              console.log(`[Auto-Transition] 🔄 Synced competition dates: ${syncData.updated} competitions updated`);
            } else {
              console.warn(`[Auto-Transition] ⚠️ Failed to sync competition dates for ${tournament.name}`);
            }
          } catch (syncError) {
            console.error(`[Auto-Transition] ❌ Error syncing competition dates:`, syncError);
            // Don't fail the transition if sync fails - just log the error
          }
          
          transitions.push({
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            fromStatus: tournament.status,
            toStatus: newStatus,
            reason,
            success: true
          });
        }
      }
    }

    const successCount = transitions.filter(t => t.success).length;
    const failureCount = transitions.filter(t => !t.success).length;

    console.log(`[Auto-Transition] Complete: ${successCount} successful, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      checked: tournaments?.length || 0,
      transitioned: successCount,
      failed: failureCount,
      transitions
    });

  } catch (error) {
    console.error('[Auto-Transition] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Allow GET for testing purposes
export async function GET() {
  return NextResponse.json({
    endpoint: 'Auto-Transition Handler',
    method: 'POST',
    description: 'Automatically transitions tournament statuses based on timestamps',
    usage: 'Call this from a cron job every 1-5 minutes',
    security: 'Set CRON_SECRET_TOKEN env variable for production',
    transitions: {
      upcoming_to_registration_open: 'When registration_opens_at is reached',
      registration_open_to_upcoming: 'When registration_closes_at is reached (if tournament not started)',
      any_to_live: 'When start_date is reached',
      live_to_completed: 'When end_date is reached (disabled by default for safety)'
    }
  });
}
