import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cache for maintenance mode (reduces database queries)
let maintenanceModeCache: { mode: string; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

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

// Get current maintenance mode from database (with caching)
async function getMaintenanceMode(): Promise<string> {
  // Check cache first
  const now = Date.now();
  if (maintenanceModeCache && (now - maintenanceModeCache.timestamp) < CACHE_TTL) {
    return maintenanceModeCache.mode;
  }

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

    const mode = (error || !data) ? 'live' : (data.setting_value || 'live');
    
    // Update cache
    maintenanceModeCache = { mode, timestamp: now };
    
    return mode;
  } catch {
    return 'live';
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // REMOVED: Don't redirect one-2-one tournament pages - they're needed for challenge creation
  // The /one-2-one/[slug] pages are still used for creating new challenges
  
  // ALWAYS allow localhost/127.0.0.1 - no maintenance checks in development
  // This ensures local development is never blocked regardless of database state
  const hostname = request.nextUrl.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return NextResponse.next();
  }
  
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

  // Always allow login, signup, and maintenance pages
  if (pathname === '/login' || pathname === '/signup' || pathname === '/maintenance' || pathname === '/coming-soon') {
    return NextResponse.next();
  }

  // Get maintenance mode (only for production domains)
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
      const parts = token.split('.');
      if (parts.length === 3 && parts[1]) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        userId = payload.sub;
      }
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
