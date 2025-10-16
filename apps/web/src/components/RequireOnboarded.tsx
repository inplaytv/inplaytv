'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface RequireOnboardedProps {
  children: React.ReactNode;
}

export default function RequireOnboarded({ children }: RequireOnboardedProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Check onboarding status
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        // No profile exists yet - redirect to onboarding
        router.push('/onboarding');
        return;
      }

      if (!profile.onboarding_complete) {
        // Onboarding not complete - redirect to onboarding
        router.push('/onboarding');
        return;
      }

      // All checks passed
      setIsAuthorized(true);
      setIsChecking(false);
    };

    checkAuthAndOnboarding();
  }, [router, supabase]);

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 100%)',
    },
    loading: {
      color: 'rgba(255, 255, 255, 0.7)',
      textAlign: 'center' as const,
      padding: '2rem',
      fontSize: '1rem',
    },
  };

  if (isChecking) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
