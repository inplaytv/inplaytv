'use client';

import RequireAuth from '@/components/RequireAuth';

export const dynamic = 'force-dynamic';

function NotificationsPageContent() {
  return (
    <>
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', color: '#fff' }}>
          Notifications
        </h1>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '3rem 2rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>
            No Notifications Yet
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
            You'll receive notifications about tournaments, entries, and account activity here.
          </p>
        </div>
      </div>
    </>
  );
}

export default function NotificationsPage() {
  return (
    <RequireAuth>
      <NotificationsPageContent />
    </RequireAuth>
  );
}
