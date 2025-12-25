'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './tournament-detail.module.css';

interface CompetitionType {
  id: string;
  name: string;
  slug: string;
  rounds_count?: number;
}

interface Competition {
  id: string;
  tournament_id: string;
  competition_type_id: string;
  entry_fee_pennies: number;
  entrants_cap: number;
  admin_fee_percent: number;
  guaranteed_prize_pool_pennies?: number;
  first_place_prize_pennies?: number;
  reg_open_at: string | null;
  reg_close_at: string | null;
  start_at: string | null;
  end_at: string | null;
  status: string;
  competition_types: CompetitionType;
}

interface Tournament {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string;
  status: string;
  image_url: string | null;
  competitions: Competition[];
}

interface One2OneTemplate {
  id: string;
  name: string;
  short_name: string;
  description: string;
  entry_fee_pennies: number;
  admin_fee_percent: number;
  rounds_covered: number[];
  reg_close_round: number | null;
  tournament_id: string;
  reg_close_at: string | null;
  is_open: boolean;
  available_instances: number;
}

// Extract tour from description or name
function extractTour(description: string | null, name?: string): 'PGA' | 'LPGA' | 'European' | null {
  const text = `${description || ''} ${name || ''}`.toLowerCase();
  // Check LPGA first to avoid matching 'PGA' within 'LPGA'
  if (text.includes('lpga')) return 'LPGA';
  if (text.includes('european')) return 'European';
  if (text.includes('pga')) return 'PGA';
  return null;
}

