'use client';

import { useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabaseClient';

// Force dynamic rendering (requires auth)
export const dynamic = 'force-dynamic';

export default function LobbyPage() {
  const [email, setEmail] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
    };
    getUser();
  }, [supabase]);

  return (
    <RequireAuth>
      <Header />
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Welcome to the Lobby</h1>
        {email && <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem' }}>Signed in as: {email}</p>}
        
        <section style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '2rem',
          marginTop: '2rem',
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Upcoming Tournaments</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>No tournaments available yet. Check back soon!</p>
        </section>
      </main>
    </RequireAuth>
  );
}
