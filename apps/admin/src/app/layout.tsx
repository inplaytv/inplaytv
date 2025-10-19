import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { createClient } from '@/lib/supabaseClient';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'InPlay Admin',
  description: 'Internal admin panel for InPlay staff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-GB">
      <body className={inter.className}>
        <nav style={{
          borderBottom: '1px solid #eaeaea',
          padding: '1rem 2rem',
          display: 'flex',
          gap: '2rem',
          alignItems: 'center',
          background: '#fff',
        }}>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>InPlay Admin</h1>
          <Link href="/" style={{ textDecoration: 'none', color: '#0070f3' }}>Dashboard</Link>
          <Link href="/users" style={{ textDecoration: 'none', color: '#0070f3' }}>Users</Link>
          <Link href="/transactions" style={{ textDecoration: 'none', color: '#0070f3' }}>Transactions</Link>
          <Link href="/withdrawals" style={{ textDecoration: 'none', color: '#0070f3' }}>Withdrawals</Link>
          <div style={{ marginLeft: 'auto' }}>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" style={{
                background: 'none',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}>
                Sign out
              </button>
            </form>
          </div>
        </nav>
        <main style={{ padding: '2rem' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
