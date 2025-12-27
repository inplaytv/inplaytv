/**
 * Competition Type Guards and Utilities
 * Distinguishes between InPlay Competitions and ONE 2 ONE Challenges
 * 
 * IMPORTANT: This file now re-exports the unified utilities.
 * For new code, prefer importing directly from './unified-competition'
 */

// Re-export all unified utilities
export * from './unified-competition';
import { isInPlayCompetition as isInPlayComp, isOne2OneCompetition } from './unified-competition';

// Legacy interfaces (kept for backward compatibility)
export interface InPlayCompetition {
  id: string;
  competition_type_id: string;  // ✅ MUST have this
  rounds_covered: null;          // ❌ MUST be null
  name: string;
  status: string;
  reg_close_at?: string | null;
  start_time?: string | null;
  end_time?: string | null;
}

export interface One2OneTemplate {
  id: string;
  competition_type_id: null;     // ❌ MUST be null
  rounds_covered: string;        // ✅ MUST have this (e.g., "1,2,3,4")
  name: string;
  entry_fee: number;
  tournament_id: string;
}

export interface One2OneInstance {
  id: string;
  template_id: string;
  challenger_id: string;
  opponent_id: string | null;
  status: 'pending' | 'open' | 'in-play' | 'completed' | 'cancelled';
  created_at: string;
}

/**
 * Type guard: Check if this is a ONE 2 ONE template
 * Note: For competition detection, use isInPlayCompetition/isOne2OneCompetition from unified-competition
 */
export function isOne2OneTemplate(item: any): item is One2OneTemplate {
  return (
    item &&
    item.rounds_covered !== null &&
    item.rounds_covered !== undefined &&
    (item.competition_type_id === null || item.competition_type_id === undefined)
  );
}

/**
 * Type guard: Check if this is a ONE 2 ONE instance
 */
export function isOne2OneInstance(item: any): item is One2OneInstance {
  return (
    item &&
    item.template_id !== null &&
    item.template_id !== undefined &&
    (item.challenger_id !== null || item.opponent_id !== null)
  );
}

/**
 * Filter array to only InPlay competitions
 */
export function filterInPlayCompetitions<T>(items: T[]): T[] {
  return items.filter(isInPlayComp as any);
}

/**
 * Filter array to only ONE 2 ONE templates
 */
export function filterOne2OneTemplates<T>(items: T[]): T[] {
  return items.filter(isOne2OneTemplate);
}

/**
 * Get competition type name
 */
export function getCompetitionTypeName(item: any): string {
  if (isInPlayComp(item)) {
    return 'InPlay Competition';
  }
  if (isOne2OneTemplate(item)) {
    return 'ONE 2 ONE Challenge';
  }
  if (isOne2OneInstance(item)) {
    return 'ONE 2 ONE Match';
  }
  return 'Unknown';
}

/**
 * Validate that item is ONLY an InPlay competition
 * Throws error if it's something else
 */
export function assertInPlayCompetition(item: any): asserts item is InPlayCompetition {
  if (!isInPlayComp(item)) {
    throw new Error(
      `Expected InPlay competition but got ${getCompetitionTypeName(item)}. ` +
      `Check that competition_type_id is set and rounds_covered is null.`
    );
  }
}

/**
 * Validate that item is ONLY a ONE 2 ONE template
 * Throws error if it's something else
 */
export function assertOne2OneTemplate(item: any): asserts item is One2OneTemplate {
  if (!isOne2OneTemplate(item)) {
    throw new Error(
      `Expected ONE 2 ONE template but got ${getCompetitionTypeName(item)}. ` +
      `Check that rounds_covered is set and competition_type_id is null.`
    );
  }
}

/**
 * Get SQL filter for InPlay competitions only
 */
export function getInPlayCompetitionFilter(): string {
  return `competition_type_id IS NOT NULL AND rounds_covered IS NULL`;
}

/**
 * Get SQL filter for ONE 2 ONE templates only
 */
export function getOne2OneTemplateFilter(): string {
  return `competition_type_id IS NULL AND rounds_covered IS NOT NULL`;
}
