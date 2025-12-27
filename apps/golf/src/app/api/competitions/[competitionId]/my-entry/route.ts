import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Fetch user's entry for a competition
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    const { competitionId } = await params;
    const supabase = await createServerClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's entry for this competition
    const { data: entry, error: entryError } = await supabase
      .from('competition_entries')
      .select('*')
      .eq('competition_id', competitionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (entryError) {
      if (entryError.code === 'PGRST116') {
        // No entry found - this is OK
        return NextResponse.json(null);
      }
      console.error('GET my entry error:', entryError);
      throw entryError;
    }

    if (!entry) {
      return NextResponse.json(null);
    }

    // Get the picks for this entry
    const { data: picks, error: picksError } = await supabase
      .from('entry_picks')
      .select('*')
      .eq('entry_id', entry.id)
      .order('slot_position', { ascending: true });

    if (picksError) throw picksError;

    return NextResponse.json({
      ...entry,
      picks: picks || [],
    });
  } catch (error: any) {
    console.error('GET my entry error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch entry' },
      { status: 500 }
    );
  }
}

// PUT - Update user's draft entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    const { competitionId } = await params;
    const supabase = await createServerClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { entry_name, total_salary, captain_golfer_id, status, picks } = body;

    // Validate status can only be draft or submitted
    if (status && !['draft', 'submitted'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be draft or submitted.' },
        { status: 400 }
      );
    }

    // Get existing entry (check both competition_id and instance_id)
    const { data: existingEntry, error: fetchError } = await supabase
      .from('competition_entries')
      .select('id, status')
      .or(`competition_id.eq.${competitionId},instance_id.eq.${competitionId}`)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError || !existingEntry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Can only update draft entries
    if (existingEntry.status !== 'draft') {
      return NextResponse.json(
        { error: 'Cannot update submitted or paid entries' },
        { status: 400 }
      );
    }

    // Update entry
    const { error: updateError } = await supabase
      .from('competition_entries')
      .update({
        entry_name,
        total_salary,
        captain_golfer_id,
        status: status || 'draft',
        updated_at: new Date().toISOString(),
        ...(status === 'submitted' && { submitted_at: new Date().toISOString() }),
      })
      .eq('id', existingEntry.id)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // Delete old picks
    const { error: deleteError } = await supabase
      .from('entry_picks')
      .delete()
      .eq('entry_id', existingEntry.id);

    if (deleteError) throw deleteError;

    // Insert new picks
    if (picks && picks.length > 0) {
      const picksToInsert = picks.map((pick: any) => ({
        entry_id: existingEntry.id,
        golfer_id: pick.golfer_id,
        slot_position: pick.slot_position,
        salary_at_selection: pick.salary_at_selection,
      }));

      const { error: picksError } = await supabase
        .from('entry_picks')
        .insert(picksToInsert);

      if (picksError) throw picksError;
    }

    return NextResponse.json({
      success: true,
      entry_id: existingEntry.id,
      message: status === 'submitted' ? 'Entry submitted successfully' : 'Draft saved',
    });
  } catch (error: any) {
    console.error('PUT my entry error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update entry' },
      { status: 500 }
    );
  }
}
