import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Service role client for admin operations (legacy, prefer createAdminClient)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// CORS headers for admin app access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    const { data: event, error } = await supabase
      .from('clubhouse_events')
      .select(`
        *,
        clubhouse_competitions(
          id,
          name,
          entry_credits,
          max_entries,
          opens_at,
          closes_at,
          starts_at,
          rounds_covered
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Count entries
    const competition = event.clubhouse_competitions?.[0];
    let currentEntries = 0;
    if (competition) {
      const { count } = await supabase
        .from('clubhouse_entries')
        .select('*', { count: 'exact', head: true })
        .eq('competition_id', competition.id);
      currentEntries = count || 0;
    }

    // Map to consistent format with both old and new fields
    return NextResponse.json({
      id: event.id,
      name: event.name,
      slug: event.slug,
      description: event.description,
      location: event.location,
      status: event.status,
      entry_credits: competition?.entry_credits || 0,
      max_entries: competition?.max_entries || 0,
      current_entries: currentEntries,
      reg_open_at: event.registration_opens_at,
      reg_close_at: event.registration_closes_at,
      start_at: event.start_date,
      end_at: event.end_date,
      // New multi-round fields (if they exist)
      round1_tee_time: event.round1_tee_time || null,
      round2_tee_time: event.round2_tee_time || null,
      round3_tee_time: event.round3_tee_time || null,
      round4_tee_time: event.round4_tee_time || null,
      // Option A: Tournament linking for DataGolf integration
      linked_tournament_id: event.linked_tournament_id || null,
    }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient(); // Use admin client to bypass RLS
    const body = await req.json();

    console.log('📥 PUT Request Body:', JSON.stringify(body, null, 2));
    console.log('🎯 Round Tee Times Received:', {
      round1: body.round1_tee_time,
      round2: body.round2_tee_time,
      round3: body.round3_tee_time,
      round4: body.round4_tee_time,
    });

    // Helper to convert datetime-local to ISO 8601
    const toISO = (dateStr: string) => {
      if (!dateStr) return null;
      if (dateStr.includes('Z') || dateStr.includes('+')) return dateStr;
      return new Date(dateStr).toISOString();
    };

    // Build update object conditionally based on what fields are provided
    const updateData: any = {
      name: body.name,
      description: body.description,
      location: body.location,
      linked_tournament_id: body.linked_tournament_id || null, // Option A: Tournament linking
    };

    // Allow manual status override
    if (body.status) {
      updateData.status = body.status;
    }

    // Handle both old single-date and new multi-round formats
    if (body.round1_tee_time) {
      // New format: use round tee times
      updateData.start_date = toISO(body.round1_tee_time);
      updateData.end_date = toISO(body.end_date);
      updateData.round1_tee_time = toISO(body.round1_tee_time);
      updateData.round2_tee_time = toISO(body.round2_tee_time);
      updateData.round3_tee_time = toISO(body.round3_tee_time);
      updateData.round4_tee_time = toISO(body.round4_tee_time);
      updateData.registration_opens_at = toISO(body.registration_opens);
      
      // Auto-calculate reg close as Round 1 - 15min
      const round1 = new Date(body.round1_tee_time);
      round1.setMinutes(round1.getMinutes() - 15);
      updateData.registration_closes_at = round1.toISOString();
      
      // Validate all date relationships for valid_date_range constraint
      const regOpens = new Date(updateData.registration_opens_at);
      const regCloses = new Date(updateData.registration_closes_at);
      const startDate = new Date(updateData.start_date);
      const endDate = new Date(updateData.end_date);
      
      console.log('📅 Date Validation:');
      console.log('  registration_opens_at:', updateData.registration_opens_at);
      console.log('  registration_closes_at:', updateData.registration_closes_at);
      console.log('  start_date:', updateData.start_date);
      console.log('  end_date:', updateData.end_date);
      
      if (regCloses <= regOpens) {
        throw new Error('Registration close must be after registration open');
      }
      if (startDate < regCloses) {
        throw new Error('Event start must be at or after registration close');
      }
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
      
      console.log('✅ All date validations passed');
      
    } else if (body.start_date) {
      // Old format: use single start date
      updateData.start_date = toISO(body.start_date);
      updateData.end_date = toISO(body.end_date);
      updateData.registration_opens_at = toISO(body.registration_opens);
      updateData.registration_closes_at = toISO(body.registration_closes);
      
      // Validate all date relationships
      const regOpens = new Date(updateData.registration_opens_at);
      const regCloses = new Date(updateData.registration_closes_at);
      const startDate = new Date(updateData.start_date);
      const endDate = new Date(updateData.end_date);
      
      if (regCloses <= regOpens) {
        throw new Error('Registration close must be after registration open');
      }
      if (startDate < regCloses) {
        throw new Error('Event start must be at or after registration close');
      }
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
    }

    // Update event
    const { error: eventError } = await supabase
      .from('clubhouse_events')
      .update(updateData)
      .eq('id', id);

    if (eventError) throw eventError;

    // Update ALL associated competitions (there are 5 per event)
    const { data: competitions } = await supabase
      .from('clubhouse_competitions')
      .select('id')
      .eq('event_id', id); // Remove .limit(1) to get ALL competitions

    console.log('📋 Found competitions for event:', competitions);

    if (competitions && competitions.length > 0) {
      console.log('🔧 Updating ALL', competitions.length, 'competitions with golfer_group_id:', body.assigned_golfer_group_id);
      
      // For bulk update of common fields (entry_credits, max_entries, opens_at, golfer_group)
      // But we need to update starts_at individually based on each competition's rounds_covered
      
      // First, get all competitions with their rounds_covered
      const { data: fullComps } = await supabase
        .from('clubhouse_competitions')
        .select('id, rounds_covered')
        .eq('event_id', id);

      if (fullComps && fullComps.length > 0) {
        console.log('📋 Updating each competition individually with correct timing...');
        
        // Store the round tee times from the updated body (AFTER event update)
        const roundTeeTimes = {
          1: body.round1_tee_time ? toISO(body.round1_tee_time) : null,
          2: body.round2_tee_time ? toISO(body.round2_tee_time) : null,
          3: body.round3_tee_time ? toISO(body.round3_tee_time) : null,
          4: body.round4_tee_time ? toISO(body.round4_tee_time) : null,
        };

        // Update each competition with its specific timing based on rounds_covered
        for (const comp of fullComps) {
          const firstRound = comp.rounds_covered[0]; // Get first round in array
          let startsAt;
          let closesAt;
          let opensAt;

          // Get the tee time for THIS competition's first round
          const roundTeeTime = roundTeeTimes[firstRound];
          
          if (roundTeeTime) {
            // Use the specific round's tee time
            startsAt = roundTeeTime;
            // Calculate closes_at as 15 minutes before starts_at
            const startDate = new Date(startsAt);
            startDate.setMinutes(startDate.getMinutes() - 15);
            closesAt = startDate.toISOString();
          } else if (body.start_date) {
            // Fallback to event start_date
            startsAt = toISO(body.start_date);
            closesAt = toISO(body.registration_closes);
          } else {
            // Last resort: use registration_closes + 1 hour
            const regCloses = new Date(toISO(body.registration_closes));
            regCloses.setHours(regCloses.getHours() + 1);
            startsAt = regCloses.toISOString();
            closesAt = toISO(body.registration_closes);
          }

          // opens_at is always the event's registration_opens
          opensAt = toISO(body.registration_opens);

          console.log(`🔧 ${comp.rounds_covered.length > 1 ? 'All Rounds' : `Round ${firstRound}`}: opens=${opensAt}, closes=${closesAt}, starts=${startsAt}`);

          const { error: compError } = await supabase
            .from('clubhouse_competitions')
            .update({
              entry_credits: body.entry_credits,
              max_entries: body.max_entries,
              opens_at: opensAt,
              closes_at: closesAt,
              starts_at: startsAt,
              assigned_golfer_group_id: body.assigned_golfer_group_id || null,
            })
            .eq('id', comp.id);

          if (compError) {
            console.error(`❌ Error updating competition ${comp.id}:`, compError);
            throw compError;
          }
        }
        
        console.log('✅ All competitions updated with different close times based on rounds');
      }
      
      // Verify the update by reading back
      const { data: verifyComps } = await supabase
        .from('clubhouse_competitions')
        .select('id, assigned_golfer_group_id')
        .eq('event_id', id);
      console.log('🔍 Verification - competitions after update:', verifyComps);
    } else {
      console.warn('⚠️ No competitions found for event:', id);
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log('[Clubhouse Events API] Deleting event:', id);

    // Use admin client for cascade delete
    const { data: competitions, error: compError } = await supabaseAdmin
      .from('clubhouse_competitions')
      .select('id')
      .eq('event_id', id);

    if (compError) {
      console.error('[Clubhouse Events API] Error fetching competitions:', compError);
      throw compError;
    }

    console.log('[Clubhouse Events API] Found competitions:', competitions?.length || 0);

    if (competitions && competitions.length > 0) {
      const competitionIds = competitions.map(c => c.id);

      // Get all entry IDs
      const { data: entries } = await supabaseAdmin
        .from('clubhouse_entries')
        .select('id')
        .in('competition_id', competitionIds);

      if (entries && entries.length > 0) {
        const entryIds = entries.map(e => e.id);

        // Delete entry picks first
        await supabaseAdmin
          .from('clubhouse_entry_picks')
          .delete()
          .in('entry_id', entryIds);
      }

      // Delete entries
      await supabaseAdmin
        .from('clubhouse_entries')
        .delete()
        .in('competition_id', competitionIds);
    }

    // Delete competitions
    await supabaseAdmin
      .from('clubhouse_competitions')
      .delete()
      .eq('event_id', id);

    // Delete the event
    const { error: deleteEventError } = await supabaseAdmin
      .from('clubhouse_events')
      .delete()
      .eq('id', id);

    if (deleteEventError) {
      console.error('[Clubhouse Events API] Error deleting event:', deleteEventError);
      throw deleteEventError;
    }

    console.log('[Clubhouse Events API] Event deleted successfully:', id);

    return NextResponse.json({ 
      success: true,
      message: 'Event deleted successfully' 
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('[Clubhouse Events API] Delete error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to delete event' 
    }, { status: 500, headers: corsHeaders });
  }
}
