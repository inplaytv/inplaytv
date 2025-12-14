import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('setting_key', 'tournament_page_background');

  return NextResponse.json({ 
    app: 'WEB', 
    data, 
    error, 
    timestamp: new Date().toISOString(),
    env_check: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      key_exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
}