import { createClient } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', data.user.id)
        .single();

      // If profile doesn't exist or onboarding not complete, send to onboarding
      if (!profile || !profile.onboarding_complete) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      // Otherwise send to account
      return NextResponse.redirect(`${origin}/account`);
    }
  }

  // If no code or error, redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
