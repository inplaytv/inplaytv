'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [checking, setChecking] = useState(true);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkEmailStatus = async () => {
      const emailParam = searchParams.get('email');
      if (emailParam) {
        setEmail(emailParam);
      }

      // Check if user is already verified
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        if (user.email_confirmed_at) {
          // Already verified, redirect to verified success page
          router.push('/verified');
          return;
        }
        setEmail(user.email || emailParam || '');
      }
      
      setChecking(false);
    };

    checkEmailStatus();

    // Check every 3 seconds if email has been verified
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        clearInterval(interval);
        router.push('/verified');
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [supabase, router, searchParams]);

  const handleResendEmail = async () => {
    setResending(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('✅ Verification email resent! Check your inbox and spam folder.');
      }
    } catch (err) {
      setMessage('An error occurred while resending the email.');
    } finally {
      setResending(false);
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
      padding: '2.5rem',
      maxWidth: '500px',
      width: '100%',
      textAlign: 'center' as const,
    },
    icon: {
      fontSize: '4rem',
      marginBottom: '1.5rem',
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '1rem',
      color: '#fff',
    },
    description: {
      fontSize: '1.1rem',
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: '2rem',
      lineHeight: '1.6',
    },
    email: {
      color: '#667eea',
      fontWeight: 600,
      display: 'block',
      margin: '1rem 0',
    },
    instructions: {
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      border: '1px solid rgba(102, 126, 234, 0.3)',
      borderRadius: '8px',
      padding: '1.5rem',
      marginBottom: '2rem',
      textAlign: 'left' as const,
    },
    instructionsList: {
      color: 'rgba(255, 255, 255, 0.8)',
      lineHeight: '1.8',
      paddingLeft: '1.5rem',
    },
    button: {
      width: '100%',
      padding: '0.875rem',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      border: 'none',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '1rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s',
      marginBottom: '1rem',
    },
    buttonSecondary: {
      width: '100%',
      padding: '0.875rem',
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '1rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s',
      textDecoration: 'none',
      display: 'block',
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    message: {
      padding: '0.875rem',
      borderRadius: '8px',
      marginBottom: '1rem',
      fontSize: '0.95rem',
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
      marginTop: '2rem',
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: '0.9rem',
    },
    link: {
      color: '#667eea',
      textDecoration: 'none',
      fontWeight: 500,
    },
    checkingIcon: {
      animation: 'spin 1s linear infinite',
      fontSize: '3rem',
      color: '#667eea',
    },
  };

  if (checking) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.checkingIcon}>⏳</div>
          <p style={styles.description}>Checking verification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>📧</div>
        
        <h1 style={styles.title}>Verify Your Email</h1>
        
        <p style={styles.description}>
          We&apos;ve sent a verification email to:
          <span style={styles.email}>{email}</span>
        </p>

        <div style={styles.instructions}>
          <p style={{ color: '#fff', fontWeight: 600, marginBottom: '0.75rem' }}>
            📋 Next Steps:
          </p>
          <ol style={styles.instructionsList}>
            <li>Check your email inbox (and spam/junk folder)</li>
            <li>Click the verification link in the email</li>
            <li>You&apos;ll be automatically redirected</li>
            <li>This page will auto-refresh when verified ✨</li>
          </ol>
        </div>

        {message && (
          <div
            style={{
              ...styles.message,
              ...(message.includes('✅') ? styles.messageSuccess : styles.messageError),
            }}
          >
            {message}
          </div>
        )}

        <button
          onClick={handleResendEmail}
          disabled={resending}
          style={{
            ...styles.button,
            ...(resending ? styles.buttonDisabled : {}),
          }}
        >
          {resending ? 'Sending...' : '📨 Resend Verification Email'}
        </button>

        <Link href="/login" style={styles.buttonSecondary}>
          ← Back to Login
        </Link>

        <div style={styles.footer}>
          <p>
            Wrong email?{' '}
            <Link href="/signup" style={styles.link}>
              Sign up again
            </Link>
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
