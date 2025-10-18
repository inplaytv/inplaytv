'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function VerificationSuccessPage() {
  const [email, setEmail] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Try to get email if user happens to be logged in
    const getEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    };
    getEmail();
  }, [supabase]);

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
      padding: '3rem 2.5rem',
      maxWidth: '500px',
      width: '100%',
      textAlign: 'center' as const,
    },
    icon: {
      fontSize: '5rem',
      marginBottom: '1.5rem',
      animation: 'bounce 1s ease-in-out',
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      marginBottom: '1rem',
      color: '#fff',
    },
    subtitle: {
      fontSize: '1.1rem',
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: '2rem',
      lineHeight: '1.6',
    },
    email: {
      color: '#667eea',
      fontWeight: 600,
      display: 'block',
      margin: '0.5rem 0 2rem 0',
    },
    successBox: {
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      border: '2px solid rgba(34, 197, 94, 0.3)',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '2rem',
    },
    successText: {
      color: '#4ade80',
      fontSize: '1rem',
      lineHeight: '1.6',
    },
    button: {
      width: '100%',
      padding: '1rem',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      border: 'none',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '1.1rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s',
      textDecoration: 'none',
      display: 'block',
      marginBottom: '1rem',
    },
    buttonSecondary: {
      width: '100%',
      padding: '1rem',
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
    footer: {
      marginTop: '2rem',
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: '0.9rem',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>🎉</div>
        
        <h1 style={styles.title}>Email Verified!</h1>
        
        <p style={styles.subtitle}>
          Your email has been successfully verified!
          {email && <span style={styles.email}>{email}</span>}
        </p>

        <div style={styles.successBox}>
          <p style={styles.successText}>
            ✅ Your account is now fully activated!<br />
            You can now login and access all features.
          </p>
        </div>

        <Link href="/login" style={styles.button}>
          Continue to Login →
        </Link>

        <Link href="/" style={styles.buttonSecondary}>
          ← Back to Home
        </Link>

        <div style={styles.footer}>
          <p>Welcome to InPlay TV! 🏌️</p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
