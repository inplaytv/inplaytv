'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const supabase = createClient();
      
      // First check session from storage
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[RequireAdmin] Session error:', sessionError);
        setError('Session error: ' + sessionError.message);
        router.push('/login');
        return;
      }
      
      if (!session) {
        console.log('[RequireAdmin] No active session, redirecting to login');
        router.push('/login');
        return;
      }

      // Then verify the user with the session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      console.log('[RequireAdmin] Auth check:', { 
        hasSession: !!session, 
        user: user?.id, 
        error: userError?.message 
      });
      
      if (userError) {
        console.error('[RequireAdmin] User verification error:', userError);
        setError('User verification failed: ' + userError.message);
        router.push('/login');
        return;
      }
      
      if (!user) {
        console.log('[RequireAdmin] No user found, redirecting to login');
        router.push('/login');
        return;
      }

      console.log('[RequireAdmin] User authenticated:', user.email);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error('[RequireAdmin] Critical auth check error:', error);
      setError('Authentication failed: ' + (error?.message || 'Unknown error'));
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ color: 'rgba(255,255,255,0.6)' }}>Loading...</div>
        {error && (
          <div style={{ 
            color: '#ef4444', 
            fontSize: '14px',
            maxWidth: '400px',
            textAlign: 'center',
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px'
          }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
