'use client';

import { useState, useEffect } from 'react';

interface SecurityPolicy {
  id: string;
  policy_name: string;
  require_mfa_for_all: boolean;
  require_email_verification: boolean;
  mfa_grace_period_days: number;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  session_timeout_hours: number;
  force_password_change_days: number;
  minimum_password_length: number;
  require_special_characters: boolean;
  updated_at: string;
}

export default function SecuritySettingsPage() {
  const [policy, setPolicy] = useState<SecurityPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/security/policy');
      if (!response.ok) throw new Error('Failed to fetch policy');
      const data = await response.json();
      setPolicy(data);
    } catch (err: any) {
      console.error('Error fetching security policy:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policy) return;

    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/security/policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policy),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update policy');
      }

      const result = await response.json();
      setPolicy(result);
      setMessage({ type: 'success', text: 'Security policy updated successfully!' });
    } catch (err: any) {
      console.error('Error updating policy:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const updatePolicy = (key: keyof SecurityPolicy, value: any) => {
    if (!policy) return;
    setPolicy({ ...policy, [key]: value });
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', color: '#888', textAlign: 'center' }}>
        Loading security settings...
      </div>
    );
  }

  if (!policy) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{
          background: '#1e1e1e',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center',
          color: '#ef4444',
        }}>
          <p style={{ marginBottom: '1rem' }}>Failed to load security policy</p>
          <p style={{ fontSize: '0.875rem', color: '#888' }}>
            Make sure you've run the setup-user-security-mfa.sql script in Supabase
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>
          Security Settings
        </h1>
        <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.875rem' }}>
          Configure global security policies for all users
        </p>

        {message && (
          <div style={{
            padding: '1rem',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '6px',
            color: message.type === 'success' ? '#10b981' : '#ef4444',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Multi-Factor Authentication */}
          <div style={{
            background: '#1e1e1e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: '#fff' }}>
              Multi-Factor Authentication
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input
                  type="checkbox"
                  checked={policy.require_mfa_for_all}
                  onChange={(e) => updatePolicy('require_mfa_for_all', e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ color: '#fff', fontWeight: 500 }}>Require MFA for All Users</div>
                  <div style={{ color: '#888', fontSize: '0.875rem' }}>
                    Force all users to enable multi-factor authentication
                  </div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input
                  type="checkbox"
                  checked={policy.require_email_verification}
                  onChange={(e) => updatePolicy('require_email_verification', e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ color: '#fff', fontWeight: 500 }}>Require Email Verification</div>
                  <div style={{ color: '#888', fontSize: '0.875rem' }}>
                    Users must verify their email before accessing the system
                  </div>
                </div>
              </label>

              <div>
                <label style={{ display: 'block', color: '#fff', fontWeight: 500, marginBottom: '0.5rem' }}>
                  MFA Grace Period (Days)
                </label>
                <input
                  type="number"
                  value={policy.mfa_grace_period_days}
                  onChange={(e) => updatePolicy('mfa_grace_period_days', parseInt(e.target.value))}
                  min="0"
                  max="90"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                  }}
                />
                <div style={{ color: '#888', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Days users have to set up MFA after it becomes required
                </div>
              </div>
            </div>
          </div>

          {/* Login Security */}
          <div style={{
            background: '#1e1e1e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: '#fff' }}>
              Login Security
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', color: '#fff', fontWeight: 500, marginBottom: '0.5rem' }}>
                  Max Login Attempts
                </label>
                <input
                  type="number"
                  value={policy.max_login_attempts}
                  onChange={(e) => updatePolicy('max_login_attempts', parseInt(e.target.value))}
                  min="3"
                  max="10"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                  }}
                />
                <div style={{ color: '#888', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Failed login attempts before account lockout
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#fff', fontWeight: 500, marginBottom: '0.5rem' }}>
                  Lockout Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={policy.lockout_duration_minutes}
                  onChange={(e) => updatePolicy('lockout_duration_minutes', parseInt(e.target.value))}
                  min="5"
                  max="1440"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                  }}
                />
                <div style={{ color: '#888', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  How long to lock out accounts after max attempts
                </div>
              </div>
            </div>
          </div>

          {/* Session Management */}
          <div style={{
            background: '#1e1e1e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: '#fff' }}>
              Session Management
            </h2>

            <div>
              <label style={{ display: 'block', color: '#fff', fontWeight: 500, marginBottom: '0.5rem' }}>
                Session Timeout (Hours)
              </label>
              <input
                type="number"
                value={policy.session_timeout_hours}
                onChange={(e) => updatePolicy('session_timeout_hours', parseInt(e.target.value))}
                min="1"
                max="168"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#2a2a2a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.875rem',
                }}
              />
              <div style={{ color: '#888', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Automatically log out inactive users after this duration
              </div>
            </div>
          </div>

          {/* Password Requirements */}
          <div style={{
            background: '#1e1e1e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: '#fff' }}>
              Password Requirements
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', color: '#fff', fontWeight: 500, marginBottom: '0.5rem' }}>
                  Minimum Password Length
                </label>
                <input
                  type="number"
                  value={policy.minimum_password_length}
                  onChange={(e) => updatePolicy('minimum_password_length', parseInt(e.target.value))}
                  min="6"
                  max="32"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input
                  type="checkbox"
                  checked={policy.require_special_characters}
                  onChange={(e) => updatePolicy('require_special_characters', e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ color: '#fff', fontWeight: 500 }}>Require Special Characters</div>
                  <div style={{ color: '#888', fontSize: '0.875rem' }}>
                    Passwords must contain at least one special character
                  </div>
                </div>
              </label>

              <div>
                <label style={{ display: 'block', color: '#fff', fontWeight: 500, marginBottom: '0.5rem' }}>
                  Force Password Change (Days)
                </label>
                <input
                  type="number"
                  value={policy.force_password_change_days}
                  onChange={(e) => updatePolicy('force_password_change_days', parseInt(e.target.value))}
                  min="0"
                  max="365"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                  }}
                />
                <div style={{ color: '#888', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Set to 0 to disable periodic password changes
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={fetchPolicy}
              disabled={saving}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#2a2a2a',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '0.75rem 1.5rem',
                background: saving ? '#666' : '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Last Updated */}
        {policy.updated_at && (
          <div style={{ marginTop: '1rem', textAlign: 'right', color: '#666', fontSize: '0.75rem' }}>
            Last updated: {new Date(policy.updated_at).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
