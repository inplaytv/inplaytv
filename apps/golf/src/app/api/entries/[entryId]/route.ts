import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';
import { canEditEntry } from '@/lib/unified-competition';

export const dynamic = 'force-dynamic';

// PUT /api/entries/[entryId] - Update existing entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const { entryId } = await params;
    const supabase = await createServerClient();
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate edit eligibility (checks tee-off time)
    const canEdit = await canEditEntry(entryId, supabase);
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Cannot edit - competition has already started' },
        { status: 403 }
      );
    }

    // Verify user owns this entry
    const { data: entry, error: entryError } = await supabase
      .from('competition_entries')
      .select('user_id, competition_id')
      .eq('id', entryId)
      .single();
    
    if (entryError || !entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }
    
    if (entry.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { entry_name, captain_golfer_id, picks } = body;

    // Validate picks
    if (!picks || picks.length !== 6) {
      return NextResponse.json(
        { error: 'Must select exactly 6 golfers' },
        { status: 400 }
      );
    }

    // Validate captain
    const captainPick = picks.find((p: any) => p.golfer_id === captain_golfer_id);
    if (!captainPick) {
      return NextResponse.json(
        { error: 'Captain must be one of your selected golfers' },
        { status: 400 }
      );
    }

    // Calculate total salary
    const total_salary = picks.reduce((sum: number, p: any) => sum + (p.salary_at_selection || p.salary || 0), 0);

    // Update entry and picks in transaction
    const { error: updateError } = await supabase.rpc('update_entry_with_picks', {
      p_entry_id: entryId,
      p_entry_name: entry_name,
      p_captain_golfer_id: captain_golfer_id,
      p_total_salary: total_salary,
      p_picks: picks.map((p: any) => ({
        golfer_id: p.golfer_id,
        slot_position: p.slot_position,
        salary_at_selection: p.salary_at_selection || p.salary
      }))
    });

    if (updateError) {
      // If RPC doesn't exist, fall back to manual transaction
      console.warn('RPC update_entry_with_picks not found, using manual update');
      
      // Update entry
      const { error: entryUpdateError } = await supabase
        .from('competition_entries')
        .update({
          entry_name,
          captain_golfer_id,
          total_salary,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId);
      
      if (entryUpdateError) throw entryUpdateError;

      // Delete old picks
      const { error: deleteError } = await supabase
        .from('entry_picks')
        .delete()
        .eq('entry_id', entryId);
      
      if (deleteError) throw deleteError;

      // Insert new picks
      const { error: picksError } = await supabase
        .from('entry_picks')
        .insert(
          picks.map((p: any) => ({
            entry_id: entryId,
            golfer_id: p.golfer_id,
            slot_position: p.slot_position,
            salary_at_selection: p.salary_at_selection || p.salary
          }))
        );
      
      if (picksError) throw picksError;
    }

    return NextResponse.json({
      success: true,
      entryId,
      message: 'Entry updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating entry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update entry' },
      { status: 500 }
    );
  }
}

// GET /api/entries/[entryId] - Get entry details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const { entryId } = await params;
    const supabase = await createServerClient();
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch entry with picks
    const { data: entry, error } = await supabase
      .from('competition_entries')
      .select(`
        *,
        picks:entry_picks(
          golfer_id,
          slot_position,
          salary_at_selection,
          golfers(id, full_name, first_name, last_name, world_ranking, image_url, salary_pennies)
        )
      `)
      .eq('id', entryId)
      .eq('user_id', user.id)
      .single();
    
    if (error || !entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json(entry);

  } catch (error: any) {
    console.error('Error fetching entry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch entry' },
      { status: 500 }
    );
  }
}
