/**
 * Platform Utilities
 * Centralized exports for all utility functions
 * 
 * USAGE GUIDELINES:
 * - Import types and utilities from here, not from individual files
 * - Use discriminated unions (Competition type) for type safety
 * - Use COMPETITION_FILTERS for all database queries
 * - Use type guards (isInPlayCompetition, isOne2OneCompetition) for logic branching
 */

// ============================================================================
// CORE TYPES (NEW - Use these!)
// ============================================================================
export type {
  // Main discriminated union types
  Competition,
  InPlayCompetition,
  One2OneTemplate,
  One2OneInstance,
  Entry,
  InPlayEntry,
  One2OneEntry,
  
  // Supporting types
  Tournament,
  Golfer,
  TournamentGolfer,
  InPlayLeaderboardEntry,
  TournamentLeaderboardEntry,
  
  // Status types
  CompetitionStatus,
  ChallengeStatus,
  TournamentStatus,
  
  // Database types
  RawCompetition,
} from './types';

// Type utilities
export {
  isInPlayCompetition,
  isOne2OneCompetition,
  isInPlayEntry,
  isOne2OneEntry,
  transformCompetition,
} from './types';

// ============================================================================
// BUSINESS RULES & CONSTANTS (NEW - Use these!)
// ============================================================================
export {
  // SQL filters - use in ALL queries
  COMPETITION_FILTERS,
  
  // Competition type IDs
  COMPETITION_TYPE_IDS,
  
  // Status constants
  COMPETITION_STATUS,
  CHALLENGE_STATUS,
  STATUS_ALIASES,
  
  // Business rules
  REGISTRATION_RULES,
  ONE2ONE_RULES,
  LEADERBOARD_RULES,
  LINEUP_RULES,
  VALIDATION_RULES,
  ALLOWED_STATUS_TRANSITIONS,
  AUTO_STATUS_TRANSITIONS,
  
  // Routes
  ROUTES,
  
  // Helper functions
  canRegisterForStatus,
  shouldShowInPlayLeaderboard,
  isValidRoundCombination,
  getRoundDescription,
  formatCurrency,
  validateCompetitionTiming as validateCompetitionTimingRules,
} from './competition-rules';

// ============================================================================
// LEGACY UTILITIES (Still available, but prefer new types above)
// ============================================================================

// Status utilities
export {
  normalizeStatus,
  isRegistrationOpen,
  isLive,
  isCompleted,
  isUpcoming,
  getStatusLabel,
  getStatusColor,
  getStatusEmoji,
} from './status-utils';

// Timing utilities
export {
  canRegister,
  hasCompetitionStarted,
  hasCompetitionEnded,
  hasTournamentStarted,
  hasTournamentEnded,
  getTimeUntilRegClose,
  getTimeUntilStart,
  formatDateTime,
  formatDate,
  formatTime,
  getRelativeTime,
  validateCompetitionTiming,
} from './timing-utils';
