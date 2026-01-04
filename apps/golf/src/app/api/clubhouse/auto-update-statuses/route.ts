import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * Clubhouse Auto-Status Updater API
 * Triggers status recalculation for all active Clubhouse events and competitions
 * Should be called by Vercel cron job every 5 minutes
 * 
 * Authorization: Bearer token in CRON_SECRET env var (for Vercel cron)
 * or manual call from admin (checks auth)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Allow cron job with secret OR authenticated admin user
    const isCronJob = authHeader === `Bearer ${cronSecret}` && cronSecret;
    
    if (!isCronJob) {
      // Check if user is authenticated admin
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Get session from cookie
      const sessionToken = request.cookies.get('supabase-auth-token')?.value;
      if (!sessionToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const { data: { user }, error } = await supabase.auth.getUser(sessionToken);
      if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // Check if user is admin
      const { data: admin } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', user.id)
        .single();
      
      if (!admin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }
    
    // Create admin client for RPC calls
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Call RPC functions to update statuses
    const { data: eventResult, error: eventError } = await supabase
      .rpc('auto_update_clubhouse_event_statuses');
    
    const { data: competitionResult, error: competitionError } = await supabase
      .rpc('auto_update_clubhouse_competition_statuses');
    
    if (eventError) {
      console.error('Event status update error:', eventError);
      return NextResponse.json(
        { error: 'Failed to update event statuses', details: eventError.message },
        { status: 500 }
      );
    }
    
    if (competitionError) {
      console.error('Competition status update error:', competitionError);
      return NextResponse.json(
        { error: 'Failed to update competition statuses', details: competitionError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      system: 'clubhouse',
      updated: {
        events: eventResult?.[0]?.updated_count || 0,
        competitions: competitionResult?.[0]?.updated_count || 0
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Auto-update error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint for manual testing (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated admin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get session from cookie
    const sessionToken = request.cookies.get('supabase-auth-token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(sessionToken);
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    const { data: admin } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single();
    
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Return status info
    const { data: events } = await supabase
      .from('clubhouse_events')
      .select('id, name, status, registration_opens_at, start_date, end_date')
      .neq('status', 'completed')
      .eq('is_visible', true)
      .order('start_date', { ascending: true });
    
    return NextResponse.json({
      message: 'Clubhouse auto-status updater endpoint',
      usage: 'POST to trigger status updates',
      active_events: events?.length || 0,
      events: events || []
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
