import type { Metadata } from 'next';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'InPlay Golf',
  description: 'Fantasy Golf Tournaments',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif', background: '#0a0f1a', color: '#fff', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
