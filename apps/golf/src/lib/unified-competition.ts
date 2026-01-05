/**
 * Unified Competition Utilities
 * 
 * This library provides shared functions that work with BOTH:
 * - InPlay Competitions (tournament_competitions.competition_format = 'inplay')
 * - ONE 2 ONE Challenges (tournament_competitions.competition_format = 'one2one')
 * 
 * BOTH types now use the same table: tournament_competitions
 * BOTH types use competition_id in competition_entries (NO instance_id)
 * 
 * Goal: Eliminate duplicate code and ensure consistent behavior across both systems
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type CompetitionType = 'inplay' | 'one2one';

export interface UnifiedCompetition {
  id: string;
  type: CompetitionType;
  tournamentId: string;
  name: string;
  entryFeePennies: number;
  startAt: string | null;
  endAt: string | null;
  regOpenAt: string | null;
  regCloseAt: string | null;
  status: string;
  entrantsCap?: number;
  assignedGolferGroupId?: string | null;
  // Type-specific fields
  competitionTypeId?: string | null;  // InPlay only
  roundsCovered?: number[] | null;    // ONE 2 ONE only
}

export interface UnifiedEntry {
  id: string;
  userId: string;
  competitionId: string;
  entryName: string | null;
  totalSalary: number;
  entryFeePaid: number;
  captainGolferId: string | null;
  status: 'draft' | 'submitted' | 'cancelled';
  createdAt: string;
  submittedAt: string | null;
}

// ============================================================================
// ID & TYPE DETECTION
// ============================================================================

/**
 * Get the competition ID regardless of whether it's InPlay or ONE 2 ONE
 */
export function getCompetitionId(item: any): string | null {
  return item?.competition_id || null;
}

/**
 * Determine if item is InPlay or ONE 2 ONE based on competition_format field
 */
export function getCompetitionType(item: any): CompetitionType | null {
  if (item?.competition_format === 'inplay') return 'inplay';
  if (item?.competition_format === 'one2one') return 'one2one';
  return null;
}

/**
 * Check if an item is an InPlay competition
 */
export function isInPlayCompetition(item: any): boolean {
  return item?.competition_format === 'inplay' && 
         item?.competition_type_id !== null && 
         item?.competition_type_id !== undefined;
}

/**
 * Check if an item is a ONE 2 ONE competition
 */
export function isOne2OneCompetition(item: any): boolean {
  return item?.competition_format === 'one2one' &&
         item?.rounds_covered !== null && 
         item?.rounds_covered !== undefined;
}

/**
 * Check if an entry is for InPlay (checks parent competition)
 */
export function isInPlayEntry(entry: any): boolean {
  return entry?.competition?.competition_format === 'inplay';
}

/**
 * Check if an entry is for ONE 2 ONE (checks parent competition)
 */
export function isOne2OneEntry(entry: any): boolean {
  return entry?.competition?.competition_format === 'one2one';
}

// ============================================================================
// FETCH COMPETITION DETAILS
// ============================================================================

/**
 * Fetch competition details - tries both InPlay and ONE 2 ONE tables
 * Returns unified structure regardless of type
 */
