'use client';

import { useEffect, useState } from 'react';

export default function LoginPage() {
  const [websiteUrl, setWebsiteUrl] = useState('https://www.inplay.tv/login');

  useEffect(() => {
    // Set environment-aware URL
    if (window.location.hostname === 'localhost') {
      setWebsiteUrl('http://localhost:3000/login');
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 100%)',
      padding: '2rem',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '3rem 2.5rem',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Sign In Required</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem', lineHeight: '1.6' }}>
          Please sign in on the InPlay TV website. After logging in, you&apos;ll be automatically 
          redirected back here to access the golf app.
        </p>
        
        <a
          href={websiteUrl}
          style={{
            display: 'inline-block',
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            marginBottom: '1rem',
          }}
        >
          Sign In on Website →
        </a>
        
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: '1.5rem' }}>
          After signing in, return to golf.inplay.tv
        </p>
      </div>
    </div>
  );
}
