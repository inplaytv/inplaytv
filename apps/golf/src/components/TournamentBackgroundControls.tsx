'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import styles from './TournamentBackgroundControls.module.css';

interface BackgroundSettings {
  backgroundImage: string;
  opacity: number;
  overlay: number;
}

interface Props {
  currentSettings: BackgroundSettings;
  onSettingsChange: (settings: BackgroundSettings) => void;
}

export default function TournamentBackgroundControls({ currentSettings, onSettingsChange }: Props) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [settings, setSettings] = useState<BackgroundSettings>(currentSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const supabase = createClient();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  async function checkAdminStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsAdmin(false);
      return;
    }

    const { data } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    setIsAdmin(!!data);
  }

  const handleSettingChange = (key: keyof BackgroundSettings, value: string | number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/settings/tournament-background', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✓ Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`✗ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('✗ Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const defaultSettings = {
      backgroundImage: '/backgrounds/golf-course-green.jpg',
      opacity: 0.15,
      overlay: 0.4
    };
    setSettings(defaultSettings);
    onSettingsChange(defaultSettings);
  };

  // Available background images
  const backgroundOptions = [
    '/backgrounds/golf-course-green.jpg',
    '/backgrounds/golf-course-blue.jpg',
    '/backgrounds/golf-course-teal.jpg',
    '/backgrounds/golf-02.jpg',
    '/backgrounds/golf-03.jpg',
    '/backgrounds/inplay_bg-01.png',
    '/backgrounds/inplay_bg-02.png',
    '/backgrounds/inplay_bg-04.png'
  ];

  if (!isAdmin) {
    return null; // Don't show controls to non-admins
  }

  return (
    <>
      {/* Toggle Button - Fixed position */}
      <button
        className={styles.toggleButton}
        onClick={() => setShowControls(!showControls)}
        title="Background Controls (Admin Only)"
      >
        <i className={`fas fa-${showControls ? 'times' : 'sliders-h'}`}></i>
      </button>

      {/* Control Panel */}
      {showControls && (
        <div className={styles.controlPanel}>
          <div className={styles.panelHeader}>
            <h3>
              <i className="fas fa-image"></i>
              Background Controls
            </h3>
            <span className={styles.adminBadge}>ADMIN</span>
          </div>

          <div className={styles.panelBody}>
            {/* Background Image Selection */}
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>
                <i className="fas fa-image"></i>
                Background Image
              </label>
              <select
                className={styles.controlSelect}
                value={settings.backgroundImage}
                onChange={(e) => handleSettingChange('backgroundImage', e.target.value)}
              >
                {backgroundOptions.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg.split('/').pop()}
                  </option>
                ))}
              </select>
            </div>

            {/* Opacity Slider */}
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>
                <i className="fas fa-adjust"></i>
                Image Opacity: {(settings.opacity * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                className={styles.controlSlider}
                min="0"
                max="1"
                step="0.05"
                value={settings.opacity}
                onChange={(e) => handleSettingChange('opacity', parseFloat(e.target.value))}
              />
            </div>

            {/* Overlay Darkness Slider */}
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>
                <i className="fas fa-moon"></i>
                Overlay Darkness: {(settings.overlay * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                className={styles.controlSlider}
                min="0"
                max="1"
                step="0.05"
                value={settings.overlay}
                onChange={(e) => handleSettingChange('overlay', parseFloat(e.target.value))}
              />
            </div>

            {/* Preview */}
            <div className={styles.previewSection}>
              <div className={styles.previewLabel}>Preview:</div>
              <div 
                className={styles.previewBox}
                style={{
                  backgroundImage: `url(${settings.backgroundImage})`,
                  opacity: settings.opacity
                }}
              >
                <div 
                  className={styles.previewOverlay}
                  style={{
                    background: `rgba(0, 0, 0, ${settings.overlay})`
                  }}
                ></div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              <button
                className={styles.btnReset}
                onClick={handleReset}
                disabled={saving}
              >
                <i className="fas fa-undo"></i>
                Reset
              </button>
              <button
                className={styles.btnSave}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Save Settings
                  </>
                )}
              </button>
            </div>

            {/* Message */}
            {message && (
              <div className={`${styles.message} ${message.includes('✓') ? styles.success : styles.error}`}>
                {message}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
