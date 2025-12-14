'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from './UserMenu';
import NavigationMenu from './NavigationMenu';
import NotificationBell from './NotificationBell';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Don't show navigation menu if not authenticated
  if (loading || !user) {
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

  const headerStyles = {
    header: {
      background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      padding: '1rem 2rem',
      position: 'sticky' as const,
      top: 0,
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
    },
    nav: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      maxWidth: '1400px',
      margin: '0 auto',
      gap: '2rem'
    },
    mobileMenuToggle: {
      display: 'none',
      backgroundColor: 'transparent',
      border: 'none',
      color: '#fff',
      fontSize: '1.5rem',
      cursor: 'pointer',
      padding: '0.5rem',
    },
    hamburgerIcon: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '3px',
      width: '24px',
      height: '20px',
    },
    hamburgerLine: {
      width: '100%',
      height: '3px',
      backgroundColor: '#fff',
      borderRadius: '2px',
      transition: 'all 0.3s ease',
    },
    rightSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    }
  };

  return (
    <>
      <header style={headerStyles.header}>
        <nav style={headerStyles.nav}>
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
              flexShrink: 0,
              zIndex: 1001
            }}
          >
            ⛳ <span style={{ 
              background: 'linear-gradient(135deg, #10b981, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>InPlay</span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            style={headerStyles.mobileMenuToggle}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
            className="mobile-menu-toggle"
          >
            <div style={headerStyles.hamburgerIcon}>
              <div style={{
                ...headerStyles.hamburgerLine,
                transform: isMobileMenuOpen ? 'rotate(45deg) translate(6px, 6px)' : 'none'
              }}></div>
              <div style={{
                ...headerStyles.hamburgerLine,
                opacity: isMobileMenuOpen ? 0 : 1
              }}></div>
              <div style={{
                ...headerStyles.hamburgerLine,
                transform: isMobileMenuOpen ? 'rotate(-45deg) translate(6px, -6px)' : 'none'
              }}></div>
            </div>
          </button>

          {/* Desktop Navigation Menu */}
          <div className="desktop-nav">
            <NavigationMenu />
          </div>

          {/* Right Section */}
          <div style={headerStyles.rightSection} className="desktop-nav">
            {/* Notification Bell */}
            <NotificationBell />
            
            {/* User Menu */}
            <UserMenu />
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 998
            }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '280px',
            backgroundColor: '#0a0f1a',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '6rem 1rem 2rem 1rem',
            zIndex: 999,
            overflowY: 'auto',
            transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s ease-in-out'
          }}>
            {/* Mobile Navigation Menu */}
            <NavigationMenu isMobile={true} onItemClick={() => setIsMobileMenuOpen(false)} />
            
            {/* Mobile Right Section */}
            <div style={{
              marginTop: '2rem',
              paddingTop: '2rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <NotificationBell />
              <UserMenu />
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @media (min-width: 769px) {
          .mobile-menu-toggle {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .mobile-menu-toggle {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
          .desktop-nav {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
