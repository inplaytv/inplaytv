import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // Optional: Add a secret key check for security
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_KEY || 'default-cron-secret';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call the database function to update statuses
    // Use the correct function name from 2025-01-auto-status-updater.sql
    const { data, error } = await supabase.rpc('auto_update_tournament_statuses');

    if (error) {
      console.error('Error updating tournament statuses:', error);
      return NextResponse.json(
        { error: 'Failed to update tournament statuses', details: error.message },
        { status: 500 }
      );
    }

    // Fetch updated tournaments to return
    const { data: tournaments, error: fetchError } = await supabase
      .from('tournaments')
      .select('id, name, status, start_date, end_date')
      .order('start_date', { ascending: false });

    if (fetchError) {
      console.error('Error fetching tournaments:', fetchError);
    }

    return NextResponse.json({
      success: true,
      message: 'Tournament statuses updated successfully',
      timestamp: new Date().toISOString(),
      tournaments: tournaments || [],
    });
  } catch (error: any) {
    console.error('Error in tournament status update:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Allow GET requests to check status (without updating)
export async function GET(request: Request) {
  try {
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select('id, name, status, start_date, end_date, registration_opens_at, registration_closes_at, updated_at')
      .order('start_date', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch tournaments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tournaments: tournaments || [],
      lastChecked: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
