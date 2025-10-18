'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type SignUpMode = 'password' | 'magic';

export default function SignUpPage() {
  const [mode, setMode] = useState<SignUpMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const supabase = createClient();
  const router = useRouter();

  const handlePasswordSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      // Sign up with email and password
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else if (data.user) {
        // Create profile with name
        await supabase.from('profiles').upsert({
          id: data.user.id,
          name: name,
          onboarding_complete: true,
        });
        
        // Check if email confirmation is required
        if (data.user.email_confirmed_at) {
          // Email already confirmed (instant signup - verification disabled)
          setMessage('Account created! Redirecting...');
          setTimeout(() => router.push('/account'), 1000);
        } else {
          // Email confirmation required - redirect to verification page
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        }
      }
    } catch (err) {
      setMessage('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLinkSignUp = async (e: React.FormEvent) => {
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
      background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 100%)',
      padding: '2rem 1rem',
    },
    card: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '2rem',
      maxWidth: '400px',
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
      marginBottom: '2rem',
      fontSize: '0.95rem',
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
    button: {
      width: '100%',
      padding: '0.75rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: 'none',
      borderRadius: '6px',
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
      borderRadius: '6px',
      fontSize: '0.9rem',
      textAlign: 'center' as const,
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
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>
          Join InPlayTV and start competing in premium fantasy golf tournaments
        </p>

        {/* Password Mode Only - Magic Link Removed */}

        <form onSubmit={handlePasswordSignUp} style={styles.form}>
          <div>
            <label htmlFor="name" style={styles.label}>
              Display Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={styles.input}
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" style={styles.label}>
              Email
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
              placeholder="At least 8 characters"
              required
              disabled={isLoading}
              style={styles.input}
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
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

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

        <div style={styles.footer}>
          Already have an account?{' '}
          <Link href="/login" style={styles.link}>
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
