'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import styles from './tournament-background.module.css';

interface PlatformImage {
  id: string;
  filename: string;
  public_url: string;
  width: number | null;
  height: number | null;
}

interface BackgroundSettings {
  id?: string;
  image_url: string;
  opacity: number;
  overlay: number;
}

export default function TournamentBackgroundPage() {
  const [settings, setSettings] = useState<BackgroundSettings>({
    image_url: '',
    opacity: 0.15,
    overlay: 0.4
  });
  const [images, setImages] = useState<PlatformImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch background images
      const { data: imageData, error: imageError } = await supabase
        .from('platform_images')
        .select('id, filename, public_url, width, height')
        .eq('category', 'tournament_background')
        .order('created_at', { ascending: false });

      if (imageError) throw imageError;
      setImages(imageData || []);

      // Fetch current settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('tournament_background_settings')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

      if (settingsData) {
        setSettings({
          id: settingsData.id,
          image_url: settingsData.image_url,
          opacity: parseFloat(settingsData.opacity),
          overlay: parseFloat(settingsData.overlay)
        });
        setSelectedImageId(settingsData.image_id || '');
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (image: PlatformImage) => {
    setSelectedImageId(image.id);
    setSettings({
      ...settings,
      image_url: image.public_url
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      if (!settings.image_url) {
        setMessage({ type: 'error', text: 'Please select an image' });
        return;
      }

      // Deactivate all existing settings
      await supabase
        .from('tournament_background_settings')
        .update({ is_active: false })
        .eq('is_active', true);

      // Insert new active setting
      const { error } = await supabase
        .from('tournament_background_settings')
        .insert({
          image_id: selectedImageId || null,
          image_url: settings.image_url,
          opacity: settings.opacity,
          overlay: settings.overlay,
          is_active: true
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Background settings saved successfully!' });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleCustomUrl = () => {
    const url = prompt('Enter custom image URL:');
    if (url) {
      setSelectedImageId('');
      setSettings({
        ...settings,
        image_url: url
      });
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Tournament Page Background</h1>
          <p>Configure the fullscreen background for http://localhost:3003/tournaments</p>
        </div>
        <button 
          onClick={handleSave}
          className={styles.saveBtn}
          disabled={saving || !settings.image_url}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.layout}>
        {/* Left: Settings */}
        <div className={styles.settings}>
          <h2>Background Settings</h2>

          <div className={styles.formGroup}>
            <label>Image Opacity: {Math.round(settings.opacity * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.opacity}
              onChange={(e) => setSettings({ ...settings, opacity: parseFloat(e.target.value) })}
              className={styles.slider}
            />
            <div className={styles.sliderLabels}>
              <span>Transparent</span>
              <span>Opaque</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Dark Overlay: {Math.round(settings.overlay * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.overlay}
              onChange={(e) => setSettings({ ...settings, overlay: parseFloat(e.target.value) })}
              className={styles.slider}
            />
            <div className={styles.sliderLabels}>
              <span>No Overlay</span>
              <span>Full Dark</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Selected Image URL</label>
            <input
              type="text"
              value={settings.image_url}
              readOnly
              className={styles.input}
              placeholder="Select an image below"
            />
            <button onClick={handleCustomUrl} className={styles.customBtn}>
              Or Enter Custom URL
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className={styles.preview}>
          <h3>Live Preview</h3>
          <div className={styles.previewBox}>
            <div
              className={styles.previewBg}
              style={{
                backgroundImage: `url(${settings.image_url})`,
                opacity: settings.opacity
              }}
            />
            <div
              className={styles.previewOverlay}
              style={{
                background: `rgba(0, 0, 0, ${settings.overlay})`
              }}
            />
            <div className={styles.previewContent}>
              <h4>Tournament Selection</h4>
              <p>This is how your background will appear</p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Library */}
      <div className={styles.library}>
        <div className={styles.libraryHeader}>
          <h2>Select Background Image</h2>
          <a href="/settings/images" className={styles.manageLink}>
            Manage Images Library →
          </a>
        </div>

        {images.length === 0 ? (
          <div className={styles.empty}>
            <p>No tournament background images found</p>
            <a href="/settings/images" className={styles.uploadBtn}>
              Upload Images
            </a>
          </div>
        ) : (
          <div className={styles.grid}>
            {images.map(image => (
              <div
                key={image.id}
                className={`${styles.imageCard} ${selectedImageId === image.id ? styles.selected : ''}`}
                onClick={() => handleImageSelect(image)}
              >
                <img src={image.public_url} alt={image.filename} />
                <div className={styles.imageInfo}>
                  <div className={styles.imageName}>{image.filename}</div>
                  {image.width && image.height && (
                    <div className={styles.imageDims}>{image.width}×{image.height}</div>
                  )}
                </div>
                {selectedImageId === image.id && (
                  <div className={styles.selectedBadge}>✓ Selected</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
