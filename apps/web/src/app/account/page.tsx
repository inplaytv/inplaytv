'use client';

import { createClient } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AccountPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVerifiedMessage, setShowVerifiedMessage] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    // Check if user just verified their email
    if (searchParams.get('verified') === 'true') {
      setShowVerifiedMessage(true);
      // Hide message after 5 seconds
      setTimeout(() => setShowVerifiedMessage(false), 5000);
    }

    const loadUserData = async () => {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email ?? null);
      
      // Load profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setName(profile.name);
      }

      setLoading(false);
    };

    loadUserData();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      minHeight: 'calc(100vh - 80px)',
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
      maxWidth: '500px',
      width: '100%',
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '1.5rem',
      color: '#fff',
    },
    section: {
      marginBottom: '1.5rem',
    },
    label: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '0.9rem',
      marginBottom: '0.5rem',
      display: 'block',
    },
    value: {
      color: '#fff',
      fontSize: '1.1rem',
      padding: '0.75rem',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '6px',
    },
    button: {
      width: '100%',
      padding: '0.75rem',
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      border: 'none',
      borderRadius: '6px',
      color: '#fff',
      fontSize: '1rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'opacity 0.2s',
      marginTop: '1rem',
    },
    loading: {
      color: 'rgba(255, 255, 255, 0.7)',
      textAlign: 'center' as const,
      padding: '2rem',
    },
    successMessage: {
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      color: '#4ade80',
      border: '1px solid rgba(34, 197, 94, 0.3)',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1.5rem',
      textAlign: 'center' as const,
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Account</h1>

        {showVerifiedMessage && (
          <div style={styles.successMessage}>
            ✅ Email verified successfully! Welcome to InPlay TV.
          </div>
        )}

        {name && (
          <div style={styles.section}>
            <label style={styles.label}>Display Name</label>
            <div style={styles.value}>{name}</div>
          </div>
        )}

        <div style={styles.section}>
          <label style={styles.label}>Email address</label>
          <div style={styles.value}>{email}</div>
        </div>

        {/* Future: Redirect to game.inplay.tv */}
        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '8px', border: '1px solid rgba(102, 126, 234, 0.3)' }}>
          <p style={{ color: '#667eea', fontWeight: 600, marginBottom: '0.5rem' }}>🎮 Coming Soon:</p>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
            Game dashboard will be available at: <strong>game.inplay.tv</strong>
          </p>
        </div>

        <button onClick={handleSignOut} style={styles.button}>
          Sign out
        </button>
      </div>
    </div>
  );
}

