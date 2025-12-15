'use client';

import { useState, useEffect } from 'react';
import styles from './admin-backgrounds.module.css';

interface BackgroundSettings {
  backgroundImage: string;
  opacity: number;
  overlay: number;
}

export default function AdminBackgroundsPage() {
  const [settings, setSettings] = useState<BackgroundSettings>({
    backgroundImage: '',
    opacity: 0.15,
    overlay: 0.4
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [previewImage, setPreviewImage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/backgrounds');
      const result = await response.json();
      
      if (result.success) {
        setSettings(result.data);
        setPreviewImage(result.data.backgroundImage);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to fetch settings' });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to fetch background settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/admin/backgrounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Background updated successfully!' });
        setPreviewImage(settings.backgroundImage);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update background' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save background settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (value: string) => {
    setSettings({ ...settings, backgroundImage: value });
    setPreviewImage(value);
  };

  const presetImages = [
    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2070',
    'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?q=80&w=2070',
    'https://images.unsplash.com/photo-1592919505780-303950717480?q=80&w=2070',
    'https://images.unsplash.com/photo-1596727147705-61a532a659bd?q=80&w=2070',
    'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2070'
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading background settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Tournament Page Background Settings</h1>
        <p>Manage the background image and overlays for the tournament selection page</p>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.grid}>
        {/* Settings Panel */}
        <div className={styles.settingsPanel}>
          <h2>Background Settings</h2>
          
          <div className={styles.formGroup}>
            <label htmlFor="backgroundImage">Background Image URL</label>
            <input
              type="text"
              id="backgroundImage"
              value={settings.backgroundImage}
              onChange={(e) => handleImageChange(e.target.value)}
              placeholder="Enter image URL..."
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="opacity">Image Opacity: {Math.round(settings.opacity * 100)}%</label>
            <input
              type="range"
              id="opacity"
              min="0"
              max="1"
              step="0.01"
              value={settings.opacity}
              onChange={(e) => setSettings({ ...settings, opacity: parseFloat(e.target.value) })}
              className={styles.slider}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="overlay">Dark Overlay: {Math.round(settings.overlay * 100)}%</label>
            <input
              type="range"
              id="overlay"
              min="0"
              max="1"
              step="0.01"
              value={settings.overlay}
              onChange={(e) => setSettings({ ...settings, overlay: parseFloat(e.target.value) })}
              className={styles.slider}
            />
          </div>

          <div className={styles.presets}>
            <h3>Preset Golf Course Images</h3>
            <div className={styles.presetGrid}>
              {presetImages.map((url, index) => (
                <div
                  key={index}
                  className={`${styles.presetImage} ${settings.backgroundImage === url ? styles.active : ''}`}
                  onClick={() => handleImageChange(url)}
                >
                  <img src={url} alt={`Preset ${index + 1}`} />
                  <div className={styles.overlay}>
                    <i className="fas fa-check"></i>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              onClick={handleSave}
              disabled={saving || !settings.backgroundImage}
              className={styles.saveButton}
            >
              {saving ? (
                <>
                  <div className={styles.buttonSpinner}></div>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className={styles.previewPanel}>
          <h2>Live Preview</h2>
          <div
            className={styles.preview}
            style={{
              backgroundImage: `url(${previewImage})`,
              opacity: settings.opacity,
            }}
          >
            <div
              className={styles.previewOverlay}
              style={{
                background: `rgba(0, 0, 0, ${settings.overlay})`
              }}
            >
              <div className={styles.previewContent}>
                <h3>Tournament Selection</h3>
                <div className={styles.previewStats}>
                  <div className={styles.previewStat}>
                    <div className={styles.previewStatValue}>5</div>
                    <div className={styles.previewStatLabel}>Active Tournaments</div>
                  </div>
                  <div className={styles.previewStat}>
                    <div className={styles.previewStatValue}>£85.0K</div>
                    <div className={styles.previewStatLabel}>Total Prize Pool</div>
                  </div>
                </div>
                <div className={styles.previewCard}>
                  <h4>Featured Tournament</h4>
                  <p>This is how your background will look behind the tournament cards</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}