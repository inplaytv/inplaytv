'use client';

import RequireAuth from '@/components/RequireAuth';
import Header from '@/components/Header';

// Force dynamic rendering (requires auth)
export const dynamic = 'force-dynamic';

export default function EntriesPage() {
  return (
    <RequireAuth>
      <Header />
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>My Entries</h1>
        
        <section style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '2rem',
          marginTop: '2rem',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>You have no tournament entries yet.</p>
        </section>
      </main>
    </RequireAuth>
  );
}
