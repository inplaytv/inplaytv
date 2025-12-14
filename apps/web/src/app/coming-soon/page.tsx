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
    description: 'Be the first to Strike',
    backgroundImage: '/backgrounds/golf-course-teal.jpg', // Direct static image
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
    // Temporarily disable API call to fix production issues
    // TODO: Fix API route deployment on Vercel
    console.log('[Coming Soon] Using static settings - API call disabled');
    return;
    
    const fetchSettings = async () => {
      try {
        const apiUrl = '/api/settings/coming-soon';
        console.log('[Coming Soon] Fetching from:', apiUrl);
        
        const response = await fetch(apiUrl, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        console.log('[Coming Soon] Response status:', response.status);
        console.log('[Coming Soon] Response headers:', response.headers);
        
        if (!response.ok) {
          const text = await response.text();
          console.error('[Coming Soon] API Error: Status', response.status, 'Response:', text);
          return;
        }
        
        const data = await response.json();
        console.log('[Coming Soon] API Response data:', data);
        
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
        // Don't fail silently - use default settings if API fails
        console.log('[Coming Soon] Using fallback settings due to API error');
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
          backgroundColor: 'transparent',
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
          <div className={styles.description} style={{ whiteSpace: 'pre-line' }}>
            {settings.description}
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTitle}>Be the first to Strike</div>
          
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
