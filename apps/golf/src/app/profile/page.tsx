'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import './profile.css';

interface ProfileData {
  name: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  date_of_birth: string;
  avatar_url: string | null;
  created_at: string;
}

interface TournamentStats {
  tournaments: number;
  wins: number;
  earnings: number;
}

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<TournamentStats>({ tournaments: 0, wins: 0, earnings: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDOB, setEditDOB] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailPasswordModal, setShowEmailPasswordModal] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Security settings states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginNotificationsEnabled, setLoginNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadProfile();
    loadStats();
    loadRecentActivity();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Parse name into first and last name
      const [firstName = '', lastName = ''] = (data?.name || '').split(' ');

      const profileData = {
        ...data,
        email: user.email || '',
        firstName,
        lastName,
        date_of_birth: data.date_of_birth || '',
      };

      setProfile(profileData);
      setEditFirstName(firstName);
      setEditLastName(lastName);
      setEditUsername(data.username || '');
      setEditEmail(user.email || '');
      setEditPhone(data.phone || '');
      setEditDOB(data.date_of_birth || '');
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    // TODO: Query tournament entries and results from database
    // For now, use placeholder data
    setStats({
      tournaments: 0,
      wins: 0,
      earnings: 0,
    });
  }

  async function loadRecentActivity() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load last 10 ledger entries
      const { data, error } = await supabase
        .from('ledger_overview')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Ledger error:', error);
        return;
      }

      setRecentActivity(data || []);
    } catch (err) {
      console.error('Error loading recent activity:', err);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveAccountInfo(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if username is unique (if changed)
      if (editUsername && editUsername !== profile?.username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', editUsername)
          .single();

        if (existingUser) {
          setError('Username is already taken. Please choose another one.');
          return;
        }
      }

      // Update profile fields
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: `${editFirstName} ${editLastName}`.trim(),
          username: editUsername || null,
          phone: editPhone,
          date_of_birth: editDOB,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // If email changed, require password confirmation
      if (editEmail !== profile?.email) {
        setShowEmailPasswordModal(true);
        return; // Don't close edit mode yet
      }

      await loadProfile();
      setEditMode(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    }
  }

  async function handleEmailChange() {
    setError('');

    if (!emailPassword) {
      setError('Please enter your password to confirm email change');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Not authenticated');

      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: emailPassword,
      });

      if (signInError) throw new Error('Incorrect password');

      // Update email
      const { error: emailError } = await supabase.auth.updateUser({
        email: editEmail,
      });

      if (emailError) throw emailError;

      alert('Verification email sent to your new email address. Please verify to complete the change.');
      setShowEmailPasswordModal(false);
      setEmailPassword('');
      setEditMode(false);
      await loadProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to update email');
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Not authenticated');

      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) throw new Error('Current password is incorrect');

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      alert('Password updated successfully');
      setShowChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    }
  }

  if (loading) {
    return (
      <div className="profile-container">
        <p style={{ textAlign: 'center', padding: '2rem', color: 'white' }}>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <p style={{ textAlign: 'center', padding: '2rem', color: 'white' }}>Profile not found</p>
      </div>
    );
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <>
      <Header />
      <div className="background-container"></div>
      
      <main className="profile-container">
        {/* Profile Header */}
        <section className="profile-header glass-card">
          <div className="profile-header-content">
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" />
                ) : (
                  <div className="avatar-placeholder">
                    {profile.firstName.charAt(0) || profile.email.charAt(0).toUpperCase()}
                  </div>
                )}
                <label className="avatar-edit-btn">
                  <i className="fas fa-camera"></i>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
            
            <div className="profile-info">
              <h1 className="profile-name">
                {profile.name || `${profile.firstName} ${profile.lastName}`.trim() || 'Anonymous User'}
              </h1>
              <p className="profile-email">{profile.email}</p>
              
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-value">{stats.tournaments}</span>
                  <span className="stat-label">Tournaments</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{stats.wins}</span>
                  <span className="stat-label">Wins</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">£{stats.earnings}</span>
                  <span className="stat-label">Earnings</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{memberSince}</span>
                  <span className="stat-label">Member Since</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Profile Content */}
        <div className="profile-content">
          {/* Left Column */}
          <div className="profile-left">
            {/* Account Information */}
            <section className="profile-section glass-card">
              <div className="section-header">
                <h2>
                  <i className="fas fa-user-circle"></i>
                  Account Information
                </h2>
                {!editMode && (
                  <button className="edit-btn" onClick={() => setEditMode(true)}>
                    <i className="fas fa-edit"></i>
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {!editMode ? (
                <div className="account-info">
                  <div className="info-group">
                    <label>First Name</label>
                    <span>{profile.firstName || 'Not set'}</span>
                  </div>
                  <div className="info-group">
                    <label>Last Name</label>
                    <span>{profile.lastName || 'Not set'}</span>
                  </div>
                  <div className="info-group">
                    <label>Email Address</label>
                    <span>{profile.email}</span>
                  </div>
                  <div className="info-group">
                    <label>Username</label>
                    <span>{profile.username || 'Not set'}</span>
                  </div>
                  <div className="info-group">
                    <label>Phone Number (Optional)</label>
                    <span>{profile.phone || 'Not set'}</span>
                  </div>
                  <div className="info-group">
                    <label>Date of Birth</label>
                    <span>
                      {profile.date_of_birth 
                        ? new Date(profile.date_of_birth).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          }) 
                        : 'Not set'}
                    </span>
                  </div>
                </div>
              ) : (
                <form className="account-edit-form" onSubmit={handleSaveAccountInfo}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="editFirstName">First Name</label>
                      <input
                        type="text"
                        id="editFirstName"
                        className="form-input"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="editLastName">Last Name</label>
                      <input
                        type="text"
                        id="editLastName"
                        className="form-input"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="editUsername">Username</label>
                    <input
                      type="text"
                      id="editUsername"
                      className="form-input"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="Choose a unique username"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="editEmail">Email Address</label>
                    <input
                      type="email"
                      id="editEmail"
                      className="form-input"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                    <small style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      Changing email will require password confirmation and email verification
                    </small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="editPhone">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      id="editPhone"
                      className="form-input"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="editDOB">Date of Birth</label>
                    <input
                      type="date"
                      id="editDOB"
                      className="form-input"
                      value={editDOB}
                      onChange={(e) => setEditDOB(e.target.value)}
                    />
                  </div>
                  
                  {error && (
                    <div className="error-message">{error}</div>
                  )}

                  <div className="form-actions">
                    <button type="button" className="btn secondary" onClick={() => setEditMode(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn primary">
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </section>

            {/* Security Settings */}
            <section className="profile-section glass-card">
              <div className="section-header">
                <h2>
                  <i className="fas fa-shield-alt"></i>
                  Security Settings
                </h2>
              </div>
              
              <div className="security-options">
                <div className="security-item">
                  <div className="security-info">
                    <h3>Password</h3>
                    <p>Change your account password</p>
                  </div>
                  <button className="btn secondary" onClick={() => setShowChangePasswordModal(true)}>
                    <i className="fas fa-key"></i>
                    Change Password
                  </button>
                </div>

                <div className="security-item">
                  <div className="security-info">
                    <h3>Two-Factor Authentication</h3>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={twoFactorEnabled}
                      onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="security-item">
                  <div className="security-info">
                    <h3>Login Notifications</h3>
                    <p>Get notified when someone signs into your account</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={loginNotificationsEnabled}
                      onChange={(e) => setLoginNotificationsEnabled(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="profile-right">
            {/* Fantasy Performance */}
            <section className="profile-section glass-card">
              <div className="section-header">
                <h2>
                  <i className="fas fa-chart-bar"></i>
                  Fantasy Performance
                </h2>
              </div>
              
              <div className="fantasy-stats">
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-trophy"></i>
                  </div>
                  <div className="stat-details">
                    <span className="stat-number">{stats.wins}</span>
                    <span className="stat-title">Tournament Wins</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-medal"></i>
                  </div>
                  <div className="stat-details">
                    <span className="stat-number">0</span>
                    <span className="stat-title">Top 10 Finishes</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Recent Activity */}
            <section className="profile-section glass-card">
              <div className="section-header">
                <h2>
                  <i className="fas fa-history"></i>
                  Recent Activity
                </h2>
              </div>
              
              <div className="activity-list">
                <p className="no-activity">No recent activity</p>
              </div>
            </section>
          </div>
        </div>

        {/* Change Password Modal */}
        {showChangePasswordModal && (
          <div className="modal-overlay" onClick={() => setShowChangePasswordModal(false)}>
            <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Change Password</h3>
                <button className="modal-close" onClick={() => setShowChangePasswordModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleChangePassword}>
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <div className="input-wrapper">
                      <i className="fas fa-lock input-icon"></i>
                      <input
                        type="password"
                        id="currentPassword"
                        className="form-input"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <div className="input-wrapper">
                      <i className="fas fa-lock input-icon"></i>
                      <input
                        type="password"
                        id="newPassword"
                        className="form-input"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="confirmNewPassword">Confirm New Password</label>
                    <div className="input-wrapper">
                      <i className="fas fa-lock input-icon"></i>
                      <input
                        type="password"
                        id="confirmNewPassword"
                        className="form-input"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="error-message">{error}</div>
                  )}
                  
                  <div className="modal-actions">
                    <button type="button" className="btn secondary" onClick={() => setShowChangePasswordModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn primary">
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Email Password Confirmation Modal */}
        {showEmailPasswordModal && (
          <div className="modal-overlay" onClick={() => setShowEmailPasswordModal(false)}>
            <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Confirm Email Change</h3>
                <button className="modal-close" onClick={() => setShowEmailPasswordModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <p style={{ marginBottom: '1.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Please enter your password to confirm changing your email to <strong>{editEmail}</strong>
                </p>
                <div className="form-group">
                  <label htmlFor="emailPassword">Current Password</label>
                  <div className="input-wrapper">
                    <i className="fas fa-lock input-icon"></i>
                    <input
                      type="password"
                      id="emailPassword"
                      className="form-input"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="error-message">{error}</div>
                )}
                
                <div className="modal-actions">
                  <button type="button" className="btn secondary" onClick={() => setShowEmailPasswordModal(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn primary" onClick={handleEmailChange}>
                    Confirm Change
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity Section */}
        <div className="profile-section glass-card">
          <div className="section-header">
            <div>
              <h2>Recent Activity</h2>
              <p className="section-subtitle">Your last 10 wallet transactions</p>
            </div>
          </div>

          {recentActivity.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              No activity yet
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                      Date
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                      Type
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                      Description
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((activity, idx) => (
                    <tr key={`${activity.source}-${activity.ref_id}-${idx}`} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                        {new Date(activity.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          background: activity.source === 'external' ? 'rgba(102, 126, 234, 0.2)' : 
                                     activity.source === 'withdrawal' ? 'rgba(245, 158, 11, 0.2)' : 
                                     'rgba(255,255,255,0.1)',
                          color: activity.source === 'external' ? '#667eea' : 
                                activity.source === 'withdrawal' ? '#f59e0b' : 
                                'rgba(255,255,255,0.8)',
                        }}>
                          {activity.source}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                        {activity.reason}
                      </td>
                      <td style={{
                        padding: '0.75rem',
                        textAlign: 'right',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: activity.amount_cents >= 0 ? '#66ea9e' : '#ff6b6b',
                      }}>
                        {activity.amount_cents >= 0 ? '+' : ''}£{(Math.abs(activity.amount_cents) / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
