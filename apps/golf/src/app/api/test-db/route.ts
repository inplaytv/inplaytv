import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 Testing database connection...');
    console.log('Supabase URL:', supabaseUrl ? 'Set' : 'NOT SET');
    console.log('Service Key:', supabaseServiceKey ? 'Set' : 'NOT SET');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test 1: Count tournaments
    const { data: tournaments, error: tourError, count: tourCount } = await supabase
      .from('tournaments')
      .select('*', { count: 'exact' });

    console.log('Tournaments query result:', { count: tournaments?.length, error: tourError });

    // Test 2: Count competition_entries
    const { data: entries, error: entryError, count: entryCount } = await supabase
      .from('competition_entries')
      .select('*', { count: 'exact' });

    console.log('Entries query result:', { count: entries?.length, error: entryError });

    // Test 3: Get specific tournament by name
    const { data: pgaTournament, error: pgaError } = await supabase
      .from('tournaments')
      .select('*')
      .ilike('name', '%PGA Championship%');

    console.log('PGA Championship search:', { count: pgaTournament?.length, error: pgaError });

    return NextResponse.json({
      success: true,
      envCheck: {
        supabaseUrl: !!supabaseUrl,
        serviceKey: !!supabaseServiceKey
      },
      tournaments: {
        count: tournaments?.length || 0,
        error: tourError?.message,
        sample: tournaments?.[0]
      },
      entries: {
        count: entries?.length || 0,
        error: entryError?.message
      },
      pgaChampionship: {
        found: pgaTournament?.length || 0,
        tournaments: pgaTournament
      }
    });
  } catch (error: any) {
    console.error('Database test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
