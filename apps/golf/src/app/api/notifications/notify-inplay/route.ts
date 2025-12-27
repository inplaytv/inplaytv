/**
 * API Route: Notify users when their entries go InPlay (competition starts)
 * 
 * Called by cron job to check for competitions starting soon
 * and send notifications to users with entries
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Interfaces removed - now using inline types with lifecycle manager integration

export async function POST(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find competitions starting in the next 15 minutes
    // Integrated with Tournament Lifecycle Manager - uses tournament round tee times as source of truth
    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

    console.log('🔍 Checking for competitions going InPlay...');
    console.log(`⏰ Window: ${now.toISOString()} to ${fifteenMinutesFromNow.toISOString()}`);

    // Query from tournaments (lifecycle manager) joined to competitions
    // This respects the lifecycle manager's authoritative timing
    const { data: tournaments, error: tournamentError } = await supabase
      .from('tournaments')
      .select(`
        id,
        name,
        slug,
        round1_tee_time,
        round2_tee_time,
        round3_tee_time,
        round4_tee_time,
        tournament_competitions (
          id,
          notified_inplay,
          rounds_covered,
          competition_types (
            name
          )
        )
      `)
      .or(`round1_tee_time.gte.${now.toISOString()},round2_tee_time.gte.${now.toISOString()},round3_tee_time.gte.${now.toISOString()},round4_tee_time.gte.${now.toISOString()}`)
      .or(`round1_tee_time.lte.${fifteenMinutesFromNow.toISOString()},round2_tee_time.lte.${fifteenMinutesFromNow.toISOString()},round3_tee_time.lte.${fifteenMinutesFromNow.toISOString()},round4_tee_time.lte.${fifteenMinutesFromNow.toISOString()}`);

    if (tournamentError) {
      console.error('❌ Error fetching tournaments:', tournamentError);
      return NextResponse.json({ error: tournamentError.message }, { status: 500 });
    }

    // Flatten to get competitions with their respective start times from lifecycle manager
    const competitions: Array<{
      id: string;
      start_at: string;
      tournament_name: string;
      tournament_slug: string;
      competition_type_name: string;
    }> = [];

    for (const tournament of tournaments || []) {
      for (const comp of tournament.tournament_competitions || []) {
        if (comp.notified_inplay) continue; // Already notified

        // Determine actual start time based on rounds_covered (lifecycle manager integration)
        let startTime: string | null = null;
        
        if (comp.rounds_covered) {
          // Parse rounds_covered (e.g., "1-4", "1-2", "3-4")
          const [firstRound] = comp.rounds_covered.split('-').map((r: string) => parseInt(r.trim()));
          
          switch (firstRound) {
            case 1: startTime = tournament.round1_tee_time; break;
            case 2: startTime = tournament.round2_tee_time; break;
            case 3: startTime = tournament.round3_tee_time; break;
            case 4: startTime = tournament.round4_tee_time; break;
          }
        } else {
          // Default to Round 1 for full tournament competitions
          startTime = tournament.round1_tee_time;
        }

        if (!startTime) continue;

        const startDate = new Date(startTime);
        if (startDate >= now && startDate <= fifteenMinutesFromNow) {
          competitions.push({
            id: comp.id,
            start_at: startTime,
            tournament_name: tournament.name,
            tournament_slug: tournament.slug,
            competition_type_name: (Array.isArray(comp.competition_types) ? comp.competition_types[0]?.name : comp.competition_types?.name) || 'Competition'
          });
        }
      }
    }

    const { data: _unused, error: compError } = await supabase
      .from('tournament_competitions')
      .select('id')
      .limit(1);

    if (competitions.length === 0) {
      console.log('✅ No competitions starting soon (checked via lifecycle manager)');
      return NextResponse.json({ 
        message: 'No competitions starting soon',
        count: 0 
      });
    }

    console.log(`🎯 Found ${competitions.length} competitions going InPlay (via lifecycle manager)`);

    let totalNotifications = 0;

    for (const competition of competitions) {
      console.log(`\n📢 Processing: ${competition.tournament_name} - ${competition.competition_type_name}`);

      // Find all users with entries in this competition
      const { data: entries, error: entriesError } = await supabase
        .from('competition_entries')
        .select('user_id, entry_name')
        .eq('competition_id', competition.id)
        .eq('status', 'submitted');

      if (entriesError || !entries || entries.length === 0) {
        console.log('  ℹ️  No entries found');
        continue;
      }

      console.log(`  👥 Found ${entries.length} entries`);

      // Get user preferences
      const userIds = entries.map(e => e.user_id);
      const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('user_id, entry_inplay')
        .in('user_id', userIds);

      const prefsMap = new Map(preferences?.map(p => [p.user_id, p.entry_inplay]) || []);

      // Send notifications to users who haven't opted out
      const notifications = entries
        .filter(entry => prefsMap.get(entry.user_id) !== false) // Default true
        .map(entry => ({
          user_id: entry.user_id,
          type: 'entry_inplay',
          title: 'Your Entry is Now InPlay! 🏌️',
          message: `${competition.tournament_name} - ${competition.competition_type_name} has started! Your entry "${entry.entry_name || 'Unnamed Entry'}" is now live and frozen.`,
          link: `/tournaments/${competition.tournament_slug}`,
          created_at: new Date().toISOString()
        }));

      if (notifications.length > 0) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notifError) {
          console.error('  ❌ Error creating notifications:', notifError);
        } else {
          console.log(`  ✅ Sent ${notifications.length} notifications`);
          totalNotifications += notifications.length;
        }
      }
      }

      // Mark competition as notified
      await supabase
        .from('tournament_competitions')
        .update({ notified_inplay: true })
        .eq('id', competition.id);
    }

    console.log(`\n🎉 Total notifications sent: ${totalNotifications}`);

    return NextResponse.json({
      message: 'InPlay notifications sent successfully',
      competitions: competitions.length,
      notifications: totalNotifications
    });

  } catch (error) {
    console.error('❌ Error in notify-inplay:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
