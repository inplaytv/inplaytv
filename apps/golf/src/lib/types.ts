/**
 * Core Platform Types
 * Single source of truth for all competition and tournament types
 * Uses TypeScript discriminated unions for type safety
 */

// ============================================================================
// STATUS TYPES
// ============================================================================

export type CompetitionStatus = 'upcoming' | 'reg_open' | 'live' | 'completed' | 'cancelled';
export type ChallengeStatus = 'pending' | 'open' | 'in-play' | 'completed' | 'cancelled';
export type TournamentStatus = 'upcoming' | 'registration_open' | 'live' | 'completed' | 'cancelled';

// ============================================================================
// COMPETITION DISCRIMINATED UNION
// ============================================================================

/**
 * Base properties shared by all competitions
 */
interface BaseCompetition {
  id: string;
  name: string;
  tournament_id: string;
  status: CompetitionStatus;
  entry_fee_pennies: number;
  reg_close_at: string | null;
  start_at: string | null;
  end_at: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * InPlay Competition (Full Course, Beat The Cut, etc.)
 * Distinguished by: kind = 'inplay'
 * MUST have: competition_type_id
 * MUST NOT have: rounds_covered
 */
export interface InPlayCompetition extends BaseCompetition {
  kind: 'inplay';
  competition_type_id: string;
  rounds_covered: null;
  competition_type?: {
    id: string;
    name: string; // "Full Course", "Beat The Cut", etc.
    description: string;
  };
}

/**
 * ONE 2 ONE Challenge Template
 * Distinguished by: kind = 'one2one'
 * MUST have: rounds_covered
 * MUST NOT have: competition_type_id
 */
export interface One2OneTemplate extends BaseCompetition {
  kind: 'one2one';
  competition_type_id: null;
  rounds_covered: number[]; // e.g., [1, 2, 3, 4] for all rounds
}

/**
 * Discriminated union - compiler enforces correct usage
 */
export type Competition = InPlayCompetition | One2OneTemplate;

// ============================================================================
// ONE 2 ONE INSTANCE TYPES
// ============================================================================

/**
 * ONE 2 ONE Challenge Instance (active match)
 */
export interface One2OneInstance {
  id: string;
  template_id: string;
  tournament_id: string;
  challenger_id: string;
  challenger_entry_id: string;
  opponent_id: string | null;
  opponent_entry_id: string | null;
  status: ChallengeStatus;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  winner_id: string | null;
  is_public: boolean;
  template?: One2OneTemplate;
}

// ============================================================================
// TOURNAMENT TYPES
// ============================================================================

export interface Tournament {
  id: string;
  name: string;
  slug: string;
  course_name: string;
  location: string;
  start_date: string;
  end_date: string;
  status: TournamentStatus;
  tour: string;
  year: number;
  is_visible: boolean;
  prize_pool: number | null;
  field_size: number | null;
  tournament_info: {
    overview: string;
    course_details: string;
    format: string;
  } | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ENTRY TYPES
// ============================================================================

/**
 * User's entry in an InPlay competition
 */
export interface InPlayEntry {
  id: string;
  user_id: string;
  competition_id: string;
  tournament_id: string;
  golfer_ids: string[];
  captain_id: string | null;
  total_salary_used: number;
  points: number | null;
  rank: number | null;
  created_at: string;
  competition?: InPlayCompetition;
}

/**
 * User's entry in a ONE 2 ONE challenge
 */
export interface One2OneEntry {
  id: string;
  user_id: string;
  tournament_id: string;
  golfer_ids: string[];
  captain_id: string | null;
  total_salary_used: number;
  points: number | null;
  created_at: string;
  instance?: One2OneInstance;
}

export type Entry = InPlayEntry | One2OneEntry;

// ============================================================================
// GOLFER TYPES
// ============================================================================

export interface Golfer {
  id: string;
  datagolf_id: number;
  name: string;
  country: string | null;
  salary: number;
  is_available: boolean;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TournamentGolfer {
  id: string;
  tournament_id: string;
  golfer_id: string;
  salary: number;
  is_withdrawn: boolean;
  golfer?: Golfer;
}

// ============================================================================
// LEADERBOARD TYPES
// ============================================================================

/**
 * InPlay Fantasy Leaderboard Entry
 */
export interface InPlayLeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  display_name: string | null;
  entry_id: string;
  points: number;
  golfer_count: number;
  captain_id: string | null;
  last_updated: string;
}

/**
 * Tournament Real Golf Leaderboard Entry
 */
export interface TournamentLeaderboardEntry {
  position: number;
  golfer_id: string;
  golfer_name: string;
  country: string | null;
  total_score: number;
  score_to_par: string; // "E", "+2", "-5", etc.
  round_scores: number[];
  current_round: number | null;
  thru: string | null; // "F", "18", "12*", etc.
  tee_time: string | null;
  status: 'active' | 'finished' | 'cut' | 'withdrawn';
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard: Check if competition is InPlay
 */
export function isInPlayCompetition(comp: Competition): comp is InPlayCompetition {
  return comp.kind === 'inplay';
}

/**
 * Type guard: Check if competition is ONE 2 ONE
 */
export function isOne2OneCompetition(comp: Competition): comp is One2OneTemplate {
  return comp.kind === 'one2one';
}

/**
 * Type guard: Check if entry is InPlay
 */
export function isInPlayEntry(entry: Entry): entry is InPlayEntry {
  return 'competition_id' in entry;
}

/**
 * Type guard: Check if entry is ONE 2 ONE
 */
export function isOne2OneEntry(entry: Entry): entry is One2OneEntry {
  return (entry as any).tournament_competitions?.competition_format === 'one2one';
}

// ============================================================================
// DATABASE RAW TYPES (for API responses before transformation)
// ============================================================================

/**
 * Raw competition data from database (before adding 'kind' discriminator)
 */
export interface RawCompetition {
  id: string;
  name: string;
  tournament_id: string;
  status: string;
  competition_type_id: string | null;
  rounds_covered: number[] | null;
  entry_fee_pennies: number;
  reg_close_at: string | null;
  start_at: string | null;
  end_at: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Transform raw database competition into typed Competition
 */
export function transformCompetition(raw: RawCompetition): Competition {
  // Validate: must have EITHER competition_type_id OR rounds_covered, not both
  const hasTypeId = raw.competition_type_id !== null && raw.competition_type_id !== undefined;
  const hasRounds = raw.rounds_covered !== null && raw.rounds_covered !== undefined;

  if (hasTypeId && hasRounds) {
    throw new Error(`Competition ${raw.id} has BOTH competition_type_id AND rounds_covered - data corruption!`);
  }

  if (!hasTypeId && !hasRounds) {
    throw new Error(`Competition ${raw.id} has NEITHER competition_type_id NOR rounds_covered - invalid data!`);
  }

  // Create base object
  const base = {
    id: raw.id,
    name: raw.name,
    tournament_id: raw.tournament_id,
    status: raw.status as CompetitionStatus,
    entry_fee_pennies: raw.entry_fee_pennies,
    reg_close_at: raw.reg_close_at,
    start_at: raw.start_at,
    end_at: raw.end_at,
    is_visible: raw.is_visible,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };

  // Return correctly typed competition
  if (hasTypeId) {
    return {
      ...base,
      kind: 'inplay',
      competition_type_id: raw.competition_type_id!,
      rounds_covered: null,
    } as InPlayCompetition;
  } else {
    return {
      ...base,
      kind: 'one2one',
      competition_type_id: null,
      rounds_covered: raw.rounds_covered!,
    } as One2OneTemplate;
  }
}
