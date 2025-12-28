import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Cache for maintenance mode (reduces database queries)
let maintenanceModeCache: { mode: string; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

// Check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        }
      }
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
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        }
      }
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
  const hostname = request.nextUrl.hostname;
  
  console.log('[Golf Middleware START] Path:', pathname, 'Host:', hostname);
  
  // REMOVED: Don't redirect one-2-one tournament pages - they're needed for challenge creation
  // The /one-2-one/[slug] pages are still used for creating new challenges
  
  // ALWAYS allow localhost/127.0.0.1 - no maintenance checks in development
  // This ensures local development is never blocked regardless of database state
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('[Golf Middleware] Localhost bypass');
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
    console.log('[Golf Middleware] Allowing static/API:', pathname);
    return NextResponse.next();
  }

  // Always allow login, signup, and maintenance pages
  if (
    pathname === '/login' || 
    pathname === '/signup' || 
    pathname === '/maintenance' || 
    pathname === '/coming-soon' ||
    pathname.startsWith('/login') ||  // Catch any login routes
    pathname.startsWith('/signup')    // Catch any signup routes
  ) {
    console.log('[Golf Middleware] Allowing auth page:', pathname);
    return NextResponse.next();
  }

  // Get maintenance mode (only for production domains)
  const mode = await getMaintenanceMode();
  console.log('[Golf Middleware] Mode:', mode, 'for path:', pathname);
  
  // If site is live, allow everything
  if (mode === 'live') {
    return NextResponse.next();
  }

  // Check if user is logged in using proper Supabase SSR
  let response = NextResponse.next();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  
  console.log('[Golf Middleware] User from auth:', user?.id, 'Error:', error?.message);

  // Check if user is admin
  let userIsAdmin = false;
  if (user) {
    userIsAdmin = await isAdmin(user.id);
    console.log('[Golf Middleware] User is admin:', userIsAdmin);
  } else {
    console.log('[Golf Middleware] No user ID, skipping admin check');
  }

  // Admins can always access
  if (userIsAdmin) {
    console.log('[Golf Middleware] Admin access granted');
    return NextResponse.next();
  }

  // For non-admins in coming-soon or maintenance mode, redirect to main web app
  // The web app will show the appropriate page
  console.log('[Golf Middleware] Redirecting to web app, mode:', mode);
  if (mode === 'coming-soon' || mode === 'maintenance') {
    const hostname = request.nextUrl.hostname;
    let webUrl;
    
    // Handle localhost differently
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      webUrl = 'http://localhost:3000';
    } else {
      webUrl = process.env.NEXT_PUBLIC_WEB_URL || `https://www.${hostname.replace('golf.', '')}`;
    }
    
    console.log('[Golf Middleware] Redirecting to:', `${webUrl}/${mode}`);
    return NextResponse.redirect(new URL(`/${mode}`, webUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