export async function fetchCompetitionDetails(
  id: string, 
  supabase: SupabaseClient
): Promise<UnifiedCompetition | null> {
  // Try InPlay first
  const { data: inplay, error: inplayError } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      tournament_id,
      competition_type_id,
      entry_fee_pennies,
      start_at,
      end_at,
      reg_open_at,
      reg_close_at,
      status,
      entrants_cap,
      assigned_golfer_group_id,
      competition_types (
        name
      )
    `)
    .eq('id', id)
    .single();





  if (inplay && !inplayError) {
    let golferGroupId = inplay.assigned_golfer_group_id;
    
    // Fetch tournament name separately
    let tournamentName = '';
    if (inplay.tournament_id) {
      const { data: tournament } = await supabase
        .from('tournaments')
        .select('name')
        .eq('id', inplay.tournament_id)
        .single();
      tournamentName = tournament?.name || '';
    }
    
    // FALLBACK: If competition doesn't have a golfer group, inherit from tournament
    if (!golferGroupId && inplay.tournament_id) {

      const { data: tournament } = await supabase
        .from('tournaments')
        .select('id')
        .eq('id', inplay.tournament_id)
        .single();
      
      if (tournament) {
        // Find golfer group for this tournament (by name match or explicit link)
        const { data: groups } = await supabase
          .from('golfer_groups')
          .select('id')
          .limit(1)
          .single();
        
        if (groups) {
          golferGroupId = groups.id;

        }
      }
    }
    

    return {
      id: inplay.id,
      type: 'inplay',
      tournamentId: inplay.tournament_id,
      name: (inplay.competition_types as any)?.name || 'Competition',
      entryFeePennies: inplay.entry_fee_pennies,
      startAt: inplay.start_at,
      endAt: inplay.end_at,
      regOpenAt: inplay.reg_open_at,
      regCloseAt: inplay.reg_close_at,
      status: inplay.status,
      entrantsCap: inplay.entrants_cap,
      assignedGolferGroupId: golferGroupId,
      competitionTypeId: inplay.competition_type_id,
    };
  }

  // Try ONE 2 ONE format in tournament_competitions
  const { data: one2one, error: one2oneError } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      tournament_id,
      template_id,
      entry_fee_pennies,
      start_at,
      end_at,
      reg_close_at,
      status,
      assigned_golfer_group_id,
      competition_templates (
        name,
        rounds_covered
      )
    `)
    .eq('id', id)
    .eq('competition_format', 'one2one')
    .single();





  if (one2one && !one2oneError) {
    
    // Fetch tournament name
    let tournamentName = '';
    if (one2one.tournament_id) {
      const { data: tournament } = await supabase
        .from('tournaments')
        .select('name')
        .eq('id', one2one.tournament_id)
        .single();
      tournamentName = tournament?.name || '';
    }
    
    return {
      id: one2one.id,
      type: 'one2one',
      tournamentId: one2one.tournament_id,
      name: (one2one.competition_templates as any)?.name || 'Challenge',
      entryFeePennies: one2one.entry_fee_pennies,
      startAt: one2one.start_at,
      endAt: one2one.end_at,
      regOpenAt: null, // ONE 2 ONE doesn't have separate reg_open_at
      regCloseAt: one2one.reg_close_at,
      status: one2one.status,
      entrantsCap: 2, // ONE 2 ONE is always head-to-head
      assignedGolferGroupId: one2one.assigned_golfer_group_id,
      roundsCovered: (one2one.competition_templates as any)?.rounds_covered,
    };
  }


  return null;
}

/**
 * Fetch user's entry for a competition - unified system
 */
export async function fetchUserEntry(
  competitionId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<UnifiedEntry | null> {
  const { data, error } = await supabase
    .from('competition_entries')
    .select('*')
    .eq('competition_id', competitionId)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    competitionId: data.competition_id,
    entryName: data.entry_name,
    totalSalary: data.total_salary,
    entryFeePaid: data.entry_fee_paid,
    captainGolferId: data.captain_golfer_id,
    status: data.status,
    createdAt: data.created_at,
    submittedAt: data.submitted_at,
  };
}

// ============================================================================
// AVAILABLE GOLFERS
// ============================================================================

/**
 * Fetch available golfers for a competition - unified logic for both types
 * Fetches from tournament_golfers table (source of truth)
 */
