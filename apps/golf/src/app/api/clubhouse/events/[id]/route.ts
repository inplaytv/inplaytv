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
          starts_at
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
      // Frontend expects these field names for date parsing
      registration_opens: event.registration_opens_at,
      registration_closes: event.registration_closes_at,
      start_date: event.start_date,
      end_date: event.end_date,
      // Also include snake_case for consistency
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
      // CRITICAL: Include competitions array for frontend
      competitions: event.clubhouse_competitions || [],
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
      
      // Auto-calculate reg close as LAST round (Round 4) - 15min
      const round4 = new Date(body.round4_tee_time);
      round4.setMinutes(round4.getMinutes() - 15);
      updateData.registration_closes_at = round4.toISOString();
      
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
      // Registration closes before LAST round tee-off, which is AFTER event starts
      // So we only validate it's before end_date
      if (regCloses > endDate) {
        throw new Error('Registration close must be before event ends');
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
      // Registration closes before LAST round tee-off, which is AFTER event starts
      if (regCloses > endDate) {
        throw new Error('Registration close must be before event ends');
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
      .select('id, name')
      .eq('event_id', id); // Get ALL competitions with names

    console.log('📋 Found competitions for event:', competitions);

    if (competitions && competitions.length > 0) {
      console.log('🔧 Updating ALL', competitions.length, 'competitions with per-round timing');
      
      // All competitions open at the same time (5 days before Round 1)
      const opensAt = toISO(body.registration_opens);
      
      // Calculate round tee times (15 min before each round)
      const round1 = body.round1_tee_time ? new Date(body.round1_tee_time) : null;
      const round2 = body.round2_tee_time ? new Date(body.round2_tee_time) : null;
      const round3 = body.round3_tee_time ? new Date(body.round3_tee_time) : null;
      const round4 = body.round4_tee_time ? new Date(body.round4_tee_time) : null;
      
      // Update each competition individually with its own closing time
      for (const comp of competitions) {
        let closesAt: string | null = null;
        let startsAt: string | null = null;
        let endsAt: string | null = null;
        
        // Determine closing time based on competition name
        if (comp.name === 'All 4 Rounds') {
          // Closes 15 min before Round 1
          if (round1) {
            const closeTime = new Date(round1);
            closeTime.setMinutes(closeTime.getMinutes() - 15);
            closesAt = closeTime.toISOString();
          }
          startsAt = round1?.toISOString() || updateData.start_date;
          endsAt = round4?.toISOString() || updateData.end_date;
        } else if (comp.name === 'Round 1') {
          if (round1) {
            const closeTime = new Date(round1);
            closeTime.setMinutes(closeTime.getMinutes() - 15);
            closesAt = closeTime.toISOString();
          }
          startsAt = round1?.toISOString() || updateData.start_date;
          endsAt = round1?.toISOString() || updateData.start_date;
        } else if (comp.name === 'Round 2') {
          if (round2) {
            const closeTime = new Date(round2);
            closeTime.setMinutes(closeTime.getMinutes() - 15);
            closesAt = closeTime.toISOString();
          }
          startsAt = round2?.toISOString() || updateData.start_date;
          endsAt = round2?.toISOString() || updateData.start_date;
        } else if (comp.name === 'Round 3') {
          if (round3) {
            const closeTime = new Date(round3);
            closeTime.setMinutes(closeTime.getMinutes() - 15);
            closesAt = closeTime.toISOString();
          }
          startsAt = round3?.toISOString() || updateData.start_date;
          endsAt = round3?.toISOString() || updateData.start_date;
        } else if (comp.name === 'Round 4') {
          if (round4) {
            const closeTime = new Date(round4);
            closeTime.setMinutes(closeTime.getMinutes() - 15);
            closesAt = closeTime.toISOString();
          }
          startsAt = round4?.toISOString() || updateData.start_date;
          endsAt = round4?.toISOString() || updateData.start_date;
        }
        
        console.log(`📅 ${comp.name} timing:`, { opensAt, closesAt, startsAt, endsAt });
        
        const { error: compUpdateError } = await supabase
          .from('clubhouse_competitions')
          .update({
            entry_credits: body.entry_credits,
            max_entries: body.max_entries,
            opens_at: opensAt,
            closes_at: closesAt,
            starts_at: startsAt,
            ends_at: endsAt,
            assigned_golfer_group_id: body.assigned_golfer_group_id || null,
          })
          .eq('id', comp.id);

        if (compUpdateError) {
          console.error(`❌ Error updating competition ${comp.name}:`, compUpdateError);
          throw compUpdateError;
        }
      }
      
      console.log('✅ All', competitions.length, 'competitions updated');
      
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
