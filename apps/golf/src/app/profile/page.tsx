'use client';

import { createClient } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import Header from '@/components/Header';
import UserAvatar from '@/components/UserAvatar';

export const dynamic = 'force-dynamic';

function ProfilePageContent() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setName(profileData.name || '');
      setAvatarUrl(profileData.avatar_url || '');
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${user.id}/${fileName}`;

    setUploading(true);
    setError('');

    try {
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
      setMessage('Avatar uploaded! Click Save to apply.');
    } catch (err: any) {
      setError('Failed to upload avatar: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!user) return;
    setError('');
    setMessage('');

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        avatar_url: avatarUrl,
      })
      .eq('id', user.id);

    if (updateError) {
      setError('Failed to save: ' + updateError.message);
    } else {
      setMessage('Profile updated successfully!');
      loadProfile();
    }
  }

  return (
    <>
      <Header />
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', color: '#fff' }}>
          My Profile
        </h1>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '2rem',
        }}>
          {/* Avatar Section */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <UserAvatar
              avatarUrl={avatarUrl}
              name={name}
              email={user?.email}
              size={120}
            />
            <div style={{ marginTop: '1rem' }}>
              <label style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                background: 'rgba(102, 126, 234, 0.2)',
                border: '1px solid rgba(102, 126, 234, 0.4)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: '#fff',
              }}>
                {uploading ? 'Uploading...' : '📷 Change Avatar'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>
              Avatar is publicly visible
            </p>
          </div>

          {/* Email (Read-only) */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#fff' }}>
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.9rem',
                cursor: 'not-allowed',
              }}
            />
          </div>

          {/* Name */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#fff' }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {/* Messages */}
          {message && (
            <div style={{
              background: 'rgba(102, 234, 158, 0.1)',
              border: '1px solid rgba(102, 234, 158, 0.3)',
              borderRadius: '6px',
              padding: '0.75rem',
              marginBottom: '1rem',
              color: '#66ea9e',
              fontSize: '0.875rem',
            }}>
              {message}
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: '6px',
              padding: '0.75rem',
              marginBottom: '1rem',
              color: '#ff6b6b',
              fontSize: '0.875rem',
            }}>
              {error}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfilePageContent />
    </RequireAuth>
  );
}
