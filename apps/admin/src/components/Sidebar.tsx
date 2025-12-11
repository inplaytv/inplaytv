'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSidebar } from './SidebarContext';

interface NavSection {
  title: string;
  icon: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  href: string;
}

const navSections: NavSection[] = [
  {
    title: 'Dashboard',
    icon: '■',
    items: [
      { label: 'Overview', href: '/' },
    ],
  },
  {
    title: 'Users',
    icon: '👤',
    items: [
      { label: 'All Users', href: '/users' },
    ],
  },
  {
    title: 'Tournaments',
    icon: '◆',
    items: [
      { label: 'All Tournaments', href: '/tournaments' },
      { label: 'Lifecycle Manager', href: '/tournament-lifecycle' },
      { label: 'AI Tournament Creator', href: '/ai-tournament-creator' },
      { label: 'Active Competitions', href: '/competitions' },
      { label: 'Competition Types', href: '/competition-types' },
      { label: 'ONE 2 ONE Templates', href: '/one-2-one-templates' },
      { label: 'Tournament Golfers', href: '/golfers/groups' },
    ],
  },
  {
    title: 'Finance',
    icon: '£',
    items: [
      { label: 'Wallet Management', href: '/wallet-management' },
      { label: 'Transactions', href: '/transactions' },
      { label: 'Withdrawals', href: '/withdrawals' },
      { label: 'Reports', href: '/reports' },
    ],
  },
  {
    title: 'Results',
    icon: '🏆',
    items: [
      { label: 'Competition Results', href: '/admin/results' },
    ],
  },
  {
    title: 'Dev Notes',
    icon: '📝',
    items: [
      { label: 'Tasks & Reminders', href: '/dev-notes' },
      { label: 'Ideas & Suggestions', href: '/ideas-suggestions' },
      { label: 'Faults & Fixes', href: '/faults-fixes' },
      { label: 'InPlay Displays', href: '/inplay-displays' },
    ],
  },
  {
    title: 'Settings',
    icon: '⚙',
    items: [
      { label: 'Site', href: '/settings/site' },
      { label: 'Security', href: '/settings/security' },
      { label: 'Admins', href: '/settings/admins' },
      { label: 'Logs', href: '/settings/logs' },
    ],
  },
  {
    title: 'Email',
    icon: '✉️',
    items: [
      { label: 'Inbox', href: '/email/inbox' },
      { label: 'Outbox', href: '/email/outbox' },
      { label: 'Compose', href: '/email/compose' },
      { label: 'Templates', href: '/email/templates' },
      { label: 'Contacts', href: '/email/contacts' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);
  const { expandedSection, setExpandedSection } = useSidebar();
  const [signingOut, setSigningOut] = useState(false);

  // Auto-expand section based on current route
  useEffect(() => {
    const currentSection = navSections.find(section => 
      section.items.some(item => item.href === pathname)
    );
    if (currentSection) {
      setExpandedSection(currentSection.title);
    }
  }, [pathname, setExpandedSection]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const response = await fetch('/api/auth/signout', { method: 'POST' });
      if (response.ok) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Sign out error:', error);
      setSigningOut(false);
    }
  };

  const handleSectionClick = (section: string) => {
    const sectionData = navSections.find(s => s.title === section);
    
    if (expandedSection === section) {
      // If clicking the currently open section, close it
      setExpandedSection(null);
    } else {
      // Open this section and navigate to its first item
      setExpandedSection(section);
      if (sectionData && sectionData.items.length > 0) {
        router.push(sectionData.items[0].href);
      }
    }
  };

  const sidebarWidth = isHovering ? '200px' : '60px';

  return (
    <>
      {/* Main Sidebar - Expands on hover to show titles */}
      <aside 
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          width: sidebarWidth,
          minHeight: '100vh',
          background: '#1a1a1a',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 100,
          transition: 'width 0.2s ease',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ 
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          gap: '12px',
        }}>
          <div style={{ 
            width: '32px',
            height: '32px',
            minWidth: '32px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 700,
            color: '#fff',
          }}>
            IP
          </div>
          {isHovering && (
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#fff',
              whiteSpace: 'nowrap',
            }}>
              InPlay Admin
            </span>
          )}
        </div>

        {/* Navigation Icons */}
        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {navSections.map((section) => {
            const isActive = section.items.some(item => item.href === pathname);
            const isExpanded = expandedSection === section.title;
            
            return (
              <div
                key={section.title}
                style={{
                  position: 'relative',
                  marginBottom: '4px',
                }}
              >
                <button
                  onClick={() => handleSectionClick(section.title)}
                  style={{
                    width: '100%',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '14px',
                    gap: '12px',
                    background: isExpanded ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    border: 'none',
                    borderLeft: isExpanded ? '2px solid #3b82f6' : '2px solid transparent',
                    color: isExpanded ? '#3b82f6' : 'rgba(255,255,255,0.6)',
                    fontSize: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isExpanded) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isExpanded) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ minWidth: '32px', textAlign: 'center' }}>
                    {section.icon}
                  </span>
                  {isHovering && (
                    <span style={{
                      fontSize: '14px',
                      fontWeight: isExpanded ? 600 : 400,
                      whiteSpace: 'nowrap',
                    }}>
                      {section.title}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          style={{
            width: '100%',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '14px',
            gap: '12px',
            background: 'transparent',
            border: 'none',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(239, 68, 68, 0.8)',
            fontSize: '20px',
            cursor: signingOut ? 'not-allowed' : 'pointer',
            opacity: signingOut ? 0.5 : 1,
            transition: 'all 0.15s',
          }}
          title="Sign Out"
        >
          <span style={{ minWidth: '32px', textAlign: 'center' }}>→</span>
          {isHovering && (
            <span style={{
              fontSize: '14px',
              fontWeight: 400,
              whiteSpace: 'nowrap',
            }}>
              Sign Out
            </span>
          )}
        </button>
      </aside>

      {/* Submenu Panel - Opens on click, positioned UNDER main sidebar */}
      {expandedSection && (
        <aside
          style={{
            width: '240px',
            minHeight: '100vh',
            background: '#0f0f0f',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            position: 'fixed',
            left: '60px',
            top: 0,
            zIndex: 98,
            animation: 'slideIn 0.2s ease',
            boxShadow: '2px 0 10px rgba(0,0,0,0.3)',
          }}
        >
          <style>{`
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateX(-10px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}</style>
          
          {navSections.map((section) => {
            if (expandedSection !== section.title) return null;

            return (
              <div key={section.title}>
                {/* Section Header */}
                <div style={{
                  padding: '1.25rem 1rem 0.75rem 1rem',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {section.title}
                  </h3>
                </div>

                {/* Section Items */}
                <div style={{ padding: '0.5rem' }}>
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        style={{
                          display: 'block',
                          padding: '0.65rem 0.75rem',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                          background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                          fontSize: '0.875rem',
                          fontWeight: isActive ? 500 : 400,
                          transition: 'all 0.15s',
                          marginBottom: '2px',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </aside>
      )}
    </>
  );
}
