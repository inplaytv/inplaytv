import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    return !!data && !error;
  } catch {
    return false;
  }
}

// Get current maintenance mode from database
async function getMaintenanceMode(): Promise<string> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'maintenance_mode')
      .single();

    if (error || !data) {
      return 'live';
    }

    return data.setting_value || 'live';
  } catch {
    return 'live';
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Always allow static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/fonts') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  // Get maintenance mode
  const mode = await getMaintenanceMode();
  
  // If site is live, allow everything
  if (mode === 'live') {
    return NextResponse.next();
  }

  // Check if user is logged in and is admin
  const token = request.cookies.get('sb-access-token')?.value;
  let userId: string | null = null;

  if (token) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userId = payload.sub;
    } catch {
      userId = null;
    }
  }

  // Check if user is admin
  let userIsAdmin = false;
  if (userId) {
    userIsAdmin = await isAdmin(userId);
  }

  // Admins can always access
  if (userIsAdmin) {
    return NextResponse.next();
  }

  // For non-admins in coming-soon or maintenance mode, redirect to main web app
  // The web app will show the appropriate page
  if (mode === 'coming-soon' || mode === 'maintenance') {
    return NextResponse.redirect(new URL(`/${mode}`, 'http://localhost:3000'));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
