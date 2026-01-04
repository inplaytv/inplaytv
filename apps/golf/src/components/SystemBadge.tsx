import React from 'react';
import styles from './SystemBadge.module.css';

export type SystemSource = 'inplay' | 'clubhouse';

interface SystemBadgeProps {
  system: SystemSource;
  variant?: 'default' | 'compact' | 'pill';
  showIcon?: boolean;
}

const SYSTEM_CONFIG = {
  inplay: {
    label: 'InPlay',
    shortLabel: 'IP',
    color: 'blue',
    description: 'Fantasy Golf Tournament',
    icon: '🏆',
  },
  clubhouse: {
    label: 'Clubhouse',
    shortLabel: 'CH',
    color: 'purple',
    description: 'Head-to-Head Challenge',
    icon: '⚔️',
  },
} as const;

/**
 * System Badge Component
 * Visually distinguishes InPlay tournaments from Clubhouse events
 * 
 * Usage:
 * <SystemBadge system="inplay" />
 * <SystemBadge system="clubhouse" variant="compact" />
 * <SystemBadge system="inplay" variant="pill" showIcon />
 */
export function SystemBadge({ 
  system, 
  variant = 'default',
  showIcon = false 
}: SystemBadgeProps) {
  const config = SYSTEM_CONFIG[system];
  
  const label = variant === 'compact' ? config.shortLabel : config.label;
  
  return (
    <span 
      className={`${styles.badge} ${styles[system]} ${styles[variant]}`}
      title={config.description}
      data-system={system}
    >
      {showIcon && <span className={styles.icon}>{config.icon}</span>}
      {label}
    </span>
  );
}

/**
 * System Label Component (Text-only version for inline use)
 */
export function SystemLabel({ system }: { system: SystemSource }) {
  const config = SYSTEM_CONFIG[system];
  return (
    <span className={styles.label} data-system={system}>
      {config.label}
    </span>
  );
}

export default SystemBadge;
