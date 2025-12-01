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
function useCountdown(targetDate: string | null, status?: string) {
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

      // If status is reg_open, never show as closed - show "Open" instead
      if (diff <= 0) {
        if (status === 'reg_open') {
          setCountdown('Open');
        } else {
          setCountdown('Registration Closed');
        }
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
  }, [targetDate, status]);

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
  // Pass status to countdown hook so it respects database status field
  const countdown = useCountdown(competition.reg_close_at, competition.status);
  
  // Override countdown display based on competition status from database
  // If status is reg_open, show countdown even if date has passed
  const isClosed = competition.status === 'reg_open' ? false : countdown === 'Registration Closed';
  
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
          <div>
            <h3>{competition.competition_types.name}</h3>
            {competition.competition_types.rounds_count && (
              <p className={styles.competitionSubtitle}>
                🏌️ {competition.competition_types.rounds_count} Round{competition.competition_types.rounds_count !== 1 ? 's' : ''} ⛳
              </p>
            )}
          </div>
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
        {competition.reg_close_at && (
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
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
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

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTournamentData();
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
      
      // Sort competitions: Registration Open first, then by status priority
      const sortedCompetitions = [...data.competitions].sort((a, b) => {
        // Priority order: reg_open > live > reg_closed > upcoming > completed
        const statusPriority: Record<string, number> = {
          'reg_open': 1,
          'live': 2,
          'reg_closed': 3,
          'upcoming': 4,
          'completed': 5,
          'cancelled': 6,
          'draft': 7
        };
        
        const aPriority = statusPriority[a.status] || 99;
        const bPriority = statusPriority[b.status] || 99;
        
        return aPriority - bPriority;
      });
      
      setTournament({ ...data, competitions: sortedCompetitions });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      live: { label: 'Live', icon: 'fa-circle', color: '#ef4444' },
      completed: { label: 'Completed', icon: 'fa-check-circle', color: '#8b5cf6' },
      cancelled: { label: 'Cancelled', icon: 'fa-times-circle', color: '#ef4444' },
    };

    // PRIORITY 1: Check database status field FIRST - it always takes precedence
    if (competition.status === 'reg_open') {
      return statusConfig.reg_open;
    }
    
    if (competition.status === 'live') {
      return statusConfig.live;
    }
    
    if (competition.status === 'completed') {
      return statusConfig.completed;
    }
    
    if (competition.status === 'cancelled') {
      return statusConfig.cancelled;
    }

    // PRIORITY 2: Only calculate from dates if status is not explicitly set
    const now = new Date();
    const regCloseAt = competition.reg_close_at ? new Date(competition.reg_close_at) : null;
    const regOpenAt = competition.reg_open_at ? new Date(competition.reg_open_at) : null;
    const tournamentStart = tournament.start_date ? new Date(tournament.start_date) : null;
    const tournamentEnd = tournament.end_date ? new Date(tournament.end_date) : null;
    
    // Tournament end date should include the full day (set to end of day)
    const tournamentEndOfDay = tournamentEnd ? new Date(tournamentEnd) : null;
    if (tournamentEndOfDay) {
      tournamentEndOfDay.setHours(23, 59, 59, 999);
    }
    
    // Check if tournament is in progress
    if (tournamentStart && tournamentEndOfDay && now >= tournamentStart && now <= tournamentEndOfDay) {
      return statusConfig.live;
    }
    
    // Check if tournament has completed
    if (tournamentEndOfDay && now > tournamentEndOfDay) {
      return statusConfig.completed;
    }
    
    // Check if registration is closed but tournament hasn't started
    if (regCloseAt && now >= regCloseAt && tournamentStart && now < tournamentStart) {
      return statusConfig.reg_closed;
    }
    
    // Check if registration is open by dates
    if (regOpenAt && now >= regOpenAt && regCloseAt && now < regCloseAt) {
      return statusConfig.reg_open;
    }
    
    // Fall back to database status
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
        )}
      </div>
    </div>
  );
}
