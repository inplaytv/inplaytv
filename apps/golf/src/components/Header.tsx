'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from './UserMenu';
import NavigationMenu from './NavigationMenu';
import { createClient } from '@/lib/supabaseClient';

export default function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();
  
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    
    checkAuth();
  }, [pathname]);

  // Don't show navigation menu if not authenticated
  if (!isAuthenticated) {
    return (
      <header style={{
        background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '1rem 2rem',
      }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#fff' }}>⛳ InPlay Golf</span>
        </nav>
      </header>
    );
  }

  return (
    <header style={{
      background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      padding: '1rem 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
    }}>
      <nav style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        maxWidth: '1400px', 
        margin: '0 auto',
        gap: '2rem'
      }}>
        {/* Logo */}
        <Link 
          href="/"
          style={{ 
            fontWeight: 'bold', 
            fontSize: '1.25rem', 
            color: '#fff',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexShrink: 0
          }}
        >
          ⛳ <span style={{ 
            background: 'linear-gradient(135deg, #10b981, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>InPlay</span>
        </Link>

        {/* Navigation Menu */}
        <NavigationMenu />

        {/* User Menu */}
        <UserMenu />
      </nav>
    </header>
  );
}
