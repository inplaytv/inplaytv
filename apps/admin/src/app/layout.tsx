import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AdminNav from '@/components/AdminNav';
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
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
        />
      </head>
      <body className={inter.className} style={{ 
        margin: 0, 
        padding: 0, 
        background: '#0a0f1a', 
        color: '#fff', 
        minHeight: '100vh' 
      }}>
        <AdminNav />
        <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
