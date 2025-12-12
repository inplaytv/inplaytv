/**
 * Validation utilities for competition entry creation
 * 
 * Purpose: Prevent invalid golfer selections in competition entries
 * Context: Admin bug where golfers not in tournament field were selectable
 * 
 * Key Rules:
 * 1. For InPlay competitions: golfers must be in assigned golfer group
 * 2. For ALL competitions: golfers must be in tournament_golfers table
 * 3. Golfer must not be withdrawn or cut (status check)
 */

import { createClient } from '@supabase/supabase-js';

export interface GolferValidationResult {
  isValid: boolean;
  golferId: string;
  golferName?: string;
  reason?: string;
  errors: string[];
}

export interface BulkValidationResult {
  allValid: boolean;
  validGolfers: string[];
  invalidGolfers: GolferValidationResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}

/**
 * Validate that a golfer is eligible for an InPlay competition
 * 
 * Checks:
 * 1. Golfer exists in competition's assigned golfer group
 * 2. Golfer is in tournament_golfers table
 * 3. Golfer status is 'confirmed' (not withdrawn/cut)
 */
export async function validateGolferForInPlayCompetition(
  supabase: ReturnType<typeof createClient>,
  competitionId: string,
  golferId: string
): Promise<GolferValidationResult> {
  const errors: string[] = [];
  
  try {
    // Get competition details and tournament_id
    const { data: competition, error: compError } = await supabase
      .from('tournament_competitions')
      .select(`
        id,
        tournament_id,
        assigned_golfer_group_id,
        tournaments (name)
      `)
      .eq('id', competitionId)
      .single();

    if (compError || !competition) {
      errors.push('Competition not found');
      return {
        isValid: false,
        golferId,
        reason: 'Competition not found',
        errors
      };
    }

    // Get golfer details
    const { data: golfer, error: golferError } = await supabase
      .from('golfers')
      .select('id, name, first_name, last_name')
      .eq('id', golferId)
      .single();

    if (golferError || !golfer) {
      errors.push('Golfer not found');
      return {
        isValid: false,
        golferId,
        reason: 'Golfer not found',
        errors
      };
    }

    const golferName = golfer.name || `${golfer.first_name} ${golfer.last_name}`;

    // Check 1: Is golfer in tournament_golfers table?
    const { data: tournamentGolfer, error: tgError } = await supabase
      .from('tournament_golfers')
      .select('golfer_id, status')
      .eq('tournament_id', competition.tournament_id)
      .eq('golfer_id', golferId)
      .single();

    if (tgError || !tournamentGolfer) {
      errors.push(`${golferName} is not in ${competition.tournaments?.name || 'this tournament'} field`);
    } else if (tournamentGolfer.status !== 'confirmed') {
      errors.push(`${golferName} status is '${tournamentGolfer.status}' (withdrawn or cut)`);
    }

    // Check 2: Is golfer in competition's assigned golfer group?
    if (competition.assigned_golfer_group_id) {
      const { data: groupMember, error: gmError } = await supabase
        .from('golfer_group_members')
        .select('golfer_id')
        .eq('group_id', competition.assigned_golfer_group_id)
        .eq('golfer_id', golferId)
        .single();

      if (gmError || !groupMember) {
        errors.push(`${golferName} is not in competition's assigned golfer group`);
      }
    } else {
      // No group assigned - this is a warning but not fatal
      console.warn(`⚠️ Competition ${competitionId} has no assigned_golfer_group_id`);
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      golferId,
      golferName,
      reason: isValid ? undefined : errors.join('; '),
      errors
    };
  } catch (error) {
    console.error('Error validating golfer:', error);
    errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      isValid: false,
      golferId,
      reason: 'Validation failed',
      errors
    };
  }
}

/**
 * Validate multiple golfers for an InPlay competition
 * 
 * Use this before creating competition_entry_picks records
 */
export async function validateGolfersForInPlayCompetition(
  supabase: ReturnType<typeof createClient>,
  competitionId: string,
  golferIds: string[]
): Promise<BulkValidationResult> {
  const results = await Promise.all(
    golferIds.map(golferId => 
      validateGolferForInPlayCompetition(supabase, competitionId, golferId)
    )
  );

  const validGolfers = results
    .filter(r => r.isValid)
    .map(r => r.golferId);

  const invalidGolfers = results.filter(r => !r.isValid);

  return {
    allValid: invalidGolfers.length === 0,
    validGolfers,
    invalidGolfers,
    summary: {
      total: golferIds.length,
      valid: validGolfers.length,
      invalid: invalidGolfers.length
    }
  };
}

