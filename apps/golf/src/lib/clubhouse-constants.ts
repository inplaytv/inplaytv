// Clubhouse System Constants
// Single source of truth for status values

export const EVENT_STATUS = {
  UPCOMING: 'upcoming',
  OPEN: 'open',
  ACTIVE: 'active',
  COMPLETED: 'completed'
} as const;

export const ENTRY_STATUS = {
  ACTIVE: 'active',
  WITHDRAWN: 'withdrawn',
  DISQUALIFIED: 'disqualified'
} as const;

export const STATUS_DISPLAY = {
  upcoming: { label: 'Upcoming', color: 'blue', icon: 'clock' },
  open: { label: 'Registration Open', color: 'green', icon: 'door-open' },
  active: { label: 'In Progress', color: 'yellow', icon: 'play' },
  completed: { label: 'Completed', color: 'gray', icon: 'check' }
} as const;

// Type exports
export type EventStatus = typeof EVENT_STATUS[keyof typeof EVENT_STATUS];
export type EntryStatus = typeof ENTRY_STATUS[keyof typeof ENTRY_STATUS];

// Validation helpers
export function isValidGolferTeam(golferIds: string[], captainId: string): boolean {
  if (golferIds.length !== 6) return false;
  if (!golferIds.includes(captainId)) return false;
  if (new Set(golferIds).size !== 6) return false; // Check for duplicates
  return true;
}

export function formatCredits(credits: number): string {
  return credits.toLocaleString();
}

export function getStatusDisplay(status: EventStatus) {
  return STATUS_DISPLAY[status] || STATUS_DISPLAY.upcoming;
}
