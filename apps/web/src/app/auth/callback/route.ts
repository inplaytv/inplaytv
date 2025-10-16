import { createClient } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    if (data.user) {
      // Always redirect to onboarding
      // The onboarding page will check if already completed and redirect to account
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  // If no code or error, redirect to login
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
