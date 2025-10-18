import { createClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  // Debug: Log what we received
  console.log('Auth callback received:', {
    token_hash: token_hash ? 'present' : 'missing',
    type,
    code: code ? 'present' : 'missing',
    all_params: Object.fromEntries(requestUrl.searchParams.entries())
  });

  const supabase = await createClient();

  // Handle email verification with code parameter (Supabase's default flow)
  if (code) {
    // For email verification, we need to exchange the code
    // This is different from PKCE - Supabase handles it server-side
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Email verification error:', error);
      // Return more detailed error for debugging
      return NextResponse.redirect(
        `${origin}/login?error=verification_failed&message=${encodeURIComponent(error.message)}&details=${encodeURIComponent(JSON.stringify({ code: 'present', error: error.name }))}`
      );
    }

    // Success - redirect to verified page
    return NextResponse.redirect(`${origin}/verified`);
  }

  // Handle token_hash flow (alternative email verification method)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    if (error) {
      console.error('Token verification error:', error);
      return NextResponse.redirect(`${origin}/login?error=verification_failed&message=${encodeURIComponent(error.message)}`);
    }

    return NextResponse.redirect(`${origin}/verified`);
  }

  // If no valid parameters, redirect to login with debugging info
  const allParams = Object.fromEntries(requestUrl.searchParams.entries());
  return NextResponse.redirect(
    `${origin}/login?error=no_code&message=${encodeURIComponent('No verification code found')}&params=${encodeURIComponent(JSON.stringify(allParams))}`
  );
}
