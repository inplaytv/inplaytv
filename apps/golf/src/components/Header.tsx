'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from './UserMenu';
import GolfDataDropdown from './GolfDataDropdown';
import { createClient } from '@/lib/supabase';

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
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto' }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#fff' }}>⛳ InPlay Golf</span>
          <UserMenu />
        </nav>
      </header>
    );
  }

  return (
    <header style={{
      background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      padding: '1rem 2rem',
    }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#fff' }}>⛳ InPlay Golf</span>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Lobby</Link>
          <Link href="/tournaments" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Tournaments</Link>
          <Link href="/entries" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>My Scorecards</Link>
          <Link href="/leaderboards" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Leaderboards</Link>
          <GolfDataDropdown />
          <Link href="/how-to-play" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>How To Play</Link>
        </div>
        <UserMenu />
      </nav>
    </header>
  );
}
