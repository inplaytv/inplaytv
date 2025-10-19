import { createAdminClient } from '@/lib/supabaseAdminServer';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = createAdminClient();
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json({ error: 'Sign out failed' }, { status: 500 });
  }
}
