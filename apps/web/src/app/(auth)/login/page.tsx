'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

type LoginMode = 'password' | 'magic';

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    // Check for error messages from callback
    const error = searchParams.get('error');
    const errorMessage = searchParams.get('message');
    
    if (error === 'verification_failed') {
      setMessage(`Verification failed: ${errorMessage || 'Please try again or contact support.'}`);
    } else if (error === 'auth_failed') {
      setMessage('Authentication failed. Please try again.');
    } else if (error === 'no_code') {
      setMessage('Invalid verification link. Please try again.');
    }
  }, [searchParams]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check if it's an unverified email error
        if (error.message.includes('Email not confirmed')) {
          setMessage('Please verify your email before logging in. Check your inbox (including spam folder).');
        } else {
          setMessage(`Error: ${error.message}`);
        }
      } else if (data.user) {
        // After login, redirect to golf app (main product)
        window.location.href = 'https://golf.inplay.tv/';
      }
    } catch (err) {
      setMessage('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('Check your email for a sign-in link');
        setEmail('');
      }
    } catch (err) {
      setMessage('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    },
    card: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      padding: '2rem',
      maxWidth: '420px',
      width: '100%',
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem',
      color: '#fff',
      textAlign: 'center' as const,
    },
    subtitle: {
      color: 'rgba(255, 255, 255, 0.7)',
      textAlign: 'center' as const,
      marginBottom: '1.5rem',
      fontSize: '0.95rem',
    },
    modeToggle: {
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '1.5rem',
      padding: '0.25rem',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    modeButton: {
      flex: 1,
      padding: '0.6rem',
      background: 'transparent',
      border: 'none',
      borderRadius: '8px',
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: '0.9rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    modeButtonActive: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1rem',
    },
    label: {
      color: '#fff',
      fontSize: '0.9rem',
      marginBottom: '0.5rem',
      display: 'block',
      fontWeight: 500,
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '1rem',
      outline: 'none',
      transition: 'border-color 0.2s',
    },
    button: {
      width: '100%',
      padding: '0.75rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: 'none',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '1rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'opacity 0.2s',
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    message: {
      padding: '0.75rem',
      borderRadius: '8px',
      fontSize: '0.9rem',
      textAlign: 'center' as const,
      marginTop: '1rem',
    },
    messageSuccess: {
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      color: '#4ade80',
      border: '1px solid rgba(34, 197, 94, 0.3)',
    },
    messageError: {
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      color: '#f87171',
      border: '1px solid rgba(239, 68, 68, 0.3)',
    },
    footer: {
      marginTop: '1.5rem',
      textAlign: 'center' as const,
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '0.9rem',
    },
    link: {
      color: '#667eea',
      textDecoration: 'none',
      fontWeight: 500,
      cursor: 'pointer',
    },
    switchLink: {
      display: 'block',
      marginTop: '1rem',
      textAlign: 'center' as const,
      fontSize: '0.85rem',
      color: 'rgba(255, 255, 255, 0.6)',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Sign in to continue competing</p>

        {/* Password Mode Only - Magic Link Removed */}

        <form onSubmit={handlePasswordLogin} style={styles.form}>
            <div>
              <label htmlFor="email" style={styles.label}>
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={isLoading}
                style={styles.input}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" style={styles.label}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading}
                style={styles.input}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                ...styles.button,
                ...(isLoading ? styles.buttonDisabled : {}),
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

        {/* Message Display */}
        {message && (
          <div
            style={{
              ...styles.message,
              ...(message.includes('Check your email')
                ? styles.messageSuccess
                : styles.messageError),
            }}
          >
            {message}
          </div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          New here?{' '}
          <Link href="/signup" style={styles.link}>
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

