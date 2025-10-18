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
      console.error('Auth callback error:', error);
      return NextResponse.redirect(`${origin}/login?error=verification_failed&message=${encodeURIComponent(error.message)}`);
    }

    if (data.user) {
      // User verified email, profile already created during signup
      // Redirect to verification success page
      return NextResponse.redirect(`${origin}/verified`);
    }
  }

  // If no code or error, redirect to login
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
