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
  const [activeTab, setActiveTab] = useState<'tournaments' | 'general' | 'heroes'>('tournaments');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const tabs = [
    { id: 'tournaments' as const, label: 'Tournament Page', description: 'Backgrounds for tournament listing page' },
    { id: 'general' as const, label: 'General', description: 'General purpose background images' },
    { id: 'heroes' as const, label: 'Hero Sections', description: 'Large hero/banner images' }
  ];

  useEffect(() => {
    fetchBackgrounds();
    if (activeTab === 'tournaments') {
      fetchCurrentBackground();
    }
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
      const response = await fetch('/api/settings/tournament-background');
      const data = await response.json();
      setCurrentBackground(data.backgroundUrl);
    } catch (error) {
      console.error('Error fetching current background:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBackground = async (backgroundUrl: string) => {
    if (activeTab !== 'tournaments') {
      setNotification({ message: 'Background selection is only available for tournament page', type: 'error' });
      return;
    }

    setSaving(true);
    setNotification(null);
    
    try {
      // Extract just the filename from the admin URL
      const filename = backgroundUrl.split('/').pop();
      // Convert to golf app path
      const golfBackgroundUrl = `/backgrounds/${filename}`;
      
      const response = await fetch('/api/settings/tournament-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backgroundUrl: golfBackgroundUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentBackground(golfBackgroundUrl);
        setNotification({ message: 'Background updated successfully!', type: 'success' });
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

      {/* Current Background - Only show for tournaments */}
      {activeTab === 'tournaments' && (
        <div className={styles.currentBackground}>
          <h3>Current Tournament Background</h3>
          <div className={styles.currentPreview}>
            <img 
              src={currentBackground && currentBackground.startsWith('http') ? currentBackground : `http://localhost:3000${currentBackground || '/backgrounds/golf-course-green.jpg'}`} 
              alt="Current background"
              className={styles.currentImage}
            />
            <div className={styles.currentInfo}>
              <p><strong>URL:</strong> {currentBackground}</p>
            </div>
          </div>
        </div>
      )}

      <div className={styles.backgroundGrid}>
        <h3>Available {tabs.find(tab => tab.id === activeTab)?.label} Images ({backgrounds.length})</h3>
        <div className={styles.grid}>
          {backgrounds.map((bg) => {
            // For tournaments, bg.url is already /backgrounds/filename.jpg
            // For other categories, bg.url is /api/images/category/filename.jpg
            const isCurrentBackground = activeTab === 'tournaments' && currentBackground === bg.url;
            
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
                  
                  {activeTab === 'tournaments' ? (
                    <button
                      className={`${styles.selectButton} ${isCurrentBackground ? styles.current : ''}`}
                      onClick={() => updateBackground(bg.url)}
                      disabled={saving || isCurrentBackground}
                    >
                      {saving ? 'Updating...' : 
                       isCurrentBackground ? 'Current' : 'Select'}
                    </button>
                  ) : (
                    <button className={styles.previewButton}>
                      Preview
                    </button>
                  )}
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