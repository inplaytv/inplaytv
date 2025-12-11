import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cache for maintenance mode (reduces database queries)
let maintenanceModeCache: { mode: string; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

// Check if user is admin (simplified check for middleware)
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
    return 'live'; // Default to live on error
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Always allow static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/fonts') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Always allow maintenance and coming-soon pages
  if (pathname === '/maintenance' || pathname === '/coming-soon') {
    return NextResponse.next();
  }

  // Get maintenance mode
  const mode = await getMaintenanceMode();
  
  // If site is live, allow everything
  if (mode === 'live') {
    return NextResponse.next();
  }

  // Check if user is logged in
  const token = request.cookies.get('sb-access-token')?.value;
  let userId: string | null = null;

  if (token) {
    try {
      // Decode JWT to get user ID (basic decode, not verification)
      const parts = token.split('.');
      if (parts.length === 3) {
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

  // Admins can always access everything
  if (userIsAdmin) {
    return NextResponse.next();
  }

  // If coming-soon mode, redirect all non-admin access to coming-soon page
  if (mode === 'coming-soon') {
    return NextResponse.redirect(new URL('/coming-soon', request.url));
  }

  // If maintenance mode, redirect all non-admin access to maintenance page
  if (mode === 'maintenance') {
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