export async function fetchAvailableGolfers(
  competitionId: string,
  supabase: SupabaseClient
) {
  // First, get competition details to find the tournament
  const competition = await fetchCompetitionDetails(competitionId, supabase);
  
  if (!competition) {
    throw new Error('Competition not found');
  }

  if (!competition.tournamentId) {
    throw new Error('Competition has no tournament linked');
  }

  // Fetch golfers directly from tournament_golfers (source of truth)
  const { data: tournamentGolfers, error } = await supabase
    .from('tournament_golfers')
    .select(`
      golfer_id,
      status,
      golfers (
        id,
        full_name,
        country,
        image_url,
        world_ranking,
        salary_pennies,
        form_rating,
        datagolf_id,
        external_id
      )
    `)
    .eq('tournament_id', competition.tournamentId)
    .in('status', ['confirmed', 'active']); // Only confirmed/active golfers

  if (error) {
    throw new Error(`Failed to fetch golfers: ${error.message}`);
  }

  if (!tournamentGolfers || tournamentGolfers.length === 0) {
    throw new Error('No golfers found for this tournament. Please add golfers via Admin Dashboard.');
  }

  // Flatten the structure and map salary_pennies to salary for frontend
  const golfers = tournamentGolfers
    .map(item => {
      const golfer = item.golfers as any; // Type cast - Supabase types it as array but it's an object
      if (!golfer) return null;
      
      return {
        id: golfer.id,
        full_name: golfer.full_name,
        first_name: golfer.first_name,
        last_name: golfer.last_name,
        country: golfer.country,
        image_url: golfer.image_url,
        world_ranking: golfer.world_ranking,
        datagolf_id: golfer.datagolf_id,
        external_id: golfer.external_id,
        form_rating: golfer.form_rating,
        salary: golfer.salary_pennies || 0,
      };
    })
    .filter((golfer): golfer is NonNullable<typeof golfer> => golfer !== null);
  
  return golfers;
}

// ============================================================================
// ENTRY VALIDATION
// ============================================================================

/**
 * Check if an entry can be edited (before tee-off)
 */
export async function canEditEntry(
  entryId: string,
  supabase: SupabaseClient
): Promise<{ canEdit: boolean; reason?: string }> {
  // Get entry
  const { data: entry, error: entryError } = await supabase
    .from('competition_entries')
    .select('id, competition_id, status, user_id')
    .eq('id', entryId)
    .single();

  if (entryError || !entry) {
    return { canEdit: false, reason: 'Entry not found' };
  }

  // Entry must not be cancelled
  if (entry.status === 'cancelled') {
    return { canEdit: false, reason: 'Entry has been cancelled' };
  }

  // Get competition details
  const competitionId = entry.competition_id;
  if (!competitionId) {
    return { canEdit: false, reason: 'Invalid entry - no competition linked' };
  }

  const competition = await fetchCompetitionDetails(competitionId, supabase);
  if (!competition) {
    return { canEdit: false, reason: 'Competition not found' };
  }

  // Competition must not have started
  if (competition.startAt) {
    const startTime = new Date(competition.startAt);
    const now = new Date();
    
    if (now >= startTime) {
      return { canEdit: false, reason: 'Competition has already started' };
    }
  }

  // Competition must still allow registration
  if (competition.regCloseAt) {
    const closeTime = new Date(competition.regCloseAt);
    const now = new Date();
    
    if (now >= closeTime) {
      return { canEdit: false, reason: 'Registration has closed' };
    }
  }

  return { canEdit: true };
}

/**
 * Get time until competition starts (for countdown displays)
 */
export function getTimeUntilStart(startAt: string | null): number | null {
  if (!startAt) return null;
  const startTime = new Date(startAt).getTime();
  const now = Date.now();
  return Math.max(0, startTime - now);
}

/**
 * Check if competition has started
 */
export function hasCompetitionStarted(startAt: string | null): boolean {
  if (!startAt) return false;
  return new Date() >= new Date(startAt);
}

/**
 * Check if registration is open
 * ⚠️ ALWAYS use this function instead of checking status field!
 * Date validation takes priority over status field to prevent stale data issues.
 */
export function isRegistrationOpen(
  regOpenAt: string | null,
  regCloseAt: string | null
): boolean {
  const now = new Date();
  
  if (regOpenAt && now < new Date(regOpenAt)) return false;
  if (regCloseAt && now >= new Date(regCloseAt)) return false;
  
  return true;
}

