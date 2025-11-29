import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const dataGolfKey = process.env.DATAGOLF_API_KEY!;

export const dynamic = 'force-dynamic';

/**
 * Syncs DraftKings salaries from DataGolf field-updates to our database
 * GET /api/sync-datagolf-salaries?tour=pga
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tour = searchParams.get('tour') || 'pga';

    console.log(`🔄 Syncing DataGolf salaries for ${tour.toUpperCase()} tour...`);

    // Fetch field updates from DataGolf
    const dataGolfUrl = `https://feeds.datagolf.com/field-updates?tour=${tour}&file_format=json&key=${dataGolfKey}`;
    const response = await fetch(dataGolfUrl, { next: { revalidate: 300 } });
    
    if (!response.ok) {
      throw new Error(`DataGolf API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`📊 Event: ${data.event_name}`);
    console.log(`👥 Players in field: ${data.field?.length || 0}`);

    if (!data.field || data.field.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No field data available from DataGolf',
        event_name: data.event_name 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Match players and update salaries
    let matched = 0;
    let notMatched = 0;
    let updated = 0;
    const notMatchedPlayers: string[] = [];

    for (const player of data.field) {
      const playerName = player.player_name; // Format: "Last, First"
      const dkSalary = player.dk_salary;

      if (!dkSalary || dkSalary === 0) {
        continue; // Skip players without DK salary
      }

      // Convert DK salary ($8200) to pennies (820000)
      const salaryPennies = dkSalary * 100;

      // Try to match player by name
      // DataGolf format: "Woodland, Gary"
      // Our format: "Gary Woodland"
      const [lastName, firstName] = playerName.split(', ');
      const fullName = `${firstName} ${lastName}`.trim();

      // Try multiple name variations to find the player
      const { data: golfers, error } = await supabase
        .from('golfers')
        .select('id, full_name, first_name, last_name, salary_pennies')
        .or(`full_name.ilike.%${fullName}%,and(first_name.ilike.%${firstName}%,last_name.ilike.%${lastName}%)`)
        .limit(1);

      if (error) {
        console.error(`❌ Error finding ${fullName}:`, error);
        continue;
      }

      if (!golfers || golfers.length === 0) {
        notMatched++;
        notMatchedPlayers.push(fullName);
        console.log(`⚠️  Not found: ${fullName} (DK: $${dkSalary})`);
        continue;
      }

      matched++;
      const golfer = golfers[0];

      // Update salary if different
      if (golfer.salary_pennies !== salaryPennies) {
        const { error: updateError } = await supabase
          .from('golfers')
          .update({ salary_pennies: salaryPennies })
          .eq('id', golfer.id);

        if (updateError) {
          console.error(`❌ Error updating ${fullName}:`, updateError);
        } else {
          updated++;
          const oldSalary = Math.round((golfer.salary_pennies || 0) / 100);
          console.log(`✅ ${fullName}: £${oldSalary} → £${dkSalary}`);
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Matched: ${matched}`);
    console.log(`   Not Matched: ${notMatched}`);
    console.log(`   Updated: ${updated}`);

    return NextResponse.json({
      success: true,
      event_name: data.event_name,
      tour: tour.toUpperCase(),
      stats: {
        total_players: data.field.length,
        matched,
        not_matched: notMatched,
        updated,
      },
      not_matched_players: notMatchedPlayers,
    });

  } catch (error: any) {
    console.error('❌ Sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
