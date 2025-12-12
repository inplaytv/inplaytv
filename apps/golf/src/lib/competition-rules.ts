/**
 * Platform Business Rules and Constants
 * Single source of truth for all competition logic
 */

import type { CompetitionStatus, ChallengeStatus } from './types';

// ============================================================================
// COMPETITION TYPE DETECTION
// ============================================================================

/**
 * SQL filters for competition types
 * Use these in ALL database queries to separate competition types
 */
export const COMPETITION_FILTERS = {
  /**
   * InPlay competitions (Full Course, Beat The Cut, etc.)
   * MUST have competition_type_id, MUST NOT have rounds_covered
   */
  INPLAY: `competition_type_id IS NOT NULL AND rounds_covered IS NULL`,

  /**
   * ONE 2 ONE challenge templates
   * MUST have rounds_covered, MUST NOT have competition_type_id
   */
  ONE2ONE: `competition_type_id IS NULL AND rounds_covered IS NOT NULL`,
} as const;

/**
 * Competition type IDs (from database)
 */
export const COMPETITION_TYPE_IDS = {
  FULL_COURSE: 'full-course',
  BEAT_THE_CUT: 'beat-the-cut',
  // Add more as needed
} as const;

// ============================================================================
// STATUS DEFINITIONS
// ============================================================================

/**
 * Valid competition statuses
 */
