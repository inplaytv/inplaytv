import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get single competition
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('tournament_competitions')
      .select(`
        *,
        competition_types (
          id,
          name,
          slug
        ),
        tournaments!tournament_competitions_tournament_id_fkey (
          id,
          name,
          slug
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('GET competition error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update competition
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();

    const body = await request.json();
    const {
      entry_fee_pennies,
      entrants_cap,
      admin_fee_percent,
      reg_open_at,
      reg_close_at,
      start_at,
      end_at,
      status,
      assigned_golfer_group_id,
    } = body;

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('tournament_competitions')
      .update({
        entry_fee_pennies: parseInt(entry_fee_pennies),
        entrants_cap: parseInt(entrants_cap),
        admin_fee_percent: parseFloat(admin_fee_percent) || 10.0,
        reg_open_at: reg_open_at || null,
        reg_close_at: reg_close_at || null,
        start_at: start_at || null,
        end_at: end_at || null,
        status: status || 'draft',
        assigned_golfer_group_id: assigned_golfer_group_id || null,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    // If a golfer group was assigned, sync the golfers to competition_golfers
    if (assigned_golfer_group_id) {
      console.log('🔄 Syncing golfers from group:', assigned_golfer_group_id);
      
      // Get golfers from the group
      const { data: members, error: membersError } = await adminClient
        .from('golfer_group_members')
        .select('golfer_id')
        .eq('group_id', assigned_golfer_group_id)
        .limit(1000); // Support up to 1000 golfers in a group

      console.log('📊 Found', members?.length || 0, 'golfers in group');

      if (!membersError && members && members.length > 0) {
        // First, remove existing golfers
        console.log('🗑️ Deleting existing golfers from competition');
        await adminClient
          .from('competition_golfers')
          .delete()
          .eq('competition_id', params.id);

        // Then add golfers from the group
        const inserts = members.map(m => ({
          competition_id: params.id,
          golfer_id: m.golfer_id,
        }));

        console.log('➕ Inserting', inserts.length, 'golfers into competition');
        const { error: insertError } = await adminClient
          .from('competition_golfers')
          .insert(inserts);

        if (insertError) {
          console.error('❌ Error inserting golfers:', insertError);
          throw insertError;
        }
        
        console.log('✅ Successfully synced', inserts.length, 'golfers');
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('PUT competition error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete competition
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('tournament_competitions')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE competition error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
