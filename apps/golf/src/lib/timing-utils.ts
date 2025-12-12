/**
 * Timing Utilities
 * Handles all date/time validation for competitions and tournaments
 */

/**
 * Check if registration can still happen
 * Considers competition status AND registration close time
 */
export function canRegister(
  competitionStatus: string,
  regCloseAt?: string | null,
  startTime?: string | null
): boolean {
  const now = new Date();
  
  // Must be in reg_open status
  if (competitionStatus !== 'reg_open') return false;
  
  // If there's a reg_close_at, check it
  if (regCloseAt) {
    const closeDate = new Date(regCloseAt);
    if (now >= closeDate) return false;
  }
  
  // If there's a start_time, can't register after it starts
  if (startTime) {
    const startDate = new Date(startTime);
    if (now >= startDate) return false;
  }
  
  return true;
}

/**
 * Check if competition scoring has started
 */
export function hasCompetitionStarted(
  competitionStatus: string,
  startTime?: string | null
): boolean {
  // If status is live, it's definitely started
  if (competitionStatus === 'live') return true;
  
  // Otherwise check start_time if available
  if (startTime) {
    return new Date() >= new Date(startTime);
  }
  
  return false;
}

/**
 * Check if competition scoring has ended
 */
export function hasCompetitionEnded(
  competitionStatus: string,
  endTime?: string | null
): boolean {
  // If status is completed, it's definitely ended
  if (competitionStatus === 'completed') return true;
  
  // Otherwise check end_time if available
  if (endTime) {
    return new Date() >= new Date(endTime);
  }
  
  return false;
}

/**
 * Check if tournament has started (not competition)
 */
export function hasTournamentStarted(
  tournamentStartDate: string
): boolean {
  return new Date() >= new Date(tournamentStartDate);
}

/**
 * Check if tournament has ended (not competition)
 */
export function hasTournamentEnded(
  tournamentEndDate: string
): boolean {
  return new Date() >= new Date(tournamentEndDate);
}

/**
 * Get time remaining until registration closes
 * Returns null if no reg_close_at or already closed
 */
export function getTimeUntilRegClose(
  regCloseAt?: string | null
): { hours: number; minutes: number; seconds: number } | null {
  if (!regCloseAt) return null;
  
  const now = new Date();
  const closeDate = new Date(regCloseAt);
  
  if (now >= closeDate) return null;
  
  const diffMs = closeDate.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds };
}

/**
 * Get time remaining until competition starts
 */
export function getTimeUntilStart(
  startTime?: string | null
): { days: number; hours: number; minutes: number } | null {
  if (!startTime) return null;
  
  const now = new Date();
  const startDate = new Date(startTime);
  
  if (now >= startDate) return null;
  
  const diffMs = startDate.getTime() - now.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes };
}

/**
 * Format date for display
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format date only (no time)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format time only (no date)
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = date.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);
  
  const seconds = Math.floor(absDiffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  const isPast = diffMs < 0;
  const prefix = isPast ? '' : 'in ';
  const suffix = isPast ? ' ago' : '';
  
  if (seconds < 60) return `${prefix}${seconds} second${seconds !== 1 ? 's' : ''}${suffix}`;
  if (minutes < 60) return `${prefix}${minutes} minute${minutes !== 1 ? 's' : ''}${suffix}`;
  if (hours < 24) return `${prefix}${hours} hour${hours !== 1 ? 's' : ''}${suffix}`;
  return `${prefix}${days} day${days !== 1 ? 's' : ''}${suffix}`;
}

/**
 * Validate that times are in correct order
 * Throws error if validation fails
 */
export function validateCompetitionTiming(
  regCloseAt: string,
  startTime: string,
  endTime: string
): void {
  const regClose = new Date(regCloseAt);
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  if (regClose >= start) {
    throw new Error('Registration must close before competition starts');
  }
  
  if (start >= end) {
    throw new Error('Competition start must be before end time');
  }
}
