/**
 * Status Utilities
 * Standardizes status values across the platform
 */

export type CompetitionStatus = 'upcoming' | 'reg_open' | 'live' | 'completed' | 'cancelled';
export type ChallengeStatus = 'pending' | 'open' | 'in-play' | 'completed' | 'cancelled';

/**
 * Normalizes various status strings to standard database values
 */
export function normalizeStatus(status: string): CompetitionStatus {
  const normalized = status.toLowerCase().replace(/[_-]/g, '_');
  
  const statusMap: Record<string, CompetitionStatus> = {
    'registration_open': 'reg_open',
    'reg_open': 'reg_open',
    'open': 'reg_open',
    'in_play': 'live',
    'inplay': 'live',
    'in_progress': 'live',
    'active': 'live',
    'live': 'live',
    'completed': 'completed',
    'finished': 'completed',
    'upcoming': 'upcoming',
    'pending': 'upcoming',
    'cancelled': 'cancelled',
    'canceled': 'cancelled',
  };
  
  return statusMap[normalized] || 'upcoming';
}

/**
 * Check if registration is currently open
 * Considers both status and reg_close_at timestamp
 */
export function isRegistrationOpen(
  status: string,
  regCloseAt?: string | null
): boolean {
  if (normalizeStatus(status) !== 'reg_open') return false;
  if (!regCloseAt) return true;
  return new Date() < new Date(regCloseAt);
}

/**
 * Check if competition is currently live/in progress
 */
export function isLive(status: string): boolean {
  return normalizeStatus(status) === 'live';
}

/**
 * Check if competition is completed
 */
export function isCompleted(status: string): boolean {
  return normalizeStatus(status) === 'completed';
}

/**
 * Check if competition is upcoming (not started yet)
 */
export function isUpcoming(status: string): boolean {
  return normalizeStatus(status) === 'upcoming';
}

/**
 * Get user-friendly status label
 */
export function getStatusLabel(status: string): string {
  const normalized = normalizeStatus(status);
  
  const labels: Record<CompetitionStatus, string> = {
    'upcoming': 'Upcoming',
    'reg_open': 'Registration Open',
    'live': 'Live Now',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
  };
  
  return labels[normalized] || 'Unknown';
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  const normalized = normalizeStatus(status);
  
  const colors: Record<CompetitionStatus, string> = {
    'upcoming': '#6b7280',      // Gray
    'reg_open': '#fbbf24',      // Yellow
    'live': '#10b981',          // Green
    'completed': '#6b7280',     // Gray
    'cancelled': '#ef4444',     // Red
  };
  
  return colors[normalized] || '#6b7280';
}

/**
 * Get status emoji
 */
export function getStatusEmoji(status: string): string {
  const normalized = normalizeStatus(status);
  
  const emojis: Record<CompetitionStatus, string> = {
    'upcoming': '⏱',
    'reg_open': '🔓',
    'live': '🔴',
    'completed': '✅',
    'cancelled': '❌',
  };
  
  return emojis[normalized] || '⏱';
}
