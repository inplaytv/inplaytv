'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Call server-side API that uses service role to check admin status
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Success! Redirect to dashboard
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 100%)',
      margin: '-2rem',
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        padding: '2rem',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
      }}>
        <h1 style={{ 
          marginBottom: '0.5rem', 
          fontSize: '1.75rem', 
          fontWeight: 700,
          textAlign: 'center',
        }}>
          Admin Access
        </h1>
        
        <p style={{ 
          marginBottom: '2rem', 
          color: 'rgba(255,255,255,0.7)',
          textAlign: 'center',
          fontSize: '0.9rem',
        }}>
          Sign in with your authorized staff account
        </p>
        
        {(searchParams.get('error') === 'unauthorized' || error) && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1.5rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            color: '#fca5a5',
            fontSize: '0.875rem',
          }}>
            {error || 'Access denied. Admin privileges required.'}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.875rem',
              color: 'rgba(255,255,255,0.9)',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="admin@inplay.tv"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.875rem',
              color: 'rgba(255,255,255,0.9)',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: loading ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        
        <p style={{ 
          marginTop: '1.5rem', 
          fontSize: '0.75rem', 
          color: 'rgba(255,255,255,0.5)',
          textAlign: 'center',
        }}>
          Admin access only. Unauthorized access attempts are logged.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 100%)',
        margin: '-2rem',
        color: '#fff',
      }}>
        Loading...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
