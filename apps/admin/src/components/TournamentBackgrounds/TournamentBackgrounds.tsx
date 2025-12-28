'use client';

import { useState, useEffect } from 'react';
import styles from './TournamentBackgrounds.module.css';

interface BackgroundImage {
  filename: string;
  url: string;
  name: string;
  size: number;
}

export default function TournamentBackgrounds() {
  const [backgrounds, setBackgrounds] = useState<BackgroundImage[]>([]);
  const [currentBackground, setCurrentBackground] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'tournaments' | 'lobby' | 'entries' | 'leaderboards' | 'one2one'>('tournaments');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [pageBackgrounds, setPageBackgrounds] = useState<Record<string, string>>({});
  const [opacity, setOpacity] = useState<number>(0.15);
  const [overlay, setOverlay] = useState<number>(0.4);

  const tabs = [
    { id: 'tournaments' as const, label: 'Tournaments Page', description: 'Background for /tournaments page', pageKey: 'tournament_page_background' },
    { id: 'lobby' as const, label: 'Lobby/Home Page', description: 'Background for main lobby', pageKey: 'lobby_page_background' },
    { id: 'entries' as const, label: 'My Entries Page', description: 'Background for /entries page', pageKey: 'entries_page_background' },
    { id: 'leaderboards' as const, label: 'Leaderboards Page', description: 'Background for /leaderboards', pageKey: 'leaderboards_page_background' },
    { id: 'one2one' as const, label: 'ONE 2 ONE Page', description: 'Background for /one-2-one', pageKey: 'one2one_page_background' }
  ];

  useEffect(() => {
    fetchBackgrounds();
    fetchCurrentBackground();
  }, [activeTab]);

  const fetchBackgrounds = async () => {
    try {
      const response = await fetch(`/api/backgrounds?category=${activeTab}`);
      const data = await response.json();
      setBackgrounds(data.backgrounds || []);
    } catch (error) {
      console.error('Error fetching backgrounds:', error);
    }
  };

  const fetchCurrentBackground = async () => {
    try {
      const pageKey = tabs.find(t => t.id === activeTab)?.pageKey;
      if (!pageKey) return;
      
      const response = await fetch(`/api/settings/page-background?page=${pageKey}`);
      const data = await response.json();
      setCurrentBackground(data.backgroundUrl || '');
      setPageBackgrounds(prev => ({ ...prev, [pageKey]: data.backgroundUrl || '' }));
      setOpacity(data.opacity ?? 0.15);
      setOverlay(data.overlay ?? 0.4);
    } catch (error) {
      console.error('Error fetching current background:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBackground = async (backgroundUrl: string) => {
    const pageKey = tabs.find(t => t.id === activeTab)?.pageKey;
    if (!pageKey) {
      setNotification({ message: 'Invalid page selection', type: 'error' });
      return;
    }

    setSaving(true);
    setNotification(null);
    
    try {
      // Extract just the filename from the admin URL
      const filename = backgroundUrl.split('/').pop();
      // Convert to golf app path
      const golfBackgroundUrl = `/backgrounds/${filename}`;
      
      const response = await fetch('/api/settings/page-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          pageKey,
          backgroundUrl: golfBackgroundUrl,
          opacity,
          overlay
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentBackground(golfBackgroundUrl);
        setPageBackgrounds(prev => ({ ...prev, [pageKey]: golfBackgroundUrl }));
        setNotification({ message: `${tabs.find(t => t.id === activeTab)?.label} background updated!`, type: 'success' });
      } else {
        setNotification({ message: data.error || 'Failed to update background', type: 'error' });
      }
    } catch (error) {
      console.error('Error updating background:', error);
      setNotification({ message: 'Error updating background', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading backgrounds...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Background Image Management</h2>
        <p>Organize and manage background images by category</p>
        
        {/* Notification */}
        {notification && (
          <div className={`${styles.notification} ${styles[notification.type]}`}>
            {notification.message}
            <button 
              className={styles.closeNotification} 
              onClick={() => setNotification(null)}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Description */}
      <div className={styles.tabDescription}>
        {tabs.find(tab => tab.id === activeTab)?.description}
      </div>

      {/* Overlay Controls */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Background Opacity: {(opacity * 100).toFixed(0)}%</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className={styles.slider}
          />
        </div>
        <div className={styles.controlGroup}>
          <label>Dark Overlay: {(overlay * 100).toFixed(0)}%</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05"
            value={overlay}
            onChange={(e) => setOverlay(parseFloat(e.target.value))}
            className={styles.slider}
          />
        </div>
        <button
          className={styles.applyButton}
          onClick={() => updateBackground(currentBackground)}
          disabled={saving}
        >
          {saving ? 'Applying...' : 'Apply Changes'}
        </button>
        <button
          className={styles.removeButton}
          onClick={() => updateBackground('none')}
          disabled={saving || currentBackground === 'none'}
        >
          {currentBackground === 'none' ? '✓ No Background' : 'Remove Background'}
        </button>
      </div>

      {/* Current Background */}
      {
        <div className={styles.currentBackground}>
          <h3>Current {tabs.find(tab => tab.id === activeTab)?.label} Background</h3>
          {currentBackground === 'none' ? (
            <div className={styles.noBackground}>
              <i className="fas fa-ban" style={{ fontSize: '48px', opacity: 0.3 }}></i>
              <p>No background image</p>
            </div>
          ) : (
            <div className={styles.currentPreview}>
              <img 
                src={currentBackground && currentBackground.startsWith('http') ? currentBackground : `http://localhost:3000${currentBackground || '/backgrounds/golf-course-green.jpg'}`} 
                alt="Current background"
                className={styles.currentImage}
                style={{ opacity: opacity }}
              />
              <div className={styles.overlay} style={{ opacity: overlay }}></div>
              <div className={styles.currentInfo}>
                <p><strong>URL:</strong> {currentBackground}</p>
                <p><strong>Opacity:</strong> {(opacity * 100).toFixed(0)}% | <strong>Overlay:</strong> {(overlay * 100).toFixed(0)}%</p>
              </div>
            </div>
          )}
        </div>
      }

      <div className={styles.backgroundGrid}>
        <h3>Available {tabs.find(tab => tab.id === activeTab)?.label} Images ({backgrounds.length})</h3>
        <div className={styles.grid}>
          {backgrounds.map((bg) => {
            // bg.url is already /backgrounds/filename.jpg
            const isCurrentBackground = currentBackground === bg.url;
            
            return (
              <div 
                key={bg.filename}
                className={`${styles.backgroundCard} ${isCurrentBackground ? styles.selected : ''}`}
              >
                <div className={styles.imageContainer}>
                  <img 
                    src={bg.url} 
                    alt={bg.name}
                    className={styles.backgroundImage}
                  />
                  {isCurrentBackground && (
                    <div className={styles.selectedBadge}>
                      <i className="fas fa-check"></i>
                    </div>
                  )}
                </div>
                
                <div className={styles.backgroundInfo}>
                  <h4>{bg.name}</h4>
                  <p className={styles.filename}>{bg.filename}</p>
                  <p className={styles.size}>
                    {(bg.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  <button
                    className={`${styles.selectButton} ${isCurrentBackground ? styles.current : ''}`}
                    onClick={() => updateBackground(bg.url)}
                    disabled={saving || isCurrentBackground}
                  >
                    {saving ? 'Updating...' : 
                     isCurrentBackground ? 'Current' : 'Select'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {backgrounds.length === 0 && (
        <div className={styles.noBackgrounds}>
          <p>No background images found in /{activeTab} directory</p>
        </div>
      )}
    </div>
  );
}