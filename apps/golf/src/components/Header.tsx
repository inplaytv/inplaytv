'use client';

import Link from 'next/link';
import UserMenu from './UserMenu';

export default function Header() {
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
          <Link href="/entries" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>My Entries</Link>
        </div>
        <UserMenu />
      </nav>
    </header>
  );
}
