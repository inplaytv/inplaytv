'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function AdminNav() {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  // Hide nav on login page
  if (pathname === '/login') {
    return null;
  }

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const response = await fetch('/api/auth/signout', { method: 'POST' });
      if (response.ok) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Sign out error:', error);
      setSigningOut(false);
    }
  };

  return (
    <header style={{
      background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      padding: '1rem 2rem',
    }}>
      <nav style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        maxWidth: '1400px', 
        margin: '0 auto' 
      }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#fff' }}>
            🛠️ InPlay Admin
          </span>
          <Link 
            href="/" 
            style={{ 
              color: pathname === '/' ? '#fff' : 'rgba(255,255,255,0.7)', 
              textDecoration: 'none',
              fontWeight: pathname === '/' ? 600 : 400,
            }}
          >
            Dashboard
          </Link>
          <Link 
            href="/users" 
            style={{ 
              color: pathname === '/users' ? '#fff' : 'rgba(255,255,255,0.7)', 
              textDecoration: 'none',
              fontWeight: pathname === '/users' ? 600 : 400,
            }}
          >
            Users
          </Link>
          <Link 
            href="/transactions" 
            style={{ 
              color: pathname === '/transactions' ? '#fff' : 'rgba(255,255,255,0.7)', 
              textDecoration: 'none',
              fontWeight: pathname === '/transactions' ? 600 : 400,
            }}
          >
            Transactions
          </Link>
          <Link 
            href="/withdrawals" 
            style={{ 
              color: pathname === '/withdrawals' ? '#fff' : 'rgba(255,255,255,0.7)', 
              textDecoration: 'none',
              fontWeight: pathname === '/withdrawals' ? 600 : 400,
            }}
          >
            Withdrawals
          </Link>
        </div>
        <button 
          onClick={handleSignOut}
          disabled={signingOut}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: signingOut ? 'not-allowed' : 'pointer',
            fontWeight: 500,
            opacity: signingOut ? 0.5 : 1,
          }}
        >
          {signingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </nav>
    </header>
  );
}
