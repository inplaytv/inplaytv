'use client';

export default function ComingSoonPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{
        maxWidth: '600px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '3rem',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚀</div>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: '1rem',
        }}>
          Coming Soon
        </h1>
        <p style={{
          fontSize: '1.25rem',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '2rem',
          lineHeight: '1.6',
        }}>
          We're working hard to bring you something amazing. 
          Our platform is launching soon!
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginTop: '2rem',
        }}>
          <div style={{
            padding: '1rem 1.5rem',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '10px',
            color: '#fff',
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>Soon</div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Days</div>
          </div>
        </div>
        <p style={{
          fontSize: '0.875rem',
          color: 'rgba(255, 255, 255, 0.7)',
          marginTop: '2rem',
        }}>
          Stay tuned for updates
        </p>
      </div>
    </div>
  );
}
