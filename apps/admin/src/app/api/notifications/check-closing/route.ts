import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/notifications/check-closing
 * 
 * Check for competitions closing soon and send notifications.
 * Should be called by a cron job every hour.
 * 
 * This endpoint:
 * 1. Finds competitions closing in the next 1-2 hours
 * 2. Sends notifications to users who haven't entered yet
 * 3. Marks competitions as notified to avoid spam
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (optional security measure)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Find competitions closing in the next 1-2 hours that haven't been notified
    const { data: competitions, error: fetchError } = await supabase
      .from('tournament_competitions')
      .select(`
        id,
        reg_close_at,
        status,
        notified_closing,
        tournament_id,
        competition_types (
          name
        ),
        tournaments!inner (
          name,
          slug
        )
      `)
      .eq('status', 'reg_open')
      .gte('reg_close_at', oneHourFromNow.toISOString())
      .lte('reg_close_at', twoHoursFromNow.toISOString())
      .or('notified_closing.is.null,notified_closing.eq.false');

    if (fetchError) {
      console.error('Error fetching competitions:', fetchError);
      return NextResponse.json(
        { error: 'Database error', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!competitions || competitions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No competitions closing soon',
        notified: 0
      });
    }

    console.log(`Found ${competitions.length} competitions closing soon`);

    let totalNotified = 0;
    const results = [];

    for (const comp of competitions) {
      try {
        const tournament = Array.isArray(comp.tournaments) ? comp.tournaments[0] : comp.tournaments;
        const compType = Array.isArray(comp.competition_types) ? comp.competition_types[0] : comp.competition_types;
        
        // Send notifications
        const { data: notifyCount, error: notifyError } = await supabase
          .rpc('notify_registration_closing', {
            p_competition_id: comp.id,
            p_competition_name: compType.name,
            p_tournament_name: tournament.name,
            p_closes_at: comp.reg_close_at
          });

        if (notifyError) {
          console.error(`Error notifying for competition ${comp.id}:`, notifyError);
          results.push({
            competition_id: comp.id,
            success: false,
            error: notifyError.message
          });
          continue;
        }

        // Mark competition as notified
        await supabase
          .from('tournament_competitions')
          .update({ notified_closing: true })
          .eq('id', comp.id);

        totalNotified += notifyCount || 0;
        results.push({
          competition_id: comp.id,
          competition_name: compType.name,
          tournament_name: tournament.name,
          closes_at: comp.reg_close_at,
          success: true,
          users_notified: notifyCount || 0
        });

        console.log(`✅ Notified ${notifyCount} users for ${compType.name} - ${tournament.name}`);
      } catch (error: any) {
        console.error(`Error processing competition ${comp.id}:`, error);
        results.push({
          competition_id: comp.id,
          success: false,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${totalNotified} notifications for ${competitions.length} competitions`,
      total_notified: totalNotified,
      competitions_checked: competitions.length,
      results
    });

  } catch (error: any) {
    console.error('Error in check-closing notifications:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    );
  }
}
