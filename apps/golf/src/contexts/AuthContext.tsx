'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [rateLimited, setRateLimited] = useState(false);
  
  useEffect(() => {
    const supabase = createClient();
    
    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        // Handle rate limit
        if (error?.message?.includes('rate limit') || error?.status === 429) {
          console.warn('Rate limit detected, will retry in 60 seconds');
          setRateLimited(true);
          setLoading(false);
          // Retry after 60 seconds
          setTimeout(() => {
            setRateLimited(false);
            initAuth();
          }, 60000);
          return;
        }
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setRateLimited(false);
      } catch (error: any) {
        console.error('Error loading session:', error);
        if (error?.message?.includes('rate limit')) {
          setRateLimited(true);
          setTimeout(() => {
            setRateLimited(false);
            initAuth();
          }, 60000);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
        setRateLimited(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run once on mount

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {rateLimited && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          background: 'rgba(239, 68, 68, 0.95)',
          color: '#fff',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 9999,
          maxWidth: '400px'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>⚠️ Rate Limit Active</div>
          <div style={{ fontSize: '0.875rem', lineHeight: 1.4 }}>
            Too many requests. Retrying in 60 seconds...
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}
