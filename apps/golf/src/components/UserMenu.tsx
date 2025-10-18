'use client';

import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import UserAvatar from './UserAvatar';
import { formatPounds } from '@/lib/money';
import Link from 'next/link';

export default function UserMenu() {
  const supabase = createClient();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(profileData);

    // Load wallet balance
    const { data: walletData } = await supabase
      .from('wallets')
      .select('balance_cents')
      .eq('user_id', user.id)
      .single();
    if (walletData) {
      setBalance(walletData.balance_cents);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const toggleDropdown = () => setIsOpen(!isOpen);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      {/* Balance pill */}
      <Link href="/wallet" style={{ textDecoration: 'none' }}>
        <div style={{
          background: 'rgba(102, 126, 234, 0.2)',
          border: '1px solid rgba(102, 126, 234, 0.4)',
          borderRadius: '20px',
          padding: '0.5rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>
            {formatPounds(balance)}
          </span>
          <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>💰</span>
        </div>
      </Link>

      {/* Avatar + Dropdown */}
      <div
        onClick={toggleDropdown}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <UserAvatar
          avatarUrl={profile?.avatar_url}
          name={profile?.name}
          email={user?.email}
          size={40}
        />
        <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>▼</span>

        {/* Dropdown Menu */}
        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '50px',
            right: 0,
            background: '#1a1f2e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            minWidth: '240px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
            zIndex: 1000,
          }}>
            {/* Header */}
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
            }}>
              <UserAvatar
                avatarUrl={profile?.avatar_url}
                name={profile?.name}
                email={user?.email}
                size={50}
              />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile?.name || 'User'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div style={{ padding: '0.5rem 0' }}>
              <MenuLink href="/profile" icon="👤" onClick={() => setIsOpen(false)}>My Profile</MenuLink>
              <MenuLink href="/security" icon="🔒" onClick={() => setIsOpen(false)}>Security</MenuLink>
              <MenuLink href="/wallet" icon="💰" onClick={() => setIsOpen(false)}>Wallet</MenuLink>
              <MenuLink href="/notifications" icon="🔔" onClick={() => setIsOpen(false)}>Notifications</MenuLink>
              <MenuLink href="/help" icon="❓" onClick={() => setIsOpen(false)}>Help & Support</MenuLink>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />
              <button
                onClick={handleSignOut}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#ff6b6b',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
        />
      )}
    </div>
  );
}

function MenuLink({ href, icon, children, onClick }: { href: string; icon: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} style={{ textDecoration: 'none' }}>
      <div style={{
        padding: '0.75rem 1rem',
        color: 'rgba(255,255,255,0.9)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.875rem',
        transition: 'background 0.2s',
        background: 'transparent',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <span>{icon}</span>
        <span>{children}</span>
      </div>
    </Link>
  );
}
