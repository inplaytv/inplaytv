import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * DEVELOPMENT ONLY - Bypass authentication
 * 
 * This endpoint allows you to bypass Supabase auth rate limits during local development.
 * It creates a mock session that the middleware will accept.
 * 
 * Usage: GET http://localhost:3002/api/auth/dev-bypass?email=your@email.com
 * 
 * IMPORTANT: This is ONLY available in development mode and will not work in production.
 */
export async function GET(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required. Usage: /api/auth/dev-bypass?email=your@email.com' },
        { status: 400 }
      );
    }

    // Create a mock session token for development
    const mockSession = {
      user: {
        id: 'dev-user-id',
        email: email,
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {}
      },
      expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      dev_bypass: true
    };

    // Set a dev cookie
    const cookieStore = cookies();
    cookieStore.set('dev_admin_bypass', JSON.stringify(mockSession), {
      httpOnly: true,
      secure: false, // false for localhost
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    // Return HTML with auto-redirect
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Dev Bypass Active</title>
          <style>
            body {
              font-family: system-ui;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              background: rgba(255,255,255,0.1);
              padding: 3rem;
              border-radius: 12px;
              backdrop-filter: blur(10px);
            }
            .success {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
            h1 { margin: 0 0 1rem 0; }
            p { margin: 0.5rem 0; opacity: 0.9; }
            .code {
              background: rgba(0,0,0,0.2);
              padding: 0.5rem 1rem;
              border-radius: 6px;
              font-family: monospace;
              margin: 1rem 0;
            }
          </style>
          <script>
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          </script>
        </head>
        <body>
          <div class="container">
            <div class="success">✅</div>
            <h1>Development Bypass Active</h1>
            <p>Logged in as: <span class="code">${email}</span></p>
            <p>Redirecting to admin dashboard...</p>
            <p style="margin-top: 2rem; font-size: 0.875rem;">
              This bypass is only active in development mode
            </p>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create dev bypass' },
      { status: 500 }
    );
  }
}
