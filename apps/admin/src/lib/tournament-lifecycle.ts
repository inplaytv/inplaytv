// Tournament Lifecycle Status Types
export const TOURNAMENT_STATUS = {
  UPCOMING: 'upcoming',
  REGISTRATION_OPEN: 'reg_open',
  REGISTRATION_CLOSED: 'reg_closed',
  LIVE_INPLAY: 'live',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type TournamentStatus = typeof TOURNAMENT_STATUS[keyof typeof TOURNAMENT_STATUS];

export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
  [TOURNAMENT_STATUS.UPCOMING]: 'Upcoming',
  [TOURNAMENT_STATUS.REGISTRATION_OPEN]: 'Registration Open',
  [TOURNAMENT_STATUS.REGISTRATION_CLOSED]: 'Registration Closed',
  [TOURNAMENT_STATUS.LIVE_INPLAY]: 'Live In-Play',
  [TOURNAMENT_STATUS.COMPLETED]: 'Completed',
  [TOURNAMENT_STATUS.CANCELLED]: 'Cancelled',
};

export const TOURNAMENT_STATUS_COLORS: Record<TournamentStatus, string> = {
  [TOURNAMENT_STATUS.UPCOMING]: '#6B7280', // Gray
  [TOURNAMENT_STATUS.REGISTRATION_OPEN]: '#10B981', // Green
  [TOURNAMENT_STATUS.REGISTRATION_CLOSED]: '#F59E0B', // Amber
  [TOURNAMENT_STATUS.LIVE_INPLAY]: '#EF4444', // Red (live indicator)
  [TOURNAMENT_STATUS.COMPLETED]: '#3B82F6', // Blue
  [TOURNAMENT_STATUS.CANCELLED]: '#6B7280', // Gray
};

// Lifecycle transition rules
export function getNextStatus(current: TournamentStatus, registrationOpenDate: Date, registrationCloseDate: Date, startDate: Date, endDate: Date, now: Date): TournamentStatus {
  const currentStatus = current;
  
  // Never auto-transition from cancelled
  if (currentStatus === TOURNAMENT_STATUS.CANCELLED) {
    return TOURNAMENT_STATUS.CANCELLED;
  }
  
  // Check dates in order of lifecycle
  if (now >= endDate) {
    return TOURNAMENT_STATUS.COMPLETED;
  }
  
  if (now >= startDate) {
    return TOURNAMENT_STATUS.LIVE_INPLAY;
  }
  
  if (now >= registrationCloseDate) {
    return TOURNAMENT_STATUS.REGISTRATION_CLOSED;
  }
  
  if (now >= registrationOpenDate) {
    return TOURNAMENT_STATUS.REGISTRATION_OPEN;
  }
  
  return TOURNAMENT_STATUS.UPCOMING;
}