// Custom hook for individual countdown timer
function useCountdown(targetDate: string | null, status?: string, closedText?: string, competitionStartDate?: string | null) {
  const [countdown, setCountdown] = useState('Calculating...');

  useEffect(() => {
    if (!targetDate) {
      setCountdown('TBA');
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      // If registration time has expired
      if (diff <= 0) {
        // Check if we have a competition start date and it hasn't started yet
        if (competitionStartDate) {
          const compStart = new Date(competitionStartDate).getTime();
          const timeUntilStart = compStart - now;
          
          if (timeUntilStart > 0) {
            // Show countdown to competition start
            const days = Math.floor(timeUntilStart / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeUntilStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeUntilStart % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeUntilStart % (1000 * 60)) / 1000);

            if (days > 0) {
              setCountdown(`Starts in ${days}d ${hours}h ${minutes}m ${seconds}s`);
            } else if (hours > 0) {
              setCountdown(`Starts in ${hours}h ${minutes}m ${seconds}s`);
            } else {
              setCountdown(`Starts in ${minutes}m ${seconds}s`);
            }
            return;
          }
        }
        // No start date or it has passed
        setCountdown(closedText || 'Closed');
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
          setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        } else if (hours > 0) {
          setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setCountdown(`${minutes}m ${seconds}s`);
        }
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [targetDate, status, closedText, competitionStartDate]);

  return countdown;
}

// Competition Card Component with its own countdown
function CompetitionCard({ 
  competition, 
  tournament, 
  prizePool,
  firstPlacePrize,
  isWinnerTakesAll,
  statusBadge,
  canRegister,
  formatCurrency,
  formatDateRange
}: any) {
  // Use statusBadge to determine what countdown to show
  const isLive = statusBadge.label === 'Live';
  const isAwaitingStart = statusBadge.label === 'Awaiting Start';
  
  // If live or awaiting start, no countdown needed
  // If can register, countdown to reg close
  // Otherwise, show closed message
  const countdown = useCountdown(
    canRegister ? competition.reg_close_at : null, 
    competition.status, 
    isLive ? 'Live Now' : (isAwaitingStart ? 'Starting Soon' : 'Registration Closed'),
    competition.start_at
  );
  
  // Registration is closed if countdown says so OR if canRegister is false
  const isClosed = !canRegister;
  const isStartingSoon = countdown.startsWith('Starts in');
  
  const tour = extractTour(tournament.description, tournament.name);

  return (
    <div className={`${styles.competitionCard} ${styles.glass}`} style={{ position: 'relative' }}>
      {/* Status Badge Corner */}
      <div 
        className={styles.statusCorner} 
        style={{ background: statusBadge.color }}
      >
        <i className={`fas ${statusBadge.icon}`}></i>
        <span>{statusBadge.label}</span>
      </div>

      {/* Tournament Dates - Outside card content */}
      <div className={styles.tournamentDatesHeader}>
        <i className="fas fa-calendar-alt"></i>
        <span>{formatDateRange(tournament.start_date, tournament.end_date)}</span>
      </div>

      <div className={styles.cardContent}>
        {/* Competition Type Header */}
        <div className={styles.cardHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h3>{competition.competition_types.name}</h3>
            {tour && (
              <div className={`${styles.tourBadge} ${
                tour === 'PGA' ? styles.tourBadgePGA :
                tour === 'LPGA' ? styles.tourBadgeLPGA :
                styles.tourBadgeEuropean
              }`} style={{ position: 'static', margin: 0, fontSize: '0.5rem', padding: '0.2rem 0.5rem' }}>
                {tour} TOUR
              </div>
            )}
          </div>
          {competition.competition_types.rounds_count && (
            <p className={styles.competitionSubtitle}>
              🏌️ {competition.competition_types.rounds_count} Round{competition.competition_types.rounds_count !== 1 ? 's' : ''} ⛳
            </p>
          )}
        </div>

        {/* Stats Grid - All Boxes */}
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <i className="fas fa-flag-checkered"></i>
            </div>
            <div>
              <div className={styles.statLabel}>Prize Pool</div>
              <div className={styles.statValue}>{formatCurrency(Math.round(prizePool * 100))}</div>
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <i className="fas fa-medal"></i>
            </div>
            <div>
              <div className={styles.statLabel}>1st Place</div>
              <div className={styles.statValue}>
                {isWinnerTakesAll ? (
                  <span className={styles.winnerTakesAll}>Winner Takes All</span>
                ) : (
                  formatCurrency(Math.round(firstPlacePrize * 100))
                )}
              </div>
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <i className="fas fa-ticket-alt"></i>
            </div>
            <div>
              <div className={styles.statLabel}>Entry Fee</div>
              <div className={styles.statValue}>{formatCurrency(competition.entry_fee_pennies)}</div>
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <i className="fas fa-users"></i>
            </div>
            <div>
              <div className={styles.statLabel}>Max Entries</div>
              <div className={styles.statValue}>
                {competition.entrants_cap === 0 ? '∞' : competition.entrants_cap.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Registration Countdown */}
        {(competition.reg_close_at || competition.start_at) && !isLive && (
          <div className={styles.registrationCountdown} style={{
            background: isStartingSoon ? 'rgba(59, 130, 246, 0.1)' : (isClosed ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'),
            borderTop: isStartingSoon ? '1px solid rgba(59, 130, 246, 0.2)' : (isClosed ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)'),
            borderBottom: isStartingSoon ? '1px solid rgba(59, 130, 246, 0.2)' : (isClosed ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)')
          }}>
            <div className={styles.countdownIcon} style={{
              color: isStartingSoon ? '#3b82f6' : (isClosed ? '#ef4444' : '#10b981')
            }}>
              <i className="fas fa-clock"></i>
            </div>
            <div className={styles.countdownContent}>
              <div className={styles.countdownLabel}>
                {isStartingSoon ? 'Competition' : (isClosed ? 'Registration' : 'Registration Closes')}
              </div>
              <div className={styles.countdownTimer} key={countdown} style={{
                color: isStartingSoon ? '#3b82f6' : (isClosed ? '#ef4444' : '#10b981')
              }}>{countdown}</div>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <div className={styles.cardActions}>
          {canRegister ? (
            <Link 
              href={`/build-team/${competition.id}`}
              className={styles.btnPlay}
            >
              <span className={styles.btnContent}>
                <i className="fas fa-users"></i>
                <span>Build Your Team</span>
              </span>
              <div className={styles.btnShine}></div>
            </Link>
          ) : statusBadge.label === 'Live' ? (
            <Link 
              href={`/leaderboards`}
              className={styles.btnPlay}
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
            >
              <span className={styles.btnContent}>
                <i className="fas fa-chart-line"></i>
                <span>View Live Leaderboard</span>
              </span>
              <div className={styles.btnShine}></div>
            </Link>
          ) : (
            <button className={styles.btnDisabled} disabled>
              <i className={`fas ${statusBadge.icon}`}></i>
              <span>{statusBadge.label}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ONE 2 ONE Card Component
function One2OneCard({ 
  template,
  tournament,
  formatCurrency
}: {
  template: One2OneTemplate;
  tournament: Tournament;
  formatCurrency: (pennies: number) => string;
}) {
  const countdown = useCountdown(template.reg_close_at, template.is_open ? 'reg_open' : 'reg_closed');
  const isClosed = !template.is_open || countdown === 'Registration Closed';

  // Calculate prize pool (winner takes all, less admin fee)
  const prizePool = (template.entry_fee_pennies * 2) * (1 - template.admin_fee_percent / 100);

  // Get round description
  const getRoundDescription = () => {
    if (template.rounds_covered.length === 4) {
      return 'ALL 4 ROUNDS';
    }
    const roundNum = template.rounds_covered[0];
    const roundSuffix = ['TH', 'ST', 'ND', 'RD', 'TH'];
    const suffix = roundSuffix[roundNum] || 'TH';
    return `${roundNum}${suffix} ROUND`;
  };

  return (
    <div className={`${styles.competitionCard} ${styles.glass}`} style={{ position: 'relative' }}>
      {/* ONE 2 ONE Badge */}
      <div 
        className={styles.statusCorner} 
        style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
      >
        <i className="fas fa-users"></i>
        <span>1v1</span>
      </div>

      {/* Tournament Dates */}
      <div className={styles.tournamentDatesHeader}>
        <i className="fas fa-calendar-alt"></i>
        <span>{getRoundDescription()}</span>
      </div>

      <div className={styles.cardContent}>
        {/* Header */}
        <div className={styles.cardHeader}>
          <div>
            <h3>{template.short_name}</h3>
            <p className={styles.competitionSubtitle}>
              🏆 Head-to-Head Competition ⚔️
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <i className="fas fa-trophy"></i>
            </div>
            <div>
              <div className={styles.statLabel}>Winner Takes</div>
              <div className={styles.statValue}>{formatCurrency(Math.round(prizePool * 100))}</div>
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <i className="fas fa-ticket-alt"></i>
            </div>
            <div>
              <div className={styles.statLabel}>Entry Fee</div>
              <div className={styles.statValue}>{formatCurrency(template.entry_fee_pennies)}</div>
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <i className="fas fa-users"></i>
            </div>
            <div>
              <div className={styles.statLabel}>Max Entries</div>
              <div className={styles.statValue}>2 Entries Only</div>
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <i className="fas fa-gamepad"></i>
            </div>
            <div>
              <div className={styles.statLabel}>Available Matches</div>
              <div className={styles.statValue}>
                {template.available_instances === 0 ? 'Join to Start' : `${template.available_instances} Open`}
              </div>
            </div>
          </div>
        </div>

        {/* Registration Countdown */}
        {template.reg_close_at && (
          <div className={styles.registrationCountdown} style={{
            background: isClosed ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            borderTop: isClosed ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
            borderBottom: isClosed ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <div className={styles.countdownIcon} style={{
              color: isClosed ? '#ef4444' : '#10b981'
            }}>
              <i className="fas fa-clock"></i>
            </div>
            <div className={styles.countdownContent}>
              <div className={styles.countdownLabel}>{isClosed ? 'Registration' : 'Registration Closes'}</div>
              <div className={styles.countdownTimer} key={countdown} style={{
                color: isClosed ? '#ef4444' : '#10b981'
              }}>{isClosed && countdown === 'Registration Closed' ? 'Closed' : countdown}</div>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <div className={styles.cardActions}>
          {!isClosed ? (
            <Link 
              href={`/one-2-one?tournament=${tournament.id}&template=${template.id}`}
              className={styles.btnPlay}
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
            >
              <span className={styles.btnContent}>
                <i className="fas fa-swords"></i>
                <span>Find Match</span>
              </span>
              <div className={styles.btnShine}></div>
            </Link>
          ) : (
            <button className={styles.btnDisabled} disabled>
              <i className="fas fa-door-closed"></i>
              <span>Registration Closed</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [one2OneTemplates, setOne2OneTemplates] = useState<One2OneTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTournamentData();
    fetchOne2OneTemplates();
  }, [slug]);

  const fetchTournamentData = async () => {
    try {
      const res = await fetch(`/api/tournaments/${slug}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (!res.ok) throw new Error('Tournament not found');
      
      const data = await res.json();
      
      // Sort competitions: maintain type order, but closed ones drop to bottom
      const now = new Date();
      const sortedCompetitions = [...data.competitions].sort((a, b) => {
        // Competition type order (how they're played during tournament)
        const typeOrder: Record<string, number> = {
          'full-course': 1,      // Main competition - all 4 rounds (closes start of round 1)
          'one-2-one': 2,        // Runs all 4 days - can be played each round (stays open)
          'beat-the-cut': 3,     // Rounds 1-2 (closes start of round 1)
          'first-strike': 4,     // Round 1 only (closes start of round 1)
          'the-weekender': 5,    // Rounds 1-2 (closes start of round 3)
          'final-strike': 6      // Rounds 1-3 (closes start of round 4)
        };
        
        const aTypeOrder = typeOrder[a.competition_types.slug] || 99;
        const bTypeOrder = typeOrder[b.competition_types.slug] || 99;
        
        // Check if registration is closed based on reg_close_at timestamp
        const aIsClosed = a.reg_close_at ? now >= new Date(a.reg_close_at) : false;
        const bIsClosed = b.reg_close_at ? now >= new Date(b.reg_close_at) : false;
        
        // Closed competitions go to bottom, but maintain type order within each group
        if (aIsClosed && !bIsClosed) return 1;
        if (!aIsClosed && bIsClosed) return -1;
        
        // Within same group (both open or both closed), sort by type order
        return aTypeOrder - bTypeOrder;
      });
      
      setTournament({ ...data, competitions: sortedCompetitions });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOne2OneTemplates = async () => {
    try {
      const res = await fetch(`/api/tournaments/${slug}/one-2-one`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setOne2OneTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('Error fetching ONE 2 ONE templates:', err);
      // Don't set error state, just log it - ONE 2 ONE is optional
    }
  };

  const formatCurrency = (pennies: number) => {
    const pounds = pennies / 100;
    if (pounds >= 1000) {
      const thousands = pounds / 1000;
      return `£${thousands.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}k`;
    }
    return `£${pounds.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (startDate.toDateString() === endDate.toDateString()) {
      return formatDate(start);
    }
    
    const sameMonth = startDate.getMonth() === endDate.getMonth();
    const sameYear = startDate.getFullYear() === endDate.getFullYear();
    
    if (sameMonth && sameYear) {
      return `${startDate.getDate()}-${endDate.getDate()} ${startDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
    }
    
    return `${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const getStatusBadge = (competition: Competition, tournament: Tournament) => {
    const statusConfig: Record<string, { label: string; icon: string; color: string }> = {
      draft: { label: 'Draft', icon: 'fa-pencil-alt', color: '#6b7280' },
      upcoming: { label: 'Upcoming', icon: 'fa-clock', color: '#3b82f6' },
      reg_open: { label: 'Registration Open', icon: 'fa-door-open', color: '#10b981' },
      reg_closed: { label: 'Registration Closed', icon: 'fa-door-closed', color: '#f59e0b' },
      awaiting_start: { label: 'Awaiting Start', icon: 'fa-hourglass-half', color: '#3b82f6' },
      live: { label: 'Live', icon: 'fa-circle', color: '#ef4444' },
      completed: { label: 'Completed', icon: 'fa-check-circle', color: '#8b5cf6' },
      cancelled: { label: 'Cancelled', icon: 'fa-times-circle', color: '#ef4444' },
    };

    const now = new Date();
    const regCloseAt = competition.reg_close_at ? new Date(competition.reg_close_at) : null;
    const regOpenAt = competition.reg_open_at ? new Date(competition.reg_open_at) : null;
    const tournamentEnd = tournament.end_date ? new Date(tournament.end_date) : null;
    
    // ========================================
    // ARCHITECTURAL RULE: COMPETITION REGISTRATION IS INDEPENDENT OF TOURNAMENT STATUS
    // 
    // Tournament Status (when golf happens):
    //   - start_date: When first round tees off
    //   - end_date: When final round completes
    // 
    // Competition Registration (when users can enter):
    //   - reg_open_at: When registration opens
    //   - reg_close_at: When registration closes
    // 
    // These are SEPARATE concepts:
    //   - A tournament can be "In Play" while specific competitions still accept entries
    //   - Example: ONE 2 ONE allows registration throughout all tournament rounds
    //   - Example: THE WEEKENDER closes before R3, Final Strike closes before R4
    // 
    // NEVER use tournament.start_date to gate competition registration!
    // ONLY check competition.reg_close_at for registration status
    // ========================================
    
    console.log(`📊 ${competition.competition_types?.name || 'Unknown'}:`, {
      reg_close_at: competition.reg_close_at,
      reg_open_at: competition.reg_open_at,
      start_at: competition.start_at,
      tournament_end: tournament.end_date,
      regCloseAt: regCloseAt?.toISOString(),
      now: now.toISOString(),
      isPastDeadline: regCloseAt ? now >= regCloseAt : 'no deadline',
      status: competition.status
    });
    
    // Tournament end date should include the full day (set to end of day)
    const tournamentEndOfDay = tournamentEnd ? new Date(tournamentEnd) : null;
    if (tournamentEndOfDay) {
      tournamentEndOfDay.setHours(23, 59, 59, 999);
    }
    
    console.log(`📊 ${competition.competition_types?.name || 'Unknown'} DATES:`, {
      tournamentEnd: tournamentEnd?.toISOString(),
      tournamentEndOfDay: tournamentEndOfDay?.toISOString(),
      compStartAt: competition.start_at ? new Date(competition.start_at).toISOString() : null,
      isAfterRegClose: regCloseAt ? now >= regCloseAt : false,
      isAfterCompStart: competition.start_at ? now >= new Date(competition.start_at) : false,
      isBeforeTournEnd: tournamentEndOfDay ? now <= tournamentEndOfDay : false
    });
    
    // PRIORITY 1: Check if tournament has completed
    if (tournamentEndOfDay && now > tournamentEndOfDay) {
      return statusConfig.completed;
    }
    
    // PRIORITY 2: Check database status for cancelled
    if (competition.status === 'cancelled') {
      return statusConfig.cancelled;
    }
    
    // PRIORITY 3: Check if registration is currently open by dates (MOST IMPORTANT!)
    // This must come BEFORE checking database status
    
    // Parse competition start date if available
    const compStartAt = competition.start_at ? new Date(competition.start_at) : null;
    
    // If we have a close date and it's passed, registration is definitely closed
    if (regCloseAt && now >= regCloseAt) {
      // Registration has closed - check if competition has actually started
      if (compStartAt && now >= compStartAt) {
        // Competition has started
        if (tournamentEndOfDay && now <= tournamentEndOfDay) {
          // Tournament is still in progress - show as live
          return statusConfig.live;
        } else {
          // Tournament has ended - show as completed
          return statusConfig.completed;
        }
      } else if (compStartAt && now < compStartAt) {
        // Competition hasn't started yet - show as awaiting start with countdown
        return statusConfig.awaiting_start;
      } else {
        // No start date set, just show registration closed
        return statusConfig.reg_closed;
      }
    }
    
    // If we have both open and close dates and we're in the window
    if (regOpenAt && regCloseAt) {
      if (now >= regOpenAt && now < regCloseAt) {
        // Registration is open - regardless of database status field
        return statusConfig.reg_open;
      }
    }
    
    // PRIORITY 4: Check database status only if no clear date-based answer
    // This handles cases where dates aren't set or we need to fall back
    if (competition.status === 'reg_open' && (!regCloseAt || now < regCloseAt)) {
      return statusConfig.reg_open;
    }
    
    if (competition.status === 'inplay' || competition.status === 'live') {
      // If explicitly marked as live, but dates say reg is still open, trust the dates (handled above)
      // If we get here, show as live
      if (tournamentEndOfDay && now <= tournamentEndOfDay) {
        return statusConfig.live;
      }
    }
    
    // Fall back to database status or draft
    const config = statusConfig[competition.status] || statusConfig.draft;
    return { ...config };
  };

  const calculatePrizePool = (comp: Competition) => {
    // Use guaranteed prize pool from database if available AND greater than 0, otherwise auto-calculate
    if (comp.guaranteed_prize_pool_pennies != null && comp.guaranteed_prize_pool_pennies > 0) {
      return comp.guaranteed_prize_pool_pennies / 100; // Convert pennies to pounds
    }
    // Auto-calculate: entry_fee × max_entries × (1 - admin_fee%)
    return (comp.entry_fee_pennies / 100) * comp.entrants_cap * (1 - comp.admin_fee_percent / 100);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading tournament...</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className={styles.errorContainer}>
        <i className="fas fa-exclamation-triangle"></i>
        <h2>Tournament Not Found</h2>
        <p>{error || 'The tournament you are looking for does not exist.'}</p>
        <Link href="/tournaments" className={styles.backButton}>
          <i className="fas fa-arrow-left"></i>
          Back to Tournaments
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Animated Background */}
      <div className={styles.backgroundAnimation}>
        <div className={styles.gradientOrb1}></div>
        <div className={styles.gradientOrb2}></div>
        <div className={styles.gradientOrb3}></div>
      </div>

      {/* Hero Banner with Tournament Image */}
      <div className={styles.heroSection} style={{ height: '120px', minHeight: '120px', marginTop: '0' }}>
        <div 
          className={styles.heroBackground}
          style={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
          }}
        >
          <div className={styles.heroOverlay}></div>
        </div>
        
        <div className={styles.heroContent}>
          <div className={styles.heroTitle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{tournament.name}</h1>
              {extractTour(tournament.description, tournament.name) && (
                <div className={`${styles.tourBadge} ${
                  extractTour(tournament.description, tournament.name) === 'PGA' ? styles.tourBadgePGA :
                  extractTour(tournament.description, tournament.name) === 'LPGA' ? styles.tourBadgeLPGA :
                  styles.tourBadgeEuropean
                }`} style={{ position: 'static', margin: 0, fontSize: '0.625rem', padding: '0.25rem 0.625rem' }}>
                  {extractTour(tournament.description, tournament.name)} TOUR
                </div>
              )}
            </div>
            <div style={{ textAlign: 'center', width: '100%' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                <i className="fas fa-map-marker-alt" style={{ marginRight: '0.5rem' }}></i>
                {tournament.location || 'Venue TBA'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Competitions Section */}
      <div className={styles.mainContent}>
        {tournament.competitions.length === 0 ? (
          <div className={`${styles.emptyState} ${styles.glass}`}>
            <div className={styles.emptyIcon}>
              <i className="fas fa-calendar-plus"></i>
            </div>
            <h3>Competitions Coming Soon</h3>
            <p>This tournament hasn't opened for registration yet. Check back soon to see available competitions!</p>
            <Link href="/tournaments" className={styles.emptyButton}>
              <i className="fas fa-arrow-left"></i>
              Browse Other Tournaments
            </Link>
          </div>
        ) : (
          <>
            {/* Main Competitions */}
            <div className={styles.competitionsGrid}>
              {tournament.competitions.map((competition) => {
                const prizePool = calculatePrizePool(competition);
                const isWinnerTakesAll = competition.entrants_cap <= 2;
                // Use first_place_prize_pennies from database if available AND greater than 0, otherwise auto-calculate
                const firstPlacePrize = (competition.first_place_prize_pennies != null && competition.first_place_prize_pennies > 0)
                  ? competition.first_place_prize_pennies / 100
                  : (isWinnerTakesAll ? prizePool : prizePool * 0.25);
                const statusBadge = getStatusBadge(competition, tournament);
                
                // Check if registration is actually open (based on status badge which already handles status field + dates)
                const canRegister = statusBadge.label === 'Registration Open';

                return (
                  <CompetitionCard
                    key={competition.id}
                    competition={competition}
                    tournament={tournament}
                    prizePool={prizePool}
                    firstPlacePrize={firstPlacePrize}
                    isWinnerTakesAll={isWinnerTakesAll}
                    statusBadge={statusBadge}
                    canRegister={canRegister}
                    formatCurrency={formatCurrency}
                    formatDateRange={formatDateRange}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
