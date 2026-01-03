import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SidebarProvider } from '@/components/SidebarContext';
import ConditionalSidebar from '@/components/ConditionalSidebar';
import MainContent from '@/components/MainContent';
import Background from '@/components/Background';
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
        minHeight: '100vh',
        display: 'flex',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        position: 'relative',
      }}>
        <Background />
        <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
          <SidebarProvider>
            <ConditionalSidebar />
            <MainContent>
              {children}
            </MainContent>
          </SidebarProvider>
        </div>
      </body>
    </html>
  );
}
