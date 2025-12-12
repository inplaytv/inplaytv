'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabaseClient';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkOnboarding = async () => {
      if (authLoading) return;
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Check onboarding completion (skip check if on onboarding page)
      if (pathname !== '/onboarding') {
        const supabase = createClient();
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', user.id)
          .single();

        if (!profile?.onboarding_complete) {
          router.push('/onboarding');
          return;
        }
      }
      
      setAuthenticated(true);
      setChecking(false);
    };

    checkOnboarding();
  }, [user, authLoading, router, pathname]);

  if (authLoading || checking) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}
