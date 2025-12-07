'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Determine base URL at module level (will be consistent server/client)
const BASE_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://www.inplay.tv';

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const supabase = createClient();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailOrUsername,
        password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setMessage('Please verify your email before logging in. Check your inbox (including spam folder).');
        } else if (error.message.includes('Invalid login credentials')) {
          setMessage('Invalid email or password');
        } else {
          setMessage(`Error: ${error.message}`);
        }
      } else if (data.user) {
        // Redirect to home page
        router.push('/');
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
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '2.5rem',
      maxWidth: '420px',
      width: '100%',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
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
      gap: '1.25rem',
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
      padding: '0.85rem',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '1rem',
      outline: 'none',
      transition: 'all 0.2s',
    },
    button: {
      width: '100%',
      padding: '0.85rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: 'none',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '1rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      marginTop: '0.5rem',
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    message: {
      padding: '0.85rem',
      borderRadius: '8px',
      fontSize: '0.9rem',
      textAlign: 'center' as const,
      marginTop: '1rem',
    },
    messageError: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
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
    divider: {
      margin: '1.5rem 0',
      textAlign: 'center' as const,
      position: 'relative' as const,
    },
    dividerText: {
      color: 'rgba(255, 255, 255, 0.5)',
      fontSize: '0.85rem',
      background: 'rgba(26, 31, 46, 1)',
      padding: '0 1rem',
      position: 'relative' as const,
      zIndex: 1,
    },
    websiteLink: {
      display: 'block',
      padding: '0.85rem',
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      color: '#fff',
      textDecoration: 'none',
      textAlign: 'center' as const,
      fontSize: '0.95rem',
      transition: 'all 0.2s',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Sign in to InPlay Golf</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <div>
            <label htmlFor="emailOrUsername" style={styles.label}>
              Email Address
            </label>
            <input
              id="emailOrUsername"
              type="email"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
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
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {message && (
          <div style={{ ...styles.message, ...styles.messageError }}>
            {message}
          </div>
        )}

        <div style={styles.divider}>
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: 0, 
            right: 0, 
            height: '1px', 
            background: 'rgba(255, 255, 255, 0.1)' 
          }}></div>
          <span style={styles.dividerText}>or</span>
        </div>

        <a
          href={`${BASE_URL}/login`}
          style={styles.websiteLink}
        >
          Sign in on main website
        </a>

        <div style={styles.footer}>
          Don&apos;t have an account?{' '}
          <a 
            href={`${BASE_URL}/signup`}
            style={styles.link}
          >
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
}
