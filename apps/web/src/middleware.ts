import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cache for maintenance mode (reduces database queries)
let maintenanceModeCache: { mode: string; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds cache

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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      console.error('[Middleware] Missing Supabase environment variables');
      console.error('[Middleware] URL exists:', !!supabaseUrl);
      console.error('[Middleware] Key exists:', !!serviceKey);
      return 'live'; // Fallback to live if env vars missing
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'maintenance_mode')
      .single();

    if (error) {
      console.error('[Middleware] Database error:', error);
    } else {
      console.log('[Middleware] Successfully fetched mode:', data?.setting_value);
    }

    const mode = (error || !data) ? 'live' : (data.setting_value || 'live');
    
    // Update cache
    maintenanceModeCache = { mode, timestamp: now };
    
    return mode;
  } catch (err) {
    console.error('[Middleware] Error getting maintenance mode:', err);
    return 'live'; // Default to live on error
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // Check for preview mode in development
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                        request.nextUrl.hostname === 'localhost' ||
                        request.nextUrl.hostname === '127.0.0.1';
  
  const previewMode = searchParams.get('preview'); // ?preview=coming-soon or ?preview=maintenance
  
  // In development, only apply middleware if preview mode is enabled
  if (isDevelopment && !previewMode) {
    console.log('[Middleware] Development mode detected, skipping maintenance check (use ?preview=coming-soon to test)');
    return NextResponse.next();
  }
  
  // If preview mode is active, use that instead of database
  if (isDevelopment && previewMode) {
    console.log('[Middleware] Preview mode active:', previewMode);
    if (previewMode === 'coming-soon' && pathname !== '/coming-soon') {
      return NextResponse.rewrite(new URL('/coming-soon', request.url));
    }
    if (previewMode === 'maintenance' && pathname !== '/maintenance') {
      return NextResponse.rewrite(new URL('/maintenance', request.url));
    }
    return NextResponse.next();
  }
  
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

  // Admins can always access everything
  if (userIsAdmin) {
    return NextResponse.next();
  }

  // If coming-soon mode, show coming-soon page for all routes (URL stays the same)
  if (mode === 'coming-soon') {
    console.log('[Middleware] Rewriting to /coming-soon for path:', pathname);
    return NextResponse.rewrite(new URL('/coming-soon', request.url));
  }

  // If maintenance mode, show maintenance page for all routes (URL stays the same)
  if (mode === 'maintenance') {
    console.log('[Middleware] Rewriting to /maintenance for path:', pathname);
    return NextResponse.rewrite(new URL('/maintenance', request.url));
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

