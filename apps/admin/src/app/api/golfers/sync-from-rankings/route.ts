import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/golfers/sync-from-rankings
 * Update golfer database with latest DataGolf rankings data
 * Creates new golfers or updates existing ones
 */
export async function POST(request: NextRequest) {
  try {
    await assertAdminOrRedirect();

    const body = await request.json();
    const { limit = 500, updateExisting = true } = body;

    const apiKey = process.env.DATAGOLF_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DataGolf API key not configured' },
        { status: 500 }
      );
    }

    console.log('🔄 Syncing golfers from DataGolf rankings...');
    
    // Fetch rankings from DataGolf
    const url = `https://feeds.datagolf.com/preds/get-dg-rankings?file_format=json&key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`DataGolf API error: ${response.status}`);
    }

    const data = await response.json();
    const rankings = data.rankings.slice(0, limit);

    console.log(`📊 Processing ${rankings.length} players...`);

    const adminClient = createAdminClient();
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const ranking of rankings) {
      try {
        // Check if golfer exists
        const { data: existingGolfer } = await adminClient
          .from('golfers')
          .select('id, name, dg_id')
          .eq('dg_id', ranking.dg_id)
          .single();

        if (existingGolfer) {
          if (updateExisting) {
            // Update existing golfer with latest data
            const { error: updateError } = await adminClient
              .from('golfers')
              .update({
                name: ranking.player_name,
                country: ranking.country,
                dg_rank: ranking.datagolf_rank,
                owgr_rank: ranking.owgr_rank,
                skill_estimate: ranking.dg_skill_estimate,
                primary_tour: ranking.primary_tour,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingGolfer.id);

            if (updateError) {
              console.error(`⚠️ Error updating ${ranking.player_name}:`, updateError);
            } else {
              updated++;
            }
          } else {
            skipped++;
          }
        } else {
          // Create new golfer
          const { error: createError } = await adminClient
            .from('golfers')
            .insert({
              dg_id: ranking.dg_id,
              name: ranking.player_name,
              country: ranking.country,
              dg_rank: ranking.datagolf_rank,
              owgr_rank: ranking.owgr_rank,
              skill_estimate: ranking.dg_skill_estimate,
              primary_tour: ranking.primary_tour
            });

          if (createError) {
            console.error(`⚠️ Error creating ${ranking.player_name}:`, createError);
          } else {
            created++;
          }
        }

      } catch (err: any) {
        console.error(`Error processing ${ranking.player_name}:`, err.message);
        skipped++;
      }
    }

    console.log(`✅ Sync complete: ${created} created, ${updated} updated, ${skipped} skipped`);

    return NextResponse.json({
      success: true,
      created,
      updated,
      skipped,
      total: rankings.length,
      lastUpdated: data.last_updated
    });

  } catch (error: any) {
    console.error('Error syncing rankings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync rankings' },
      { status: 500 }
    );
  }
}