export const COMPETITION_STATUS = {
  UPCOMING: 'upcoming',
  REG_OPEN: 'reg_open',
  LIVE: 'live',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

/**
 * Valid challenge statuses (ONE 2 ONE)
 */
export const CHALLENGE_STATUS = {
  PENDING: 'pending',   // Created but not yet open for opponents
  OPEN: 'open',         // Open for opponents to accept
  IN_PLAY: 'in-play',   // Active match in progress
  COMPLETED: 'completed', // Match finished
  CANCELLED: 'cancelled', // Cancelled by challenger
} as const;

/**
 * Status aliases - maps various status strings to canonical values
 */
export const STATUS_ALIASES: Record<string, CompetitionStatus> = {
  'registration_open': 'reg_open',
  'reg_open': 'reg_open',
  'open': 'reg_open',
  'in_play': 'live',
  'inplay': 'live',
  'in_progress': 'live',
  'in-play': 'live',
  'active': 'live',
  'live': 'live',
  'completed': 'completed',
  'finished': 'completed',
  'upcoming': 'upcoming',
  'pending': 'upcoming',
  'cancelled': 'cancelled',
  'canceled': 'cancelled',
};

// ============================================================================
// REGISTRATION RULES
// ============================================================================

/**
 * Registration timing rules
 */
export const REGISTRATION_RULES = {
  /**
   * Can users register during this status?
   */
  ALLOWED_STATUSES: ['reg_open'] as CompetitionStatus[],

  /**
   * How long before tournament start should registration close by default?
   */
  DEFAULT_CLOSE_BEFORE_START_HOURS: 2,

  /**
   * Minimum time registration must be open (minutes)
   */
  MINIMUM_OPEN_DURATION_MINUTES: 30,

  /**
   * Can users edit their lineup after registering?
   */
  ALLOW_LINEUP_EDITS_BEFORE_START: true,
} as const;

// ============================================================================
// COMPETITION LIFECYCLE RULES
// ============================================================================

/**
 * Status transitions - which statuses can change to which
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<CompetitionStatus, CompetitionStatus[]> = {
  'upcoming': ['reg_open', 'cancelled'],
  'reg_open': ['live', 'cancelled'],
  'live': ['completed'],
  'completed': [], // Final state - no transitions
  'cancelled': [], // Final state - no transitions
};

/**
 * When should competitions automatically transition status?
 */
export const AUTO_STATUS_TRANSITIONS = {
  /**
   * Transition to 'reg_open' when this is true
   */
  TO_REG_OPEN: (now: Date, regOpenAt: Date | null) => {
    return regOpenAt ? now >= regOpenAt : false;
  },

  /**
   * Transition to 'live' when this is true
   */
  TO_LIVE: (now: Date, startAt: Date | null, regCloseAt: Date | null) => {
    if (!startAt) return false;
    // Either start time passed OR registration closed
    return now >= startAt || (regCloseAt ? now >= regCloseAt : false);
  },

  /**
   * Transition to 'completed' when this is true
   */
  TO_COMPLETED: (now: Date, endAt: Date | null) => {
    return endAt ? now >= endAt : false;
  },
} as const;

// ============================================================================
// ONE 2 ONE RULES
// ============================================================================

/**
 * ONE 2 ONE challenge rules
 */
export const ONE2ONE_RULES = {
  /**
   * Maximum number of open challenges a user can have simultaneously
   */
  MAX_OPEN_CHALLENGES_PER_USER: 10,

  /**
   * How long an open challenge remains before auto-cancelling (hours)
   */
  OPEN_CHALLENGE_TIMEOUT_HOURS: 72,

  /**
   * Can challenger cancel after opponent accepts?
   */
  ALLOW_CANCEL_AFTER_ACCEPTED: false,

  /**
   * Valid round configurations
   */
  ALLOWED_ROUND_COMBINATIONS: [
    [1],       // Round 1 only
    [2],       // Round 2 only
    [3],       // Round 3 only
    [4],       // Round 4 only
    [1, 2],    // Rounds 1-2
    [3, 4],    // Rounds 3-4
    [1, 2, 3, 4], // All rounds
  ],

  /**
   * Minimum/maximum entry fees (pennies)
   */
  MIN_ENTRY_FEE_PENNIES: 100,    // £1
  MAX_ENTRY_FEE_PENNIES: 10000,  // £100
} as const;

// ============================================================================
// LEADERBOARD RULES
// ============================================================================

/**
 * Leaderboard display and update rules
 */
export const LEADERBOARD_RULES = {
  /**
   * How often to refresh live leaderboards (seconds)
   */
  LIVE_REFRESH_INTERVAL_SECONDS: 30,

  /**
   * Show leaderboard when competition is in these statuses
   */
  SHOW_INPLAY_LEADERBOARD_FOR_STATUS: ['live', 'completed'] as CompetitionStatus[],

  /**
   * Show tournament leaderboard when tournament is in these statuses
   */
  SHOW_TOURNAMENT_LEADERBOARD_FOR_STATUS: ['in_progress', 'completed'],

  /**
   * Number of entries to show initially (pagination)
   */
  INITIAL_ENTRIES_DISPLAY: 50,

  /**
   * Show user's rank even if outside top N
   */
  ALWAYS_SHOW_USER_RANK: true,
} as const;

// ============================================================================
// SALARY CAP RULES
// ============================================================================

/**
 * Salary cap and lineup rules
 */
export const LINEUP_RULES = {
  /**
   * Total salary cap (pennies)
   */
  SALARY_CAP_PENNIES: 5000000, // £50,000

  /**
   * Number of golfers in a lineup
   */
  LINEUP_SIZE: 6,

  /**
   * Can select a captain?
   */
  ALLOW_CAPTAIN: true,

  /**
   * Captain points multiplier
   */
  CAPTAIN_MULTIPLIER: 1.5,

  /**
   * Can select same golfer in multiple competitions?
   */
  ALLOW_GOLFER_REUSE_ACROSS_COMPETITIONS: true,
} as const;

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Data validation rules
 */
export const VALIDATION_RULES = {
  /**
   * Competition name length
   */
  COMPETITION_NAME_MIN_LENGTH: 3,
  COMPETITION_NAME_MAX_LENGTH: 100,

  /**
   * Entry fee boundaries (pennies)
   */
  MIN_ENTRY_FEE_PENNIES: 0,      // Free
  MAX_ENTRY_FEE_PENNIES: 100000, // £1000

  /**
   * Tournament dates
   */
  TOURNAMENT_MIN_DAYS: 1,
  TOURNAMENT_MAX_DAYS: 7,
} as const;

// ============================================================================
// ROUTE PREFIXES
// ============================================================================

/**
 * URL route prefixes for different features
 * Use these for routing and navigation
 */
export const ROUTES = {
  INPLAY: {
    LIST: '/tournaments',
    DETAIL: '/tournaments/[slug]',
    LEADERBOARD: '/leaderboards',
  },
  ONE2ONE: {
    LIST: '/one-2-one',
    DETAIL: '/one-2-one/[slug]',
    CHALLENGE: '/one-2-one/challenge/[instanceId]',
    MY_MATCHES: '/one-2-one/my-matches',
  },
  ENTRIES: {
    MY_ENTRIES: '/entries',
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if status allows registration
 */
export function canRegisterForStatus(status: CompetitionStatus): boolean {
  return REGISTRATION_RULES.ALLOWED_STATUSES.includes(status);
}

/**
 * Check if leaderboard should be shown
 */
export function shouldShowInPlayLeaderboard(status: CompetitionStatus): boolean {
  return LEADERBOARD_RULES.SHOW_INPLAY_LEADERBOARD_FOR_STATUS.includes(status);
}

/**
 * Validate round combination for ONE 2 ONE
 */
export function isValidRoundCombination(rounds: number[]): boolean {
  return ONE2ONE_RULES.ALLOWED_ROUND_COMBINATIONS.some(
    allowed => 
      allowed.length === rounds.length &&
      allowed.every((r, i) => r === rounds[i])
  );
}

/**
 * Get human-readable description of rounds
 */
export function getRoundDescription(rounds: number[]): string {
  if (rounds.length === 1) return `Round ${rounds[0]}`;
  if (rounds.length === 4) return 'All Rounds';
  if (rounds.length === 2) {
    if (rounds[0] === 1) return 'Rounds 1-2';
    if (rounds[0] === 3) return 'Rounds 3-4';
  }
  return `Rounds ${rounds.join(', ')}`;
}

/**
 * Format currency (pennies to display)
 */
export function formatCurrency(pennies: number): string {
  const pounds = pennies / 100;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pounds);
}

/**
 * Validate competition timing order
 */
export function validateCompetitionTiming(
  regOpenAt: Date | null,
  regCloseAt: Date | null,
  startAt: Date | null,
  endAt: Date | null
): { valid: boolean; error?: string } {
  if (regOpenAt && regCloseAt && regOpenAt >= regCloseAt) {
    return { valid: false, error: 'Registration open time must be before close time' };
  }
  if (regCloseAt && startAt && regCloseAt > startAt) {
    return { valid: false, error: 'Registration close time must be before or equal to start time' };
  }
  if (startAt && endAt && startAt >= endAt) {
    return { valid: false, error: 'Start time must be before end time' };
  }
  return { valid: true };
}
