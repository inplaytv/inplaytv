'use client';

import { useState, useEffect } from 'react';

type MaintenanceMode = 'live' | 'coming-soon' | 'maintenance';

interface ComingSoonSettings {
  headline: string;
  description: string;
  backgroundImage: string;
  logoText: string;
  tagline: string;
}

export default function SiteSettingsPage() {
  const [mode, setMode] = useState<MaintenanceMode>('live');
  const [comingSoon, setComingSoon] = useState<ComingSoonSettings>({
    headline: 'COMING SOON',
    description: '',
    backgroundImage: '',
    logoText: 'InPlayTV',
    tagline: 'A new way to follow what matters.'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [modeRes, csRes] = await Promise.all([
        fetch('/api/settings/site'),
        fetch('/api/settings/coming-soon')
      ]);
      
      if (modeRes.ok) {
        const data = await modeRes.json();
        setMode(data.maintenance_mode || 'live');
      }
      
      if (csRes.ok) {
        const data = await csRes.json();
        setComingSoon(data);
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (newMode: MaintenanceMode) => {
    try {
      console.log('[Site Settings] Saving mode:', newMode);
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/settings/site', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenance_mode: newMode }),
      });

      console.log('[Site Settings] Response status:', response.status);
      
      const result = await response.json();
      console.log('[Site Settings] Response data:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update settings');
      }

      setMode(newMode);
      setMessage({ type: 'success', text: `Site mode changed to: ${newMode.toUpperCase()}` });
      console.log('[Site Settings] Mode updated successfully');
    } catch (err: any) {
      console.error('[Site Settings] Error updating settings:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveComingSoon = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/settings/coming-soon', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comingSoon),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update coming soon settings');
      }

      setMessage({ type: 'success', text: 'Coming soon page updated successfully!' });
    } catch (err: any) {
      console.error('[Site Settings] Error updating coming soon:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleClearBackgroundImage = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const updatedSettings = { ...comingSoon, backgroundImage: '' };
      setComingSoon(updatedSettings);

      const response = await fetch('/api/settings/coming-soon', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to clear background image');
      }

      setMessage({ type: 'success', text: 'Background image cleared successfully!' });
    } catch (err: any) {
      console.error('[Site Settings] Error clearing background image:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', color: '#888', textAlign: 'center' }}>
        Loading site settings...
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>
          Site Settings
        </h1>
        <p style={{ color: '#888', marginBottom: '2rem' }}>
          Control the maintenance mode for the public website
        </p>

        {/* Maintenance Mode Section */}
        <div style={{
          background: '#1e1e1e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#fff' }}>
            Maintenance Mode
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Live Mode */}
            <button
              onClick={() => handleSave('live')}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: '1rem',
                background: mode === 'live' ? 'rgba(16, 185, 129, 0.2)' : '#2a2a2a',
                border: mode === 'live' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
              }}
            >
              <div style={{ marginRight: '1rem', fontSize: '2rem' }}>🟢</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>
                  Live {mode === 'live' && <span style={{ color: '#10b981' }}>• Active</span>}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#888' }}>
                  Website is fully operational. Users can sign up, login, and access all features.
                </div>
              </div>
            </button>

            {/* Coming Soon Mode */}
            <button
              onClick={() => handleSave('coming-soon')}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: '1rem',
                background: mode === 'coming-soon' ? 'rgba(251, 191, 36, 0.2)' : '#2a2a2a',
                border: mode === 'coming-soon' ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
              }}
            >
              <div style={{ marginRight: '1rem', fontSize: '2rem' }}>🚀</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>
                  Coming Soon {mode === 'coming-soon' && <span style={{ color: '#fbbf24' }}>• Active</span>}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#888' }}>
                  Shows "Coming Soon" message. Disables signup and login for new users.
                </div>
              </div>
            </button>

            {/* Maintenance Mode */}
            <button
              onClick={() => handleSave('maintenance')}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: '1rem',
                background: mode === 'maintenance' ? 'rgba(239, 68, 68, 0.2)' : '#2a2a2a',
                border: mode === 'maintenance' ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
              }}
            >
              <div style={{ marginRight: '1rem', fontSize: '2rem' }}>🔧</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>
                  Under Maintenance {mode === 'maintenance' && <span style={{ color: '#ef4444' }}>• Active</span>}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#888' }}>
                  Shows maintenance page. All public access disabled except for admins.
                </div>
              </div>
            </button>
          </div>

          {/* Message */}
          {message && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: message.type === 'success' 
                ? 'rgba(16, 185, 129, 0.2)' 
                : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
              borderRadius: '6px',
              color: message.type === 'success' ? '#10b981' : '#ef4444',
              fontSize: '0.875rem',
            }}>
              {message.text}
            </div>
          )}

          {/* Info Box */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '6px',
            fontSize: '0.875rem',
            color: '#888',
          }}>
            <div style={{ fontWeight: 600, color: '#3b82f6', marginBottom: '0.5rem' }}>ℹ️ Preview Mode</div>
            <div style={{ marginBottom: '0.75rem' }}>
              To preview the coming soon or maintenance pages on localhost (http://localhost:3000), add <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>?preview=coming-soon</code> or <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>?preview=maintenance</code> to the URL.
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a 
                href="http://localhost:3000?preview=coming-soon" 
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: '6px',
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
              >
                👁️ Preview Coming Soon
              </a>
              <a 
                href="http://localhost:3000?preview=maintenance" 
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '6px',
                  color: '#ef4444',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
              >
                🔧 Preview Maintenance
              </a>
              <a 
                href="http://localhost:3000" 
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '6px',
                  color: '#10b981',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'}
              >
                🌐 Normal Website
              </a>
            </div>
          </div>
        </div>

        {/* Coming Soon Page Customization */}
        <div style={{
          background: '#1e1e1e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginTop: '2rem',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#fff' }}>
            Coming Soon Page Customization
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#888', marginBottom: '1.5rem' }}>
            Customize the content and appearance of the coming soon page
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Headline */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#ccc', marginBottom: '0.5rem', fontWeight: 500 }}>
                Headline
              </label>
              <input
                type="text"
                value={comingSoon.headline}
                onChange={(e) => setComingSoon({ ...comingSoon, headline: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#2a2a2a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.875rem',
                }}
                placeholder="COMING SOON"
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#ccc', marginBottom: '0.5rem', fontWeight: 500 }}>
                Description
              </label>
              <textarea
                value={comingSoon.description}
                onChange={(e) => setComingSoon({ ...comingSoon, description: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#2a2a2a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                }}
                placeholder="Precision meets passion..."
              />
            </div>

            {/* Background Image */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: '#ccc', marginBottom: '0.5rem', fontWeight: 500 }}>
                Background Image URL
              </label>
              <input
                type="text"
                value={comingSoon.backgroundImage}
                onChange={(e) => setComingSoon({ ...comingSoon, backgroundImage: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#2a2a2a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.875rem',
                }}
                placeholder="/backgrounds/golf-03.jpg (leave blank for no image)"
              />
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                Available: /backgrounds/golf-02.jpg, golf-03.jpg, golf-course-blue.jpg, golf-course-green.jpg, golf-course-teal.jpg
              </div>
            </div>

            {/* Logo Text */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#ccc', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Logo Text
                </label>
                <input
                  type="text"
                  value={comingSoon.logoText}
                  onChange={(e) => setComingSoon({ ...comingSoon, logoText: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                  }}
                  placeholder="InPlayTV"
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#ccc', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Tagline
                </label>
                <input
                  type="text"
                  value={comingSoon.tagline}
                  onChange={(e) => setComingSoon({ ...comingSoon, tagline: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                  }}
                  placeholder="A new way to follow what matters."
                />
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button
                onClick={handleSaveComingSoon}
                disabled={saving}
                style={{
                  padding: '0.875rem 1.5rem',
                  background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.9), rgba(6, 182, 212, 0.9))',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              
              <button
                onClick={handleClearBackgroundImage}
                disabled={saving}
                style={{
                  padding: '0.875rem 1.5rem',
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {saving ? 'Clearing...' : 'Clear Background'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