/**
 * Get all valid golfers for an InPlay competition
 * 
 * Returns only golfers that pass all validation checks
 * Use this to populate golfer picker UI
 */
export async function getValidGolfersForInPlayCompetition(
  supabase: ReturnType<typeof createClient>,
  competitionId: string
): Promise<{
  golfers: Array<{
    id: string;
    name: string;
    country: string | null;
    dg_id: number | null;
    salary?: number;
  }>;
  tournamentName: string;
  error: string | null;
}> {
  try {
    // Get competition with tournament info
    const { data: competition, error: compError } = await supabase
      .from('tournament_competitions')
      .select(`
        tournament_id,
        assigned_golfer_group_id,
        tournaments (name)
      `)
      .eq('id', competitionId)
      .single();

    if (compError || !competition) {
      return {
        golfers: [],
        tournamentName: '',
        error: 'Competition not found'
      };
    }

    // Build query to get valid golfers
    let query = supabase
      .from('golfers')
      .select(`
        id,
        name,
        country,
        dg_id
      `);

    // If competition has assigned group, filter by group membership
    if (competition.assigned_golfer_group_id) {
      // Get golfers in the group
      const { data: groupMembers } = await supabase
        .from('golfer_group_members')
        .select('golfer_id')
        .eq('group_id', competition.assigned_golfer_group_id);

      if (groupMembers && groupMembers.length > 0) {
        const golferIds = groupMembers.map(gm => gm.golfer_id);
        query = query.in('id', golferIds);
      } else {
        // Empty group - no valid golfers
        return {
          golfers: [],
          tournamentName: competition.tournaments?.name || '',
          error: 'No golfers in assigned group'
        };
      }
    }

    // Execute query
    const { data: golfers, error: golfersError } = await query;

    if (golfersError) {
      return {
        golfers: [],
        tournamentName: competition.tournaments?.name || '',
        error: `Failed to fetch golfers: ${golfersError.message}`
      };
    }

    // Filter to only golfers in tournament_golfers with confirmed status
    const { data: tournamentGolfers } = await supabase
      .from('tournament_golfers')
      .select('golfer_id, salary, status')
      .eq('tournament_id', competition.tournament_id)
      .eq('status', 'confirmed');

    if (!tournamentGolfers) {
      return {
        golfers: [],
        tournamentName: competition.tournaments?.name || '',
        error: 'No confirmed golfers in tournament'
      };
    }

    // Create map for quick lookup
    const tournamentGolferMap = new Map(
      tournamentGolfers.map(tg => [tg.golfer_id, tg])
    );

    // Filter and enrich golfers
    const validGolfers = (golfers || [])
      .filter(g => tournamentGolferMap.has(g.id))
      .map(g => ({
        ...g,
        salary: tournamentGolferMap.get(g.id)?.salary
      }))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return {
      golfers: validGolfers,
      tournamentName: competition.tournaments?.name || '',
      error: null
    };
  } catch (error) {
    console.error('Error getting valid golfers:', error);
    return {
      golfers: [],
      tournamentName: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Validate tournament golfers relationship
 * 
 * Check if specific golfer exists in tournament
 */
export async function validateGolferInTournament(
  supabase: ReturnType<typeof createClient>,
  tournamentId: string,
  golferId: string
): Promise<{
  isValid: boolean;
  status?: string;
  reason?: string;
}> {
  const { data, error } = await supabase
    .from('tournament_golfers')
    .select('golfer_id, status')
    .eq('tournament_id', tournamentId)
    .eq('golfer_id', golferId)
    .single();

  if (error || !data) {
    return {
      isValid: false,
      reason: 'Golfer not in tournament field'
    };
  }

  if (data.status !== 'confirmed') {
    return {
      isValid: false,
      status: data.status,
      reason: `Golfer status is '${data.status}'`
    };
  }

  return {
    isValid: true,
    status: data.status
  };
}
