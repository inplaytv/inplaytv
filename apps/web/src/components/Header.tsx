'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
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
      gap: '1rem',
      position: 'absolute' as const,
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: '#0a0f1a',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '1rem',
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
      fontSize: '1.5rem',
      cursor: 'pointer',
      padding: '0.5rem',
    },
  };

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <Link href="/" style={styles.brand}>
          InPlayTV
        </Link>

        <button
          style={{ ...styles.menuToggle, display: 'block' }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
          className="mobile-menu-toggle"
        >
          ☰
        </button>

        <nav style={styles.nav} className="desktop-nav">
          <button 
            onClick={() => scrollToSection('how-it-works')} 
            style={{...styles.link, background: 'none', border: 'none', cursor: 'pointer'}}
          >
            How it works
          </button>

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
          <nav style={styles.navMobile} className="mobile-nav">
            <button 
              onClick={() => scrollToSection('how-it-works')} 
              style={{...styles.link, background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left'}}
            >
              How it works
            </button>

            {userEmail ? (
              <>
                <Link href="/account" style={styles.link} onClick={() => setIsMenuOpen(false)}>
                  Account
                </Link>
                <button onClick={handleSignOut} style={styles.button}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" style={styles.link} onClick={() => setIsMenuOpen(false)}>
                  Login
                </Link>
                <Link href="/signup" style={styles.buttonPrimary} onClick={() => setIsMenuOpen(false)}>
                  Sign up
                </Link>
              </>
            )}
          </nav>
        )}
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .mobile-menu-toggle {
            display: none !important;
          }
          .mobile-nav {
            display: none !important;
          }
        }
        @media (max-width: 767px) {
          .desktop-nav {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
