'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
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

    const supabase = createClient();

    try {
      // Sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Authentication failed');
        setLoading(false);
        return;
      }

      console.log('Logged in user ID:', user.id);
      console.log('Checking admins table...');

      const { data: adminCheck, error: adminCheckError } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      console.log('Admin check result:', adminCheck);
      console.log('Admin check error:', adminCheckError);

      if (!adminCheck) {
        // Not an admin, sign them out
        await supabase.auth.signOut();
        setError(`Access denied. User ID ${user.id} is not in admins table. Check console for details.`);
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
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 100%)',
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
          🛠️ Admin Access
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
