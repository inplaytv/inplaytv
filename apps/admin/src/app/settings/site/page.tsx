'use client';

import { useState, useEffect } from 'react';

type MaintenanceMode = 'live' | 'coming-soon' | 'maintenance';

export default function SiteSettingsPage() {
  const [mode, setMode] = useState<MaintenanceMode>('live');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/site');
      if (!response.ok) throw new Error('Failed to fetch settings');
      
      const data = await response.json();
      setMode(data.maintenance_mode || 'live');
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
          }}>
            <div style={{ fontSize: '0.875rem', color: '#60a5fa', marginBottom: '0.5rem', fontWeight: 600 }}>
              ℹ️ Note
            </div>
            <div style={{ fontSize: '0.875rem', color: '#888' }}>
              Admins can always access the admin panel regardless of the site mode.
              Changes take effect immediately across all pages.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
