import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

/**
 * POST /api/one-2-one/join
 * Find or create an available ONE 2 ONE instance and return the instance ID
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();
    const { templateId, tournamentId, entryFeePennies } = body;

    console.log('🔍 ONE 2 ONE Join Request FULL BODY:', body);
    console.log('🔍 entryFeePennies VALUE:', entryFeePennies, 'TYPE:', typeof entryFeePennies);

    if (!templateId || !tournamentId) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Template ID and Tournament ID are required' },
        { status: 400 }
      );
    }

    // Check if templateId is actually an instance ID (UUID format with specific instance)
    // First, try to find this as an existing instance
    const { data: existingInstance, error: instanceCheckError } = await supabase
      .from('competition_instances')
      .select('id, template_id, current_players, max_players, status')
      .eq('id', templateId)
      .eq('tournament_id', tournamentId)
      .single();

    if (!instanceCheckError && existingInstance) {
      // This is an existing instance - user is accepting a challenge
      console.log('✅ Found specific instance to join:', existingInstance.id);
      if (existingInstance.status === 'open' && existingInstance.current_players < existingInstance.max_players) {
        return NextResponse.json({
          instanceId: existingInstance.id,
          isNew: false,
          message: 'Joining existing challenge'
        });
      } else {
        return NextResponse.json(
          { error: 'This challenge is no longer available' },
          { status: 400 }
        );
      }
    }

    // Not a specific instance, treat as template ID and CREATE A NEW CHALLENGE
    // (no longer auto-matching - users browse Challenge Board to accept)
    console.log('🆕 Creating new challenge for template:', templateId);
    
    // Get the next instance number
    const { data: existingInstances } = await supabase
      .from('competition_instances')
      .select('instance_number')
      .eq('template_id', templateId)
      .eq('tournament_id', tournamentId)
      .order('instance_number', { ascending: false })
      .limit(1);
    
    const nextInstanceNumber = existingInstances && existingInstances.length > 0 
      ? existingInstances[0].instance_number + 1 
      : 1;

    console.log('📊 Next instance number:', nextInstanceNumber);

    // Get template details for registration close time
    console.log('🔍 Fetching template details...');
    const { data: template, error: templateError } = await supabase
      .from('competition_templates')
      .select('reg_close_round')
      .eq('id', templateId)
      .single();
    
    if (templateError) {
      console.error('❌ Error fetching template:', templateError);
      return NextResponse.json(
        { error: 'Failed to fetch template details', details: templateError.message },
        { status: 500 }
      );
    }

    console.log('✅ Template reg_close_round:', template.reg_close_round);

    // Get tournament round times to calculate reg_close_at
    console.log('🔍 Fetching tournament details...');
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('round_1_start, round_2_start, round_3_start, round_4_start, end_date')
      .eq('id', tournamentId)
      .single();
    
    if (tournamentError) {
      console.error('❌ Error fetching tournament:', tournamentError);
      return NextResponse.json(
        { error: 'Failed to fetch tournament details', details: tournamentError.message },
        { status: 500 }
      );
    }

    console.log('✅ Tournament rounds loaded');

    // Determine reg_close_at based on template's reg_close_round
    let regCloseAt: string | null = null;
    let startAt: string | null = null;
    let endAt: string | null = tournament.end_date;
    
    if (template.reg_close_round === 1) {
      regCloseAt = tournament.round_1_start;
      startAt = tournament.round_1_start;
    } else if (template.reg_close_round === 2) {
      regCloseAt = tournament.round_2_start;
      startAt = tournament.round_1_start;
    } else if (template.reg_close_round === 3) {
      regCloseAt = tournament.round_3_start;
      startAt = tournament.round_1_start;
    } else if (template.reg_close_round === 4) {
      regCloseAt = tournament.round_4_start;
      startAt = tournament.round_1_start;
    }

    console.log('📅 Instance times - reg_close:', regCloseAt, 'start:', startAt, 'end:', endAt);

    console.log('💾 Creating new instance...');
    console.log('💾 ABOUT TO INSERT entry_fee_pennies:', entryFeePennies);
    const { data: newInstance, error: createError } = await supabase
      .from('competition_instances')
      .insert({
        template_id: templateId,
        tournament_id: tournamentId,
        instance_number: nextInstanceNumber,
        entry_fee_pennies: entryFeePennies,
        status: 'open',
        current_players: 0,
        max_players: 2,
        reg_close_at: regCloseAt,
        start_at: startAt,
        end_at: endAt,
      })
      .select('id, entry_fee_pennies')
      .single();

    if (createError) {
      console.error('❌ Error creating instance:', createError);
      return NextResponse.json(
        { error: 'Failed to create new instance', details: createError.message },
        { status: 500 }
      );
    }

    console.log('✅ Instance created successfully:', newInstance);
    console.log('✅ Saved entry_fee_pennies:', newInstance.entry_fee_pennies);

    console.log('✅ Created new instance:', newInstance.id);

    return NextResponse.json({
      instanceId: newInstance.id,
      isNew: true,
      currentPlayers: 0
    });
  } catch (error: any) {
    console.error('ONE 2 ONE join error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
