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
    backgroundImage: '',
    logoText: 'InPlayTV',
    tagline: 'A new way to follow what matters.'
  });

  useEffect(() => {
    console.log('[Coming Soon] Component mounted, fetching settings...');
    
    const fetchSettings = async () => {
      try {
        console.log('[Coming Soon] Fetching settings from API...');
        const response = await fetch('/api/settings/coming-soon');
        console.log('[Coming Soon] API Response received, status:', response.status);
        
        const data = await response.json();
        console.log('[Coming Soon] API Response data:', data);
        console.log('[Coming Soon] Background Image from API:', data.backgroundImage);
        
        // Force update the settings
        console.log('[Coming Soon] Updating settings state...');
        setSettings({
          headline: data.headline || 'COMING SOON',
          description: data.description || 'Precision meets passion in a live, immersive format. Competition will never emerge the same.',
          backgroundImage: data.backgroundImage || '',
          logoText: data.logoText || 'InPlayTV',
          tagline: data.tagline || 'A new way to follow what matters.'
        });
        console.log('[Coming Soon] Settings state updated successfully');
        
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
      {console.log('[Coming Soon Render] Current settings state:', settings)}
      {console.log('[Coming Soon Render] Background Image value:', settings.backgroundImage)}
      
      {/* Show background image from state, with fallback for testing */}
      <div 
        className={styles.background} 
        style={{ 
          backgroundImage: `url('${settings.backgroundImage || '/backgrounds/golf-course-teal.jpg'}')`,
          opacity: 1,
          zIndex: 0
        }}
      />
      
      <div className={styles.noise} />
      
      <div className={styles.content}>
        <div className={styles.branding}>
          <div className={styles.logo}>{settings.logoText}</div>
          <div className={styles.tagline}>{settings.tagline}</div>
          {/* PREMIUM DESIGN v2.0 - Updated Dec 12, 2025 - Now database-driven */}
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
