// System Separation Types - Discriminated Unions for InPlay vs Clubhouse
// Location: packages/shared/src/types/competition-systems.ts

export type SystemSource = 'inplay' | 'clubhouse';

/**
 * InPlay Tournament (original fantasy golf system)
 * - Uses slug-based routing: /tournaments/[slug]
 * - Competitions: Full Course, Beat The Cut, ONE 2 ONE
 * - Tables: tournaments, tournament_competitions, competition_entries
 */
export interface InPlayTournament {
  readonly __system: 'inplay'; // Runtime discriminator
  id: string;
  name: string;
  slug: string; // ONLY InPlay has slugs
  status: 'draft' | 'upcoming' | 'registration_open' | 'in_progress' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  system_source?: 'inplay'; // DB column (optional for backward compat)
}

/**
 * Clubhouse Event (head-to-head challenge system)
 * - Uses ID-based routing: /clubhouse/events/[id]
 * - Competitions: Individual challenges
 * - Tables: clubhouse_events, clubhouse_competitions, clubhouse_entries
 */
export interface ClubhouseEvent {
  readonly __system: 'clubhouse'; // Runtime discriminator
  id: string;
  name: string;
  // NO slug - uses UUID for routing
  status: 'upcoming' | 'open' | 'active' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string;
  registration_opens_at: string;
  registration_closes_at: string;
  is_visible: boolean;
  system_source?: 'clubhouse'; // DB column (optional for backward compat)
}

/**
 * Discriminated union - TypeScript enforces system separation at compile time
 */
export type AnyCompetition = InPlayTournament | ClubhouseEvent;

/**
 * Type Guards - Runtime system detection
 */
export function isInPlayTournament(item: any): item is InPlayTournament {
  // Check discriminator first (most reliable)
  if (item?.__system === 'inplay') return true;
  
  // Fallback checks for backward compatibility
  return item?.slug !== undefined || item?.system_source === 'inplay';
}

export function isClubhouseEvent(item: any): item is ClubhouseEvent {
  // Check discriminator first (most reliable)
  if (item?.__system === 'clubhouse') return true;
  
  // Fallback checks for backward compatibility
  return (
    item?.slug === undefined && 
    (item?.system_source === 'clubhouse' || item?.is_visible !== undefined)
  );
}

/**
 * Helper to add __system discriminator to database results
 */
export function addSystemDiscriminator<T extends { system_source?: SystemSource; slug?: string }>(
  item: T,
  defaultSystem?: SystemSource
): T & { __system: SystemSource } {
  // Detect from slug first
  if (item.slug !== undefined) {
    return { ...item, __system: 'inplay' as const };
  }
  
  // Use system_source if available
  if (item.system_source) {
    return { ...item, __system: item.system_source };
  }
  
  // Use default or throw error
  if (defaultSystem) {
    return { ...item, __system: defaultSystem };
  }
  
  throw new Error('Cannot determine system source for item');
}

/**
 * URL builder - generates correct route based on system
 */
export function getCompetitionUrl(item: AnyCompetition | { __system: SystemSource; slug?: string; id: string }): string {
  if (isInPlayTournament(item)) {
    return `/tournaments/${item.slug}`;
  }
  if (isClubhouseEvent(item)) {
    return `/clubhouse/events/${item.id}`;
  }
  throw new Error('Unknown competition system');
}

/**
 * System badge config for UI components
 */
export const SYSTEM_BADGES = {
  inplay: {
    label: 'InPlay',
    color: 'blue',
    description: 'Fantasy Golf Tournament'
  },
  clubhouse: {
    label: 'Clubhouse',
    color: 'purple',
    description: 'Head-to-Head Challenge'
  }
} as const;
