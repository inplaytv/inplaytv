'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user has already completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .single();

      if (profile?.onboarding_complete) {
        router.push('/account');
        return;
      }

      setIsCheckingAuth(false);
    };

    checkOnboardingStatus();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate password length
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        setIsLoading(false);
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        setIsLoading(false);
        return;
      }

      // Update password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: password,
      });

      if (passwordError) {
        setError(`Password update failed: ${passwordError.message}`);
        setIsLoading(false);
        return;
      }

      // Upsert profile with name and onboarding_complete
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: name,
          onboarding_complete: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      if (profileError) {
        setError(`Profile update failed: ${profileError.message}`);
        setIsLoading(false);
        return;
      }

      // Success - redirect to account
      router.push('/account');
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 100%)',
      padding: '2rem 1rem',
    },
    card: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '2rem',
      maxWidth: '450px',
      width: '100%',
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem',
      color: '#fff',
    },
    subtitle: {
      color: 'rgba(255, 255, 255, 0.7)',
      marginBottom: '2rem',
      fontSize: '0.95rem',
      lineHeight: '1.5',
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1.25rem',
    },
    fieldGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
    },
    label: {
      color: '#fff',
      fontSize: '0.9rem',
      marginBottom: '0.5rem',
      fontWeight: 500,
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '6px',
      color: '#fff',
      fontSize: '1rem',
      outline: 'none',
      transition: 'border-color 0.2s',
    },
    hint: {
      fontSize: '0.85rem',
      color: 'rgba(255, 255, 255, 0.5)',
      marginTop: '0.25rem',
    },
    button: {
      width: '100%',
      padding: '0.875rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: 'none',
      borderRadius: '6px',
      color: '#fff',
      fontSize: '1rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'opacity 0.2s',
      marginTop: '0.5rem',
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    error: {
      padding: '0.75rem',
      borderRadius: '6px',
      fontSize: '0.9rem',
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      color: '#f87171',
      border: '1px solid rgba(239, 68, 68, 0.3)',
    },
    loading: {
      color: 'rgba(255, 255, 255, 0.7)',
      textAlign: 'center' as const,
      padding: '2rem',
    },
  };

  if (isCheckingAuth) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Checking authentication...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Complete Your Profile</h1>
        <p style={styles.subtitle}>
          Welcome! Let's set up your account with a display name and password. 
          You'll use your password to sign in going forward.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label htmlFor="name" style={styles.label}>
              Display Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              disabled={isLoading}
              style={styles.input}
              autoComplete="name"
            />
            <span style={styles.hint}>This will be shown to other players</span>
          </div>

          <div style={styles.fieldGroup}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a secure password"
              required
              minLength={8}
              disabled={isLoading}
              style={styles.input}
              autoComplete="new-password"
            />
            <span style={styles.hint}>Minimum 8 characters</span>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.button,
              ...(isLoading ? styles.buttonDisabled : {}),
            }}
          >
            {isLoading ? 'Saving...' : 'Save and continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
