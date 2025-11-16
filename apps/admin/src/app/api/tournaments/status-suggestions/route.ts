import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get tournament status mismatch suggestions
export async function GET(request: NextRequest) {
  try {
    await assertAdminOrRedirect();
    
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .rpc('detect_tournament_status_mismatches');

    if (error) {
      console.error('Error detecting mismatches:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ suggestions: data || [] });
  } catch (error: any) {
    console.error('GET status suggestions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Apply a suggested status change
export async function POST(request: NextRequest) {
  try {
    await assertAdminOrRedirect();
    
    const body = await request.json();
    const { tournament_id, suggested_status } = body;

    if (!tournament_id || !suggested_status) {
      return NextResponse.json(
        { error: 'tournament_id and suggested_status are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('tournaments')
      .update({ 
        status: suggested_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', tournament_id)
      .select()
      .single();

    if (error) {
      console.error('Error applying suggestion:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      tournament: data,
      message: `Status updated to "${suggested_status}"` 
    });
  } catch (error: any) {
    console.error('POST apply suggestion error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
