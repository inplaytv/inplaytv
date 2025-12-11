# User Security & MFA System Implementation Guide

## 🎯 Overview
Complete user security management system for admin panel with:
- ✅ Enable/Disable user accounts (ban/unban)
- ✅ Delete user accounts permanently
- ✅ Two-Factor Authentication (2FA) per user
- ✅ Email verification code for login (MFA)
- ✅ Admin control over global security policies

## 📋 Setup Steps

### 1. Run Database Setup Script
Execute `scripts/setup-user-security-mfa.sql` in Supabase SQL Editor

This creates:
- `user_security_settings` - Per-user MFA settings
- `mfa_verification_codes` - Temporary login codes
- `admin_security_policies` - Global security rules
- `user_login_attempts` - Track failed logins
- `user_sessions` - Track active sessions

### 2. API Endpoints Created

#### Toggle User MFA
**POST** `/api/users/[id]/toggle-mfa`
```json
{
  "mfa_enabled": true,
  "mfa_method": "email"  // 'email', 'totp', 'sms'
}
```

#### Get User Security Settings
**GET** `/api/users/[id]/security`
Returns:
- MFA status
- Recent login attempts
- Active sessions

#### Global Security Policy
**GET** `/api/security/policy`
**PUT** `/api/security/policy`
```json
{
  "require_mfa_for_all": false,
  "require_email_verification": true,
  "max_login_attempts": 5,
  "lockout_duration_minutes": 30,
  "session_timeout_hours": 24
}
```

### 3. Admin UI Features

#### User Management Page
Location: `apps/admin/src/app/users/page.tsx`

**Existing Features:**
- Search users by name, email, username, phone
- View user details (profile, wallet balance, admin status)
- Ban/Unban user accounts
- Delete user accounts (with confirmation)
- View recent activity

**New Features to Add:**
1. **MFA Toggle Switch** - Enable/disable 2FA per user
2. **Security Badge** - Show if user has MFA enabled
3. **Login History** - View failed/successful login attempts
4. **Active Sessions** - View and revoke user sessions
5. **Security Tab** - Dedicated security settings view

### 4. Enhancing UsersList Component

Add to the user detail modal:

