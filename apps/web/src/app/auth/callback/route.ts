import { createClient } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  const supabase = createClient();

  // Handle email verification (token_hash flow)
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    if (error) {
      console.error('Email verification error:', error);
      return NextResponse.redirect(`${origin}/login?error=verification_failed&message=${encodeURIComponent(error.message)}`);
    }

    if (data.user) {
      // Email verified and session created
      return NextResponse.redirect(`${origin}/verified`);
    }
  }

  // Handle OAuth callback (code flow - for future OAuth providers)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(`${origin}/login?error=auth_failed&message=${encodeURIComponent(error.message)}`);
    }

    if (data.user) {
      return NextResponse.redirect(`${origin}/verified`);
    }
  }

  // If no valid parameters, redirect to login
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
