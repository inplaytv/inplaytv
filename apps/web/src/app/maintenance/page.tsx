'use client';

export default function MaintenancePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{
        maxWidth: '600px',
        background: '#1e293b',
        borderRadius: '20px',
        padding: '3rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔧</div>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: '1rem',
        }}>
          Under Maintenance
        </h1>
        <p style={{
          fontSize: '1.25rem',
          color: '#94a3b8',
          marginBottom: '2rem',
          lineHeight: '1.6',
        }}>
          We&apos;re currently performing scheduled maintenance to improve your experience.
        </p>
        <div style={{
          padding: '1.5rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '10px',
          marginBottom: '2rem',
        }}>
          <p style={{
            fontSize: '1rem',
            color: '#ef4444',
            fontWeight: '600',
            marginBottom: '0.5rem',
          }}>
            ⚠️ Service Temporarily Unavailable
          </p>
          <p style={{
            fontSize: '0.875rem',
            color: '#94a3b8',
          }}>
            We&apos;ll be back online shortly. Thank you for your patience.
          </p>
        </div>
        <p style={{
          fontSize: '0.875rem',
          color: '#64748b',
        }}>
          Check back soon or contact support if you need immediate assistance.
        </p>
      </div>
    </div>
  );
}
