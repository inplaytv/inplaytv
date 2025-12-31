import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * HEALTH CHECK & MONITORING SYSTEM
 * 
 * Purpose: Catch "silly little issues" before they become critical problems
 * 
 * This endpoint performs comprehensive validation of:
 * 1. Tournament/Competition Status Alignment
 * 2. Missing Critical Data (dates, statuses, etc.)
 * 3. Frontend/Backend Contract Violations
 * 4. Registration Timing Issues
 */

interface HealthIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  affectedEntity?: {
    type: 'tournament' | 'competition';
    id: string;
    name: string;
  };
  suggestedFix?: string;
}

interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  issues: HealthIssue[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    warningIssues: number;
    infoIssues: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const issues: HealthIssue[] = [];

    // ============================================
    // CHECK 1: Competition Status vs. Date Misalignment
    // ============================================
    const { data: competitions, error: compError } = await supabase
      .from('tournament_competitions')
      .select(`
        id,
        status,
        start_at,
        end_at,
        reg_open_at,
        reg_close_at,
        competition_types(name),
        tournament:tournaments(
          id,
          name,
          slug,
          status,
          start_date,
          end_date,
          is_visible
        )
      `)
      .eq('tournament.is_visible', true);

    if (compError) {
      console.error('Error fetching competitions:', compError);
      return NextResponse.json({
        status: 'error',
        message: 'Failed to fetch competition data',
        error: compError.message
      }, { status: 500 });
    }

    const now = new Date();

    for (const comp of competitions || []) {
      const tournament = Array.isArray(comp.tournament) ? comp.tournament[0] : comp.tournament;
      if (!tournament) continue;

      // Handle competition_types - could be array or object
      const compTypeName = Array.isArray(comp.competition_types) 
        ? (comp.competition_types[0] as any)?.name 
        : (comp.competition_types as any)?.name;

      // Check for NULL critical dates
      if (!comp.start_at || !comp.end_at) {
        issues.push({
          severity: 'critical',
          category: 'Missing Data',
          message: `Competition missing ${!comp.start_at ? 'start_at' : 'end_at'} date`,
          affectedEntity: {
            type: 'competition',
            id: comp.id,
            name: `${tournament.name} - ${compTypeName || 'Unknown'}`
          },
          suggestedFix: `UPDATE tournament_competitions SET ${!comp.start_at ? 'start_at = tournaments.start_date' : 'end_at = tournaments.end_date'} WHERE id = '${comp.id}'`
        });
      }

      if (!comp.reg_open_at || !comp.reg_close_at) {
        issues.push({
          severity: 'critical',
          category: 'Missing Data',
          message: `Competition missing ${!comp.reg_open_at ? 'reg_open_at' : 'reg_close_at'} date`,
          affectedEntity: {
            type: 'competition',
            id: comp.id,
            name: `${tournament.name} - ${compTypeName || 'Unknown'}`
          },
          suggestedFix: `UPDATE tournament_competitions SET ${!comp.reg_open_at ? 'reg_open_at = tournaments.registration_open_date' : 'reg_close_at = tournaments.registration_close_date'} WHERE id = '${comp.id}'`
        });
      }

      if (comp.start_at && comp.end_at) {
        const compStart = new Date(comp.start_at);
        const compEnd = new Date(comp.end_at);

        // Check status alignment with dates
        const expectedStatus = (() => {
          if (!comp.reg_open_at || !comp.reg_close_at) return null;
          const regOpen = new Date(comp.reg_open_at);
          const regClose = new Date(comp.reg_close_at);

          if (now < regOpen) return 'upcoming';
          if (now >= regOpen && now < regClose) return 'reg_open';
          if (now >= regClose && now < compStart) return 'reg_closed';
          if (now >= compStart && now < compEnd) return 'live';
          if (now >= compEnd) return 'completed';
          return null;
        })();

        if (expectedStatus && comp.status !== expectedStatus) {
          issues.push({
            severity: 'critical',
            category: 'Status Mismatch',
            message: `Competition status is '${comp.status}' but should be '${expectedStatus}' based on dates`,
            affectedEntity: {
              type: 'competition',
              id: comp.id,
              name: `${tournament.name} - ${compTypeName || 'Unknown'}`
            },
            suggestedFix: `Run the competition status update cron job or SQL: UPDATE tournament_competitions SET status = '${expectedStatus}' WHERE id = '${comp.id}'`
          });
        }
      }

      // Check tournament vs competition status alignment
      if (tournament.status === 'live' && comp.status === 'upcoming') {
        issues.push({
          severity: 'warning',
          category: 'Status Inconsistency',
          message: `Tournament is 'live' but competition is still 'upcoming'`,
          affectedEntity: {
            type: 'competition',
            id: comp.id,
            name: `${tournament.name} - ${compTypeName || 'Unknown'}`
          },
          suggestedFix: 'Review competition dates and update status accordingly'
        });
      }
    }

    // ============================================
    // CHECK 2: Tournament Status vs. Date Alignment
    // ============================================
    const { data: tournaments, error: tournError } = await supabase
      .from('tournaments')
      .select('id, name, slug, status, start_date, end_date, is_visible')
      .eq('is_visible', true);

    if (tournError) {
      console.error('Error fetching tournaments:', tournError);
    } else {
      for (const tournament of tournaments || []) {
        if (!tournament.start_date || !tournament.end_date) {
          issues.push({
            severity: 'critical',
            category: 'Missing Data',
            message: `Tournament missing ${!tournament.start_date ? 'start_date' : 'end_date'}`,
            affectedEntity: {
              type: 'tournament',
              id: tournament.id,
              name: tournament.name
            },
            suggestedFix: 'Set tournament start_date and end_date manually'
          });
          continue;
        }

        const tournStart = new Date(tournament.start_date);
        const tournEnd = new Date(tournament.end_date);
        tournEnd.setHours(23, 59, 59, 999);

        const expectedStatus = (() => {
          if (now < tournStart) return 'upcoming';
          if (now >= tournStart && now <= tournEnd) return 'live';
          if (now > tournEnd) return 'completed';
          return null;
        })();

        if (expectedStatus && tournament.status !== expectedStatus) {
          issues.push({
            severity: 'warning',
            category: 'Status Mismatch',
            message: `Tournament status is '${tournament.status}' but should be '${expectedStatus}' based on dates`,
            affectedEntity: {
              type: 'tournament',
              id: tournament.id,
              name: tournament.name
            },
            suggestedFix: `The tournament status cron job should update this automatically, or run: UPDATE tournaments SET status = '${expectedStatus}' WHERE id = '${tournament.id}'`
          });
        }
      }
    }

    // ============================================
    // CHECK 3: Frontend Filter Compatibility
    // ============================================
    // Ensure competitions have statuses that frontend can handle
    const validStatuses = ['upcoming', 'registration_open', 'registration_closed', 'live', 'completed'];
    
    for (const comp of competitions || []) {
      const tournament = Array.isArray(comp.tournament) ? comp.tournament[0] : comp.tournament;
      if (!tournament) continue;

      const compTypeName3 = Array.isArray(comp.competition_types) 
        ? (comp.competition_types[0] as any)?.name 
        : (comp.competition_types as any)?.name;

      if (!validStatuses.includes(comp.status)) {
        issues.push({
          severity: 'critical',
          category: 'Invalid Status',
          message: `Competition has invalid status '${comp.status}'. Frontend only supports: ${validStatuses.join(', ')}`,
          affectedEntity: {
            type: 'competition',
            id: comp.id,
            name: `${tournament.name} - ${compTypeName3 || 'Unknown'}`
          },
          suggestedFix: `Update to a valid status value`
        });
      }
    }

    // ============================================
    // CHECK 4: Registration Timing for Multi-Round Competitions
    // ============================================
    const multiRoundComps = ['Second Round', 'THE WEEKENDER', 'Final Strike'];
    
    for (const comp of competitions || []) {
      const tournament = Array.isArray(comp.tournament) ? comp.tournament[0] : comp.tournament;
      if (!tournament) continue;

      const compTypeName2 = Array.isArray(comp.competition_types) 
        ? (comp.competition_types[0] as any)?.name 
        : (comp.competition_types as any)?.name;
      if (!compTypeName2 || !multiRoundComps.includes(compTypeName2)) continue;

      if (!comp.reg_close_at || !tournament.start_date) continue;

      const regClose = new Date(comp.reg_close_at);
      const tournStart = new Date(tournament.start_date);

      // Multi-round competitions should close AFTER round 1 starts
      if (regClose < tournStart) {
        issues.push({
          severity: 'warning',
          category: 'Registration Timing',
          message: `${compTypeName2} competition closes before tournament Round 1 starts - should close before ${compTypeName2 === 'Second Round' ? 'Round 2' : compTypeName2 === 'THE WEEKENDER' ? 'Round 3' : 'Round 4'}`,
          affectedEntity: {
            type: 'competition',
            id: comp.id,
            name: `${tournament.name} - ${compTypeName2}`
          },
          suggestedFix: 'Update reg_close_at to match the appropriate round start time'
        });
      }
    }

    // ============================================
    // CHECK 5: Redundant Date Columns
    // ============================================
    const { data: tournamentColumns } = await supabase
      .from('tournaments')
      .select('id, name, registration_open_date, registration_close_date, reg_open_at, reg_close_at, registration_opens_at, registration_closes_at')
      .eq('is_visible', true)
      .limit(1);

    if (tournamentColumns && tournamentColumns.length > 0) {
      const t = tournamentColumns[0];
      const dateFields = [
        { name: 'registration_open_date', value: t.registration_open_date },
        { name: 'registration_close_date', value: t.registration_close_date },
        { name: 'reg_open_at', value: t.reg_open_at },
        { name: 'reg_close_at', value: t.reg_close_at },
        { name: 'registration_opens_at', value: t.registration_opens_at },
        { name: 'registration_closes_at', value: t.registration_closes_at }
      ];

      const definedFields = dateFields.filter(f => f.value !== null);
      if (definedFields.length > 2) {
        issues.push({
          severity: 'info',
          category: 'Schema Complexity',
          message: `Tournament has ${definedFields.length} registration date columns defined. This creates confusion about which is authoritative.`,
          affectedEntity: {
            type: 'tournament',
            id: t.id,
            name: t.name
          },
          suggestedFix: 'Consolidate to a single pair of registration date columns (recommend: reg_open_at, reg_close_at)'
        });
      }
    }

    // ============================================
    // SUMMARY & RESPONSE
    // ============================================
    const summary = {
      totalIssues: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'critical').length,
      warningIssues: issues.filter(i => i.severity === 'warning').length,
      infoIssues: issues.filter(i => i.severity === 'info').length
    };

    const overallStatus = 
      summary.criticalIssues > 0 ? 'critical' :
      summary.warningIssues > 0 ? 'warning' :
      'healthy';

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      issues: issues.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }),
      summary
    };

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error: any) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    }, { status: 500 });
  }
}
