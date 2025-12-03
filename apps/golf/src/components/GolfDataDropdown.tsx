'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface MenuItem {
  label: string;
  href: string;
  icon: string;
  description: string;
  badge?: string;
  disabled?: boolean;
}

const menuItems: MenuItem[] = [
  {
    label: 'Rankings & Skills',
    href: '/golfdata',
    icon: '👑',
    description: 'Player rankings and strokes gained',
  },
  {
    label: 'Player Analytics',
    href: '/golfdata/players',
    icon: '📊',
    description: 'Historical SG trends & deep dive',
    badge: 'NEW',
  },
  {
    label: 'Course Fit Analyzer',
    href: '/golfdata/course-fit',
    icon: '🎯',
    description: 'Match players to course types',
    badge: 'NEW',
  },
  {
    label: 'Fantasy Optimizer',
    href: '/golfdata/fantasy-optimizer',
    icon: '🎮',
    description: 'DFS lineup builder with value picks',
    badge: 'NEW',
  },
  {
    label: 'Form Tracker',
    href: '/golfdata/form',
    icon: '🔥',
    description: 'Recent performance trends',
    disabled: true,
  },
  {
    label: 'Predictions',
    href: '/golfdata/predictions',
    icon: '🎯',
    description: 'Tournament win probabilities',
    badge: 'NEW',
  },
  {
    label: 'Live Stats',
    href: '/golfdata/live',
    icon: '🔴',
    description: 'Real-time SG dashboard',
    disabled: true,
  },
  {
    label: 'Betting Tools',
    href: '/golfdata/betting',
    icon: '💰',
    description: 'Odds & value finder',
    disabled: true,
  },
];

export default function GolfDataDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.8)',
          textDecoration: 'none',
          cursor: 'pointer',
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '6px',
          transition: 'all 0.2s ease',
          ...(isOpen && {
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
          }),
        }}
      >
        <span>📊 GOLFDATA</span>
        <span
          style={{
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          onMouseLeave={() => setIsOpen(false)}
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            left: '0',
            minWidth: '320px',
            background: 'linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'slideDown 0.2s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Analytics & Data
            </h3>
          </div>

          {/* Menu Items */}
          <div style={{ padding: '0.5rem' }}>
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.disabled ? '#' : item.href}
                onClick={(e) => {
                  if (item.disabled) {
                    e.preventDefault();
                  } else {
                    setIsOpen(false);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.875rem',
                  padding: '0.875rem 1rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  opacity: item.disabled ? 0.4 : 1,
                  ...((!item.disabled && {
                    ':hover': {
                      background: 'rgba(59, 130, 246, 0.1)',
                    },
                  })),
                }}
                onMouseEnter={(e) => {
                  if (!item.disabled) {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {/* Icon */}
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                  {item.icon}
                </span>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        color: item.disabled ? 'rgba(255,255,255,0.4)' : '#fff',
                      }}
                    >
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          padding: '0.125rem 0.375rem',
                          borderRadius: '4px',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: '#fff',
                          textTransform: 'uppercase',
                          letterSpacing: '0.025em',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.disabled && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          padding: '0.125rem 0.375rem',
                          borderRadius: '4px',
                          background: 'rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.5)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.025em',
                        }}
                      >
                        Soon
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.8rem',
                      color: 'rgba(255,255,255,0.5)',
                      lineHeight: 1.4,
                    }}
                  >
                    {item.description}
                  </p>
                </div>

                {/* Arrow indicator for active items */}
                {!item.disabled && (
                  <span
                    style={{
                      fontSize: '0.875rem',
                      color: 'rgba(255,255,255,0.3)',
                      flexShrink: 0,
                    }}
                  >
                    →
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '0.75rem 1.25rem',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.4)',
                lineHeight: 1.5,
              }}
            >
              💡 <strong>Coming Soon:</strong> Historical raw data with granular strokes gained analysis
            </p>
          </div>
        </div>
      )}

      {/* Keyframes for animation */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