/**
 * Check if a competition should be visible on tournament list pages
 * A competition is visible ONLY if registration is currently open
 * 
 * ⚠️ CRITICAL: This function checks dates BEFORE status field!
 * The status field can be stale if cron job hasn't run.
 * 
 * NOTE: Live competitions with closed registration are NOT shown on /tournaments page.
 * Users can view live tournaments on the /leaderboards page instead.
 */
export function isCompetitionVisible(competition: {
  status?: string;
  reg_open_at?: string | null;
  reg_close_at?: string | null;
  start_at?: string | null;
  end_at?: string | null;
}): boolean {
  // Check if registration is open by date (most reliable)
  // This is the ONLY condition - we don't show live tournaments on /tournaments page
  return isRegistrationOpen(competition.reg_open_at ?? null, competition.reg_close_at ?? null);
}

/**
 * Check if a tournament should be visible (has at least one visible competition)
 * 
 * ⚠️ USE THIS FUNCTION for all tournament filtering in UI components!
 * DO NOT manually check status or dates - this prevents the recurring bug.
 */
export function isTournamentVisible(tournament: {
  competitions?: Array<{
    status?: string;
    reg_open_at?: string | null;
    reg_close_at?: string | null;
  }>;
  end_date?: string;
}): boolean {
  // Safety check: Tournament has ended
  if (tournament.end_date) {
    const tournamentEnd = new Date(tournament.end_date);
    tournamentEnd.setHours(23, 59, 59, 999);
    if (new Date() > tournamentEnd) {
      return false;
    }
  }
  
  // Check if ANY competition is visible
  if (!tournament.competitions || tournament.competitions.length === 0) {
    return false;
  }
  
  return tournament.competitions.some(comp => isCompetitionVisible(comp));
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Format competition name with round info for ONE 2 ONE
 */
export function formatCompetitionName(competition: UnifiedCompetition): string {
  if (competition.type === 'inplay') {
    return competition.name;
  }

  // ONE 2 ONE - add round info
  if (competition.roundsCovered) {
    if (competition.roundsCovered.length === 4) {
      return `${competition.name} - All Rounds`;
    }
    return `${competition.name} - Round ${competition.roundsCovered[0]}`;
  }

  return competition.name;
}

/**
 * Format entry fee for display
 */
export function formatEntryFee(pennies: number): string {
  return `£${(pennies / 100).toFixed(2)}`;
}

/**
 * Get competition status badge info
 */
export function getStatusBadge(competition: UnifiedCompetition): {
  label: string;
  color: 'green' | 'yellow' | 'red' | 'gray';
} {
  const now = new Date();

  if (competition.startAt && now >= new Date(competition.startAt)) {
    return { label: 'Live', color: 'green' };
  }

  if (isRegistrationOpen(competition.regOpenAt, competition.regCloseAt)) {
    return { label: 'Open', color: 'green' };
  }

  if (competition.regCloseAt && now >= new Date(competition.regCloseAt)) {
    return { label: 'Closed', color: 'red' };
  }

  return { label: 'Upcoming', color: 'yellow' };
}

// ============================================================================
// ENTRY SUBMISSION
// ============================================================================

/**
 * Build entry data for submission - works for both InPlay and ONE 2 ONE
 */
export function buildEntryData(
  userId: string,
  competitionId: string,
  entryName: string,
  totalSalary: number,
  entryFeePaid: number,
  captainGolferId: string,
  status: 'draft' | 'submitted' = 'submitted'
) {
  return {
    user_id: userId,
    competition_id: competitionId,
    entry_name: entryName,
    total_salary: totalSalary,
    entry_fee_paid: entryFeePaid,
    captain_golfer_id: captainGolferId,
    status,
    submitted_at: status === 'submitted' ? new Date().toISOString() : null,
  };
}

/**
 * Build entry picks data for submission
 */
export function buildEntryPicks(
  entryId: string,
  golferIds: string[],
  salaries: number[]
) {
  return golferIds.map((golferId, index) => ({
    entry_id: entryId,
    golfer_id: golferId,
    slot_position: index + 1,
    salary_at_selection: salaries[index] || 0,
  }));
}
