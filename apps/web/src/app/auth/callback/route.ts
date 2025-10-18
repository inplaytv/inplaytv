import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;

  // Email verification is handled by Supabase before redirecting here.
  // By the time we reach this callback, the email is already verified.
  // Just redirect to success page and let user login normally.
  
  return NextResponse.redirect(`${origin}/verified`);
}
