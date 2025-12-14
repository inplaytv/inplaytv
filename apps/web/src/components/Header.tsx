'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Header() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    router.push('/');
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMenuOpen(false);
  };

  const styles: { [key: string]: React.CSSProperties } = {
    header: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      padding: '1rem 0',
      background: 'rgba(10, 15, 28, 0.8)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    },
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    brand: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#fff',
      textDecoration: 'none',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    nav: {
      display: 'flex',
      gap: '2rem',
      alignItems: 'center',
    },
    navMobile: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1.5rem',
      position: 'fixed' as const,
      top: '0',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(10, 15, 28, 0.98)',
      backdropFilter: 'blur(20px)',
      padding: '6rem 2rem 2rem 2rem',
      zIndex: 1000,
      transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease-in-out',
      overflowY: 'auto',
    },
    mobileMenuOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 999,
      opacity: isMenuOpen ? 1 : 0,
      visibility: isMenuOpen ? 'visible' : 'hidden',
      transition: 'opacity 0.3s ease, visibility 0.3s ease',
    },
    link: {
      color: 'rgba(255, 255, 255, 0.8)',
      textDecoration: 'none',
      fontSize: '0.95rem',
      transition: 'color 0.2s',
      cursor: 'pointer',
    },
    linkHover: {
      color: '#fff',
    },
    button: {
      backgroundColor: 'transparent',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      color: '#fff',
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.95rem',
      transition: 'all 0.2s',
    },
    buttonPrimary: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: 'none',
      color: '#fff',
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.95rem',
      fontWeight: 500,
      transition: 'all 0.2s',
    },
    menuToggle: {
      display: 'none',
      backgroundColor: 'transparent',
      border: 'none',
      color: '#fff',
      fontSize: '1.8rem',
      cursor: 'pointer',
      padding: '0.5rem',
      borderRadius: '6px',
      transition: 'all 0.2s ease',
      position: 'relative',
      zIndex: 1001,
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
  };

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <Link href="/" style={styles.brand}>
          InPlayTV
        </Link>

        <button
          style={{ ...styles.menuToggle }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
          className="mobile-menu-toggle"
        >
          <div style={styles.hamburgerIcon}>
            <div style={{
              ...styles.hamburgerLine,
              transform: isMenuOpen ? 'rotate(45deg) translate(6px, 6px)' : 'none'
            }}></div>
            <div style={{
              ...styles.hamburgerLine,
              opacity: isMenuOpen ? 0 : 1
            }}></div>
            <div style={{
              ...styles.hamburgerLine,
              transform: isMenuOpen ? 'rotate(-45deg) translate(6px, -6px)' : 'none'
            }}></div>
          </div>
        </button>

        <nav style={styles.nav} className="desktop-nav">
          <span style={{...styles.link, opacity: 0.5, cursor: 'not-allowed'}}>
            Tournaments
          </span>
          <span style={{...styles.link, opacity: 0.5, cursor: 'not-allowed'}}>
            How it works
          </span>

          {userEmail ? (
            <>
              <Link href="/account" style={styles.link}>
                Account
              </Link>
              <button onClick={handleSignOut} style={styles.button}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={styles.link}>
                Login
              </Link>
              <Link href="/signup" style={styles.buttonPrimary}>
                Sign up
              </Link>
            </>
          )}
        </nav>

        {isMenuOpen && (
          <>
            <div 
              style={styles.mobileMenuOverlay} 
              onClick={() => setIsMenuOpen(false)}
            />
            <nav style={styles.navMobile} className="mobile-nav">
              <span style={{...styles.link, opacity: 0.5, cursor: 'not-allowed', fontSize: '1.2rem'}}>
                Tournaments
              </span>
              <span style={{...styles.link, opacity: 0.5, cursor: 'not-allowed', fontSize: '1.2rem'}}>
                How it works
              </span>

              {userEmail ? (
                <>
                  <Link href="/account" style={{...styles.link, fontSize: '1.2rem'}} onClick={() => setIsMenuOpen(false)}>
                    Account
                  </Link>
                  <button onClick={() => {handleSignOut(); setIsMenuOpen(false);}} style={{...styles.button, fontSize: '1.2rem', marginTop: '1rem'}}>
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" style={{...styles.link, fontSize: '1.2rem'}} onClick={() => setIsMenuOpen(false)}>
                    Login
                  </Link>
                  <Link href="/signup" style={{...styles.buttonPrimary, fontSize: '1.2rem', marginTop: '1rem', textAlign: 'center'}} onClick={() => setIsMenuOpen(false)}>
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </>
        )}
      </div>

      <style jsx>{`
        @media (min-width: 769px) {
          .mobile-menu-toggle {
            display: none !important;
          }
          .mobile-nav {
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
        
        /* Prevent body scroll when menu is open */
        ${isMenuOpen ? `
          body {
            overflow: hidden;
          }
        ` : ''}
      `}</style>
    </header>
  );
}
