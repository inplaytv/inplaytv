'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './NavigationMenu.module.css';

interface MenuItem {
  label: string;
  href: string;
  icon: string;
  description?: string;
}

interface MenuCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  gradient: string;
  items: MenuItem[];
}

interface NavigationMenuProps {
  isMobile?: boolean;
  onItemClick?: () => void;
}

const menuCategories: MenuCategory[] = [
  {
    id: 'golf',
    label: 'Golf',
    icon: 'fa-golf-ball-tee',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    items: [
      { 
        label: 'Lobby', 
        href: '/', 
        icon: 'fa-home',
        description: 'Main dashboard'
      },
      { 
        label: 'My Scorecards', 
        href: '/entries', 
        icon: 'fa-clipboard-list',
        description: 'View your entries'
      },
      { 
        label: 'Tournaments', 
        href: '/tournaments', 
        icon: 'fa-trophy',
        description: 'Browse competitions'
      },
      { 
        label: '1-2-1 Matchmaker', 
        href: '/one-2-one', 
        icon: 'fa-swords',
        description: 'Head-to-head challenges'
      },
      { 
        label: 'Leaderboards', 
        href: '/leaderboards', 
        icon: 'fa-ranking-star',
        description: 'Competition standings'
      },
      { 
        label: 'Golfer Stats', 
        href: '/golfers', 
        icon: 'fa-chart-line',
        description: 'Player performance'
      },
      { 
        label: 'How To Play', 
        href: '/how-to-play', 
        icon: 'fa-book-open',
        description: 'Rules & guides'
      },
    ]
  },
  {
    id: 'clubhouse',
    label: 'Clubhouse',
    icon: 'fa-users',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    items: [
      { 
        label: 'Coming Soon', 
        href: '#', 
        icon: 'fa-clock',
        description: 'Social features launching soon'
      }
    ]
  },
  {
    id: 'prize-room',
    label: 'Prize Room',
    icon: 'fa-trophy',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    items: [
      { 
        label: 'Coming Soon', 
        href: '#', 
        icon: 'fa-clock',
        description: 'Prizes and rewards launching soon'
      }
    ]
  }
];

export default function NavigationMenu({ isMobile = false, onItemClick }: NavigationMenuProps = {}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // If mobile, render simplified navigation
  if (isMobile) {
    const allItems = menuCategories.flatMap(category => 
      category.items.map(item => ({ ...item, category: category.label }))
    );
    
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        {allItems.slice(0, 8).map((item, index) => (
          <Link 
            key={index}
            href={item.href} 
            style={{ 
              color: pathname === item.href ? '#10b981' : '#fff', 
              textDecoration: 'none', 
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 0',
              borderLeft: pathname === item.href ? '3px solid #10b981' : 'none',
              paddingLeft: pathname === item.href ? '1rem' : '0'
            }} 
            onClick={onItemClick}
          >
            <i className={`fa ${item.icon}`} style={{minWidth: '20px'}}></i>
            {item.label}
          </Link>
        ))}
      </div>
    );
  }

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveCategory(null);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
    setActiveCategory(null);
  }, [pathname]);

  const handleCategoryClick = (categoryId: string) => {
    if (activeCategory === categoryId) {
      setIsOpen(false);
      setActiveCategory(null);
    } else {
      setActiveCategory(categoryId);
      setIsOpen(true);
    }
  };

  const activeMenu = menuCategories.find(cat => cat.id === activeCategory);

  return (
    <div className={styles.navigationMenu} ref={menuRef}>
      {/* Category Buttons */}
      <div className={styles.categoryButtons}>
        {menuCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`${styles.categoryButton} ${activeCategory === category.id ? styles.active : ''}`}
            style={{
              '--category-color': category.color,
              '--category-gradient': category.gradient,
            } as React.CSSProperties}
          >
            <i className={`fas ${category.icon}`}></i>
            <span>{category.label}</span>
            <i className={`fas fa-chevron-down ${styles.chevron} ${activeCategory === category.id ? styles.rotated : ''}`}></i>
          </button>
        ))}
      </div>

      {/* Dropdown Panel */}
      {isOpen && activeMenu && (
        <>
          {/* Backdrop */}
          <div className={styles.backdrop} onClick={() => {
            setIsOpen(false);
            setActiveCategory(null);
          }} />
          
          {/* Dropdown Content */}
          <div 
            className={styles.dropdownPanel}
            style={{
              '--category-color': activeMenu.color,
            } as React.CSSProperties}
          >
            {/* Header */}
            <div 
              className={styles.dropdownHeader}
              style={{ background: activeMenu.gradient }}
            >
              <i className={`fas ${activeMenu.icon}`}></i>
              <span>{activeMenu.label}</span>
              <span className={styles.itemCount}>{activeMenu.items.length} {activeMenu.items.length === 1 ? 'item' : 'items'}</span>
            </div>

            {/* Menu Items */}
            <div className={styles.menuItems}>
              {activeMenu.items.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={`${styles.menuItem} ${pathname === item.href ? styles.activeItem : ''}`}
                  onClick={(e) => {
                    if (item.href === '#') {
                      e.preventDefault();
                    }
                  }}
                >
                  <div className={styles.menuItemIcon}>
                    <i className={`fas ${item.icon}`}></i>
                  </div>
                  <div className={styles.menuItemContent}>
                    <div className={styles.menuItemLabel}>{item.label}</div>
                    {item.description && (
                      <div className={styles.menuItemDescription}>{item.description}</div>
                    )}
                  </div>
                  {pathname === item.href && (
                    <div className={styles.activeIndicator}>
                      <i className="fas fa-circle"></i>
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* Footer (optional) */}
            <div className={styles.dropdownFooter}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                {activeMenu.id === 'golf' ? 'All Golf Competitions' : `${activeMenu.label} - Launching Soon`}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
