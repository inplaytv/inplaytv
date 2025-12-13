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
    backgroundImage: '/backgrounds/golf-03.jpg',
    logoText: 'InPlayTV',
    tagline: 'A new way to follow what matters.'
  });

  useEffect(() => {
    // Fetch customizable settings from database
    fetch('/api/settings/coming-soon')
      .then(res => res.json())
      .then(data => {
        if (data.headline) setSettings(data);
      })
      .catch(() => {
        // Use default settings on error
      });
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
      <div 
        className={styles.background} 
        style={{ backgroundImage: `url('${settings.backgroundImage}')` }}
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