```tsx
// Add MFA toggle
const [mfaEnabled, setMfaEnabled] = useState(false);
const [loadingSecurity, setLoadingSecurity] = useState(false);

// Fetch security settings when modal opens
useEffect(() => {
  if (selectedUser) {
    fetchSecuritySettings(selectedUser.id);
  }
}, [selectedUser]);

const fetchSecuritySettings = async (userId: string) => {
  setLoadingSecurity(true);
  const res = await fetch(`/api/users/${userId}/security`);
  const data = await res.json();
  setMfaEnabled(data.security_settings?.mfa_enabled || false);
  setLoadingSecurity(false);
};

const handleToggleMFA = async () => {
  const res = await fetch(`/api/users/${selectedUser.id}/toggle-mfa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      mfa_enabled: !mfaEnabled,
      mfa_method: 'email'
    }),
  });
  
  if (res.ok) {
    setMfaEnabled(!mfaEnabled);
    alert('MFA settings updated');
  }
};
```

Add to modal UI:
```tsx
<div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
  <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Security Settings</h3>
  
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
      Two-Factor Authentication (Email)
    </span>
    <button
      onClick={handleToggleMFA}
      disabled={loadingSecurity}
      style={{
        padding: '0.4rem 0.8rem',
        background: mfaEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)',
        border: `1px solid ${mfaEnabled ? 'rgba(16, 185, 129, 0.4)' : 'rgba(107, 114, 128, 0.4)'}`,
        borderRadius: '6px',
        color: mfaEnabled ? '#10b981' : '#9ca3af',
        fontSize: '0.75rem',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {mfaEnabled ? '🔒 ENABLED' : '🔓 DISABLED'}
    </button>
  </div>
</div>
```

### 5. Global Security Settings Page

Create new page: `apps/admin/src/app/security/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';

export default function SecuritySettingsPage() {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    const res = await fetch('/api/security/policy');
    const data = await res.json();
    setPolicy(data.policy);
    setLoading(false);
  };

  const updatePolicy = async (updates) => {
    const res = await fetch('/api/security/policy', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    if (res.ok) {
      fetchPolicy();
      alert('Security policy updated');
    }
  };

  // ... render form with toggles for each policy setting
}
```

## 🔐 Security Features Explained

### 1. Enable/Disable User Accounts
**Endpoint:** `/api/users/[id]/toggle-status`
- Bans user indefinitely (prevents login)
- Unbans user (restores access)
- Updates `banned_until` field in Supabase Auth

### 2. Delete User Accounts
**Endpoint:** `/api/users/[id]/delete`
- Requires typing confirmation (DELETE user@email.com)
- Permanently deletes:
  - Auth user
  - Profile data
  - Wallet
  - All entries
  - All picks
  - Cascades via foreign keys

### 3. Two-Factor Authentication (MFA)
**Admin Controls:**
- Enable/disable MFA per user
- Choose method: Email, TOTP (Google Authenticator), SMS
- View MFA setup date

**User Flow:**
1. User logs in with email/password
2. System checks `user_security_settings`
3. If MFA enabled, generates 6-digit code
4. Sends code via email
5. User enters code to complete login
6. Code expires in 10 minutes

### 4. Email Verification for Login
**Admin Global Setting:**
```sql
UPDATE admin_security_policies 
SET require_email_verification = true 
WHERE policy_name = 'default';
```

When enabled:
- Every login sends verification code to email
- User must enter code to proceed
- Adds extra security layer beyond password

**Admin Can Choose:**
- Require for all users (global policy)
- Require for specific users (per-user setting)
- Disable entirely (allow password-only login)

### 5. Login Attempt Tracking
- Records every login attempt (success/failure)
- Stores IP address and user agent
- Auto-locks account after X failed attempts (configurable)
- Admin can view login history per user

### 6. Session Management
- Tracks all active sessions per user
- Admin can revoke sessions (force logout)
- Sessions expire after X hours (configurable)
- User can see their active devices

## 🎨 UI Enhancements

### User List Table
Add column: **Security**
- 🔒 MFA enabled badge (green)
- 🔓 MFA disabled badge (gray)
- 🚫 Banned badge (red)
- ⚠️ Email not verified badge (orange)

### User Detail Modal
Add tabs:
1. **Profile** - Existing info
2. **Security** - MFA, login history, sessions
3. **Activity** - Entries, transactions
4. **Actions** - Ban, delete, reset password

## 📊 Database Schema

```sql
-- MFA Settings per user
user_security_settings
- user_id (UUID, FK to auth.users)
- mfa_enabled (BOOLEAN)
- mfa_method (VARCHAR: 'email', 'totp', 'sms')
- backup_codes (TEXT[])

-- Verification codes
mfa_verification_codes
- user_id (UUID)
- code (VARCHAR(6))
- expires_at (TIMESTAMPTZ)
- used_at (TIMESTAMPTZ)

-- Global policies
admin_security_policies
- require_mfa_for_all (BOOLEAN)
- require_email_verification (BOOLEAN)
- max_login_attempts (INTEGER)
- lockout_duration_minutes (INTEGER)
```

## 🚀 Next Steps

1. **Run database script** ✅ Created
2. **Test API endpoints** ✅ Created
3. **Update UsersList component** - Add MFA controls
4. **Create Security Settings page** - Global admin controls
5. **Implement frontend MFA flow** - For regular users
6. **Add email sending** - For verification codes
7. **Test end-to-end** - Full login flow with MFA

## 📧 Email Integration Required

You'll need to set up email sending for MFA codes:

```typescript
// Example using Resend or SendGrid
async function sendMFACode(email: string, code: string) {
  await resend.emails.send({
    from: 'security@inplaytv.com',
    to: email,
    subject: 'Your Login Verification Code',
    html: `
      <h2>Login Verification</h2>
      <p>Your code is: <strong>${code}</strong></p>
      <p>This code expires in 10 minutes.</p>
    `,
  });
}
```

## 🔒 Security Best Practices

1. **Codes:** 6 digits, expire in 10 minutes
2. **Rate limiting:** Max 3 code requests per hour
3. **Hashing:** Store codes hashed in database
4. **Backup codes:** Generate 10 one-time use codes
5. **Audit log:** Track all security changes
6. **IP tracking:** Log IP for suspicious activity detection

## ✅ Summary

**What's Complete:**
- ✅ Database schema
- ✅ RLS policies
- ✅ API endpoints (toggle MFA, get security, policy management)
- ✅ Helper functions (generate codes, cleanup)

**What Needs Implementation:**
- Update UsersList component with MFA UI
- Create Security Settings admin page
- Add email sending service
- Implement user-facing MFA login flow
- Add backup codes generation
- Create audit log viewer

Let me know which part you'd like me to implement next!
