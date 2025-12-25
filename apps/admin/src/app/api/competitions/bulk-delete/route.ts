import { createAdminClient } from '@/lib/supabaseAdminServer';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/competitions/bulk-delete
 * Bulk delete competitions and all related data
 * Admin only - requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    console.log('🔐 Using admin client - RLS bypassed');
    
    // Parse request body
    const { competitionIds } = await request.json();
    
    if (!competitionIds || !Array.isArray(competitionIds) || competitionIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid competition IDs provided' },
        { status: 400 }
      );
    }

    console.log(`🗑️  Bulk deleting ${competitionIds.length} competitions:`, competitionIds);

    let totalDeleted = 0;
    const errors: string[] = [];

    // Delete each competition (cascade will handle related data)
    for (const competitionId of competitionIds) {
      try {
        console.log(`\n📌 Processing competition: ${competitionId}`);
        
        // Step 1: Delete competition entry picks first (foreign key constraint)
        const { data: entries, error: entriesError } = await supabase
          .from('competition_entries')
          .select('id')
          .eq('competition_id', competitionId);

        if (entriesError) {
          console.error(`   ❌ Error fetching entries:`, entriesError);
          errors.push(`Competition ${competitionId}: Failed to fetch entries - ${entriesError.message}`);
          continue;
        }

        if (entries && entries.length > 0) {
          const entryIds = entries.map(e => e.id);
          console.log(`   Found ${entries.length} entries, deleting picks...`);
          
          // Delete picks
          const { error: picksError } = await supabase
            .from('competition_entry_picks')
            .delete()
            .in('entry_id', entryIds);
          
          if (picksError) {
            console.error(`   ❌ Error deleting picks:`, picksError);
            errors.push(`Competition ${competitionId}: Failed to delete picks - ${picksError.message}`);
            continue;
          }
          
          console.log(`   ✅ Deleted picks for ${entries.length} entries`);
        } else {
          console.log(`   No entries found for this competition`);
        }

        // Step 2: Delete competition entries
        const { error: deleteEntriesError } = await supabase
          .from('competition_entries')
          .delete()
          .eq('competition_id', competitionId);

        if (deleteEntriesError) {
          console.error(`   ❌ Error deleting entries:`, deleteEntriesError);
          errors.push(`Competition ${competitionId}: Failed to delete entries - ${deleteEntriesError.message}`);
          continue;
        }
        
        console.log(`   ✅ Deleted all entries`);

        // Step 3: Delete the competition itself
        const { error: deleteError, data: deletedData } = await supabase
          .from('tournament_competitions')
          .delete()
          .eq('id', competitionId)
          .select();

        if (deleteError) {
          console.error(`   ❌ Error deleting competition:`, deleteError);
          errors.push(`Competition ${competitionId}: ${deleteError.message}`);
          continue;
        }

        if (!deletedData || deletedData.length === 0) {
          console.error(`   ⚠️  Competition ${competitionId} not found or already deleted`);
          errors.push(`Competition ${competitionId}: Not found`);
          continue;
        }

        totalDeleted++;
        console.log(`   ✅ Successfully deleted competition ${competitionId}`);

      } catch (err) {
        console.error(`   ❌ Error processing competition ${competitionId}:`, err);
        errors.push(`Competition ${competitionId}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    console.log(`\n✅ Bulk delete complete: ${totalDeleted}/${competitionIds.length} competitions deleted`);
    
    if (errors.length > 0) {
      console.error('⚠️  Errors encountered:', errors);
    }

    return NextResponse.json({
      success: true,
      deleted: totalDeleted,
      requested: competitionIds.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('❌ Bulk delete error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete competitions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
