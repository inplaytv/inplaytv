'use client';

import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from './UserAvatar';
import { formatPounds } from '@/lib/money';
import Link from 'next/link';

export default function UserMenu() {
  const { user, signOut: authSignOut } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  async function loadUserData() {
    if (!user) return;

    // Load profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(profileData);

    // Load InPlay wallet balance (money)
    const { data: walletData } = await supabase
      .from('wallets')
      .select('balance_cents')
      .eq('user_id', user.id)
      .maybeSingle();
    if (walletData) {
      setBalance(walletData.balance_cents);
    }

    // Load Clubhouse wallet balance (credits)
    const { data: creditsData } = await supabase
      .from('clubhouse_wallets')
      .select('balance_credits')
      .eq('user_id', user.id)
      .maybeSingle();
    if (creditsData) {
      setCredits(creditsData.balance_credits);
    }
  }

  async function handleSignOut() {
    await authSignOut();
    // Redirect to website after logout
    const websiteUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:3000'
      : 'https://www.inplay.tv';
    window.location.href = websiteUrl;
  }

  const toggleDropdown = () => setIsOpen(!isOpen);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'nowrap' }}>
      {/* InPlay Money Balance */}
      <Link href="/wallet" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <div style={{
          background: 'rgba(102, 126, 234, 0.2)',
          border: '1px solid rgba(102, 126, 234, 0.4)',
          borderRadius: '20px',
          padding: '0.35rem 0.7rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          cursor: 'pointer',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>
            {formatPounds(balance)}
          </span>
        </div>
      </Link>

      {/* Clubhouse Credits Balance */}
      <Link href="/clubhouse/wallet" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <div style={{
          background: 'rgba(16, 185, 129, 0.2)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '20px',
          padding: '0.35rem 0.7rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          cursor: 'pointer',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981' }}>
            {credits.toLocaleString()}c
          </span>
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
          name={profile?.display_name || profile?.name}
          email={user?.email}
          size={40}
        />
        <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>▼</span>

        {/* Dropdown Menu */}
        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            background: 'rgba(20, 20, 40, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            minWidth: '280px',
            marginTop: '8px',
            zIndex: 1000,
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <UserAvatar
                avatarUrl={profile?.avatar_url}
                name={profile?.name}
                email={user?.email}
                size={50}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontWeight: 600, 
                  color: 'white', 
                  fontSize: '16px', 
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {profile?.display_name || profile?.name || profile?.username || 'User'}
                </div>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  fontSize: '14px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {user?.email}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div style={{ padding: '8px' }}>
              <MenuLink href="/profile" icon="👤" onClick={() => setIsOpen(false)}>My Profile</MenuLink>
              <MenuLink href="/wallet" icon="💰" onClick={() => setIsOpen(false)}>InPlay Wallet</MenuLink>
              <MenuLink href="/clubhouse/wallet" icon="🎮" onClick={() => setIsOpen(false)}>Clubhouse Credits</MenuLink>
              <MenuLink href="/security" icon="🔒" onClick={() => setIsOpen(false)}>Security</MenuLink>
              <MenuLink href="/help" icon="❓" onClick={() => setIsOpen(false)}>Help & Support</MenuLink>

              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '8px 0' }} />

              <div
                onClick={handleSignOut}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  color: '#ff6b6b',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }} 
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)';
                }} 
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ width: '18px', textAlign: 'center' }}>🚪</span>
                <span>Sign Out</span>
              </div>
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
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        color: 'rgba(255, 255, 255, 0.8)',
        borderRadius: '8px',
        transition: 'all 0.3s ease',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.color = 'white';
        e.currentTarget.style.transform = 'translateX(4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
      >
        <span style={{ width: '18px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>{icon}</span>
        <span>{children}</span>
      </div>
    </Link>
  );
}
