'use client';

import { useState, useEffect, FormEvent } from 'react';
import styles from './page.module.css';

interface ComingSoonSettings {
  headline: string;
  description: string;
  backgroundImage: string;
  logoText: string;
  tagline: string;
}

export default function ComingSoonPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState<ComingSoonSettings>({
    headline: 'COMING SOON',
    description: 'Precision meets passion in a live, immersive format. Competition will never emerge the same.',
    backgroundImage: '', // No default background image
    logoText: 'InPlayTV',
    tagline: 'A new way to follow what matters.'
  });

  // Temporarily disable history protection for testing
  // useEffect(() => {
  //   // Prevent any URL manipulation
  //   if (typeof window !== 'undefined') {
  //     const originalPushState = window.history.pushState;
  //     const originalReplaceState = window.history.replaceState;
      
  //     window.history.pushState = function(...args) {
  //       console.log('[Coming Soon] Preventing history.pushState:', args);
  //       return;
  //     };
      
  //     window.history.replaceState = function(...args) {
  //       console.log('[Coming Soon] Preventing history.replaceState:', args);
  //       return;
  //     };
      
  //     return () => {
  //       window.history.pushState = originalPushState;
  //       window.history.replaceState = originalReplaceState;
  //     };
  //   }
  // }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/coming-soon', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          console.error('[Coming Soon] API Error: Status', response.status);
          return;
        }
        
        const data = await response.json();
        
        // Update settings, using fallbacks if API values are empty
        setSettings(prevSettings => ({
          headline: data.headline || prevSettings.headline,
          description: data.description || prevSettings.description,
          backgroundImage: (data.backgroundImage || prevSettings.backgroundImage).trim(),
          logoText: data.logoText || prevSettings.logoText,
          tagline: data.tagline || prevSettings.tagline
        }));
        
      } catch (error) {
        console.error('[Coming Soon] API Error:', error);
      }
    };
    
    fetchSettings();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');
    
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage("You're on the list! We'll be in touch.");
        setEmail('');
      } else {
        const data = await response.json();
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Unable to connect. Please try again.');
    }

    setTimeout(() => {
      setStatus('idle');
      setMessage('');
    }, 5000);
  };

  return (
    <div className={styles.container}>
      {/* Background image from admin panel or fallback */}
      <div 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundImage: settings.backgroundImage ? `url("${settings.backgroundImage.trim()}")` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          zIndex: -1
        }}
      />
      
      <div className={styles.noise} />
      
      <div className={styles.content}>
        <div className={styles.branding}>
          <div className={styles.logo}>{settings.logoText}</div>
          <div className={styles.tagline}>{settings.tagline}</div>
          {/* PREMIUM DESIGN v2.0 - Updated Dec 13, 2025 - Now database-driven with proper deployment */}
        </div>

        <div className={styles.main}>
          <h1 className={styles.headline}>{settings.headline}</h1>
          <p className={styles.description}>
            {settings.description}
          </p>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTitle}>Be the first to know</div>
          
          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              disabled={status === 'loading'}
              required
            />
            <button 
              type="submit" 
              className={styles.button}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Sending...' : 'Notify me'}
            </button>
          </form>

          <div className={styles.disclaimer}>No spam. Only the launch.</div>

          {message && (
            <div className={`${styles.message} ${status === 'success' ? styles.success : styles.error}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
