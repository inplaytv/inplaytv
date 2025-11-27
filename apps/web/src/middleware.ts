import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow homepage and static assets
  if (
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/fonts') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }
  
  // Redirect all other routes to homepage with coming soon message
  const url = request.nextUrl.clone();
  url.pathname = '/';
  url.searchParams.set('message', 'coming-soon');
  return NextResponse.redirect(url);
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
