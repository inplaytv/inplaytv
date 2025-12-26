'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import InsufficientFundsModal from '@/components/InsufficientFundsModal';
import TournamentBackgroundControls from '@/components/TournamentBackgroundControls';
import styles from './tournaments.module.css';

interface CompetitionType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  rounds_count?: number;
}

interface Competition {
  id: string;
  entry_fee_pennies: number;
  entrants_cap: number;
  admin_fee_percent: number;
  guaranteed_prize_pool_pennies?: number;
  first_place_prize_pennies?: number;
  status: string;
  reg_open_at: string | null;
  reg_close_at: string | null;
  competition_types: CompetitionType;
}

interface Tournament {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  start_date: string;
  end_date: string;
  status: string;
  image_url: string | null;
  description: string | null;
  competitions: Competition[];
  featured_competition: Competition | null;
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

// Custom hook for countdown timer - v2
function useCountdown(targetDate: string | null) {
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

      if (diff <= 0) {
        setCountdown('Registration Closed');
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
  }, [targetDate]);

  return countdown;
}

// Competition Countdown Component
function CompetitionCountdown({ regCloseAt, status }: { regCloseAt: string | null; status: string }) {
  const countdown = useCountdown(regCloseAt);
  const isClosed = countdown === 'Registration Closed';
  
  // Determine status display - ALWAYS CHECK DATES FIRST, NOT DATABASE STATUS
  const getStatusInfo = () => {
    // PRIORITY 1: Check actual date to determine if registration is closed
    if (regCloseAt) {
      const now = new Date();
      const closeDate = new Date(regCloseAt);
      const hasClosed = now >= closeDate;
      
      if (hasClosed) {
        // Registration has closed - show as LIVE (not checking tournament dates here)
        return { label: 'LIVE', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', icon: 'fa-circle' };
      } else {
        // Registration is still open
        return { label: 'REGISTRATION OPEN', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', icon: 'fa-check-circle' };
      }
    }
    
    // PRIORITY 2: No reg_close_at date - fall back to database status
    if (status === 'completed') {
      return { label: 'COMPLETED', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)', icon: 'fa-flag-checkered' };
    } else if (status === 'live') {
      return { label: 'LIVE', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', icon: 'fa-circle' };
    } else if (status === 'reg_open') {
      return { label: 'REGISTRATION OPEN', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', icon: 'fa-check-circle' };
    }
    
    return { label: 'UPCOMING', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)', icon: 'fa-clock' };
  };

  const statusInfo = getStatusInfo();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginTop: '0.5rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.625rem',
        background: statusInfo.bgColor,
        borderRadius: '6px',
        border: `1px solid ${statusInfo.color}30`,
        whiteSpace: 'nowrap'
      }}>
        <i className={`fas ${statusInfo.icon}`} style={{ color: statusInfo.color, fontSize: '0.7rem' }}></i>
        <span style={{ 
          fontSize: '0.65rem', 
          fontWeight: 600, 
          color: statusInfo.color,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {statusInfo.label}
        </span>
      </div>
      {regCloseAt && !isClosed && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.375rem 0.625rem',
          background: statusInfo.bgColor,
          borderRadius: '6px',
          border: `1px solid ${statusInfo.color}30`,
          whiteSpace: 'nowrap'
        }}>
          <i className="fas fa-hourglass-half" style={{ color: statusInfo.color, fontSize: '0.7rem' }}></i>
          <span style={{ 
            fontSize: '0.65rem', 
            fontWeight: 600, 
            color: statusInfo.color
          }}>
            {countdown}
          </span>
        </div>
      )}
    </div>
  );
}

// Upcoming Tournament Card Component
function UpcomingTournamentCard({ 
  tournament, 
  prizePool, 
  maxEntries, 
  entryFee, 
  firstPlace,
  hasCompetitions,
  featuredComp,
  formatCurrency,
  formatDateRange,
  handleImageError,
  handleBuildTeam
}: any) {
  const regCloseAt = featuredComp?.reg_close_at || tournament.competitions[0]?.reg_close_at || null;
  const countdown = useCountdown(regCloseAt);
  const isClosed = countdown === 'Registration Closed';
  
  const tour = extractTour(tournament.description, tournament.name);
  
  // Get display text based on competition registration status, not tournament status
  const getStatusDisplay = () => {
    // SIMPLE RULE: If ANY competition has status='reg_open', show REGISTRATION OPEN
    const hasOpenCompetition = tournament.competitions?.some((c: any) => c.status === 'reg_open');
    if (hasOpenCompetition) {
      return 'REGISTRATION OPEN';
    }
    
    // Check if registration is closed based on countdown
    if (isClosed) {
      return 'TOURNAMENT IN PROGRESS';
    }
    
    // If registration is still open (countdown is active), show registration open
    if (regCloseAt && !isClosed) {
      return 'REGISTRATION OPEN';
    }
    
    // Fallback to tournament status
    switch (tournament.status) {
      case 'completed': return 'COMPLETED';
      case 'upcoming': return 'UPCOMING TOURNAMENT';
      default: return 'UPCOMING TOURNAMENT';
    }
  };

  return (
    <div className={`${styles.upcomingCard} ${styles.glass}`} style={{ position: 'relative' }}>
      {/* Status Banner at Top with Tour Badge inline */}
      <div className={styles.upcomingBanner} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fas fa-star"></i>
          <span>{getStatusDisplay()}</span>
        </div>
        {tour && (
          <div className={`${styles.tourBadge} ${
            tour === 'PGA' ? styles.tourBadgePGA :
            tour === 'LPGA' ? styles.tourBadgeLPGA :
            styles.tourBadgeEuropean
          }`} style={{ position: 'static', margin: 0, fontSize: '0.625rem', padding: '0.25rem 0.625rem' }}>
            {tour} TOUR
          </div>
        )}
      </div>

      {/* Tournament Info */}
      <div className={styles.upcomingContent}>
        <h3 className={styles.upcomingName}>{tournament.name}</h3>
        {featuredComp?.competition_types?.name && (
          <div style={{ marginTop: '0.5rem', marginBottom: '0.75rem', textAlign: 'center' }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.9)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '0.25rem'
            }}>
              {featuredComp.competition_types.name}
            </div>
            {featuredComp.competition_types.rounds_count && (
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 400,
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.3px'
              }}>
                {featuredComp.competition_types.rounds_count} Round{featuredComp.competition_types.rounds_count !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
        <p className={styles.upcomingLocation}>
          <i className="fas fa-map-marker-alt"></i>
          {tournament.location || 'Venue TBA'}
        </p>
        <p className={styles.upcomingDates}>
          <i className="fas fa-calendar"></i>
          {formatDateRange(tournament.start_date, tournament.end_date)}
        </p>
      </div>

      {/* 4 Stat Boxes in 2x2 Grid */}
      {hasCompetitions && (
        <div className={styles.upcomingStatsGrid}>
          <div className={styles.upcomingStat}>
            <i className="fas fa-trophy"></i>
            <div className={styles.upcomingStatValue}>
              {prizePool > 0 ? formatCurrency(prizePool) : 'FREE'}
            </div>
            <div className={styles.upcomingStatLabel}>Prize Pool</div>
          </div>
          <div className={styles.upcomingStat}>
            <i className="fas fa-users"></i>
            <div className={styles.upcomingStatValue}>
              {maxEntries > 0 ? maxEntries.toLocaleString() : 'TBA'}
            </div>
            <div className={styles.upcomingStatLabel}>Max Entries</div>
          </div>
          <div className={styles.upcomingStat}>
            <i className="fas fa-ticket-alt"></i>
            <div className={styles.upcomingStatValue}>
              {entryFee > 0 ? formatCurrency(entryFee) : 'FREE'}
            </div>
            <div className={styles.upcomingStatLabel}>Entry Fee</div>
          </div>
          <div className={styles.upcomingStat}>
            <i className="fas fa-medal"></i>
            <div className={styles.upcomingStatValue}>
              {firstPlace > 0 ? formatCurrency(firstPlace) : 'TBA'}
            </div>
            <div className={styles.upcomingStatLabel}>1st Place</div>
          </div>
        </div>
      )}

      {/* Countdown Button */}
      {hasCompetitions && regCloseAt && (
        <div className={styles.upcomingCountdown} style={{
          background: isClosed ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          borderTop: isClosed ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
          borderBottom: isClosed ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <i className="fas fa-clock" style={{
            color: isClosed ? '#ef4444' : '#10b981'
          }}></i>
          <span style={{
            color: isClosed ? '#ef4444' : '#10b981'
          }}>{countdown}</span>
        </div>
      )}

      {/* View Details Button */}
      <Link 
        href={`/tournaments/${tournament.slug}`}
        className={styles.upcomingBtn}
      >
        <i className="fas fa-info-circle"></i>
        View Tournament Details
      </Link>
    </div>
  );
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [requiredAmount, setRequiredAmount] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [myEntries, setMyEntries] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('prize_pool');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeTournaments, setActiveTournaments] = useState(0);
  const [totalPrizePool, setTotalPrizePool] = useState(0);
  const [backgroundSettings, setBackgroundSettings] = useState({
    backgroundImage: '/backgrounds/golf-course-sunrise.jpg',
    opacity: 0.3,
    overlay: 0.5
  });
  
  const supabase = createClient();
  const router = useRouter();

  // Auto-advance slider - only if there's more than 1 tournament
  useEffect(() => {
    // Only auto-advance if there are multiple tournaments and not hovering
    if (tournaments.length <= 1 || isHovering) return;
    
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % tournaments.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [tournaments.length, isHovering]);

  useEffect(() => {
    fetchTournaments();
    checkUser();
    fetchBackgroundSettings();
  }, []);

  async function fetchBackgroundSettings() {
    try {
      const response = await fetch('/api/settings/tournament-background');
      if (response.ok) {
        const data = await response.json();
        if (data.backgroundImage || data.backgroundUrl) {
          setBackgroundSettings({
            backgroundImage: data.backgroundImage || data.backgroundUrl,
            opacity: data.opacity || 0.3,
            overlay: data.overlay || 0.5
          });
        }
      }
    } catch (error) {
      console.log('Using default background');
    }
  }

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUserEmail(user?.email || null);
    
    if (user) {
      // Fetch user's entries count
      try {
        const res = await fetch('/api/user/entries');
        if (res.ok) {
          const data = await res.json();
          setMyEntries(data.entries || 0);
        }
      } catch (err) {
        console.error('Error fetching user entries:', err);
        // Silently fail - not critical for page function
      }
    }
  }

  async function fetchTournaments() {
    try {
      setError(null);
      const res = await fetch('/api/tournaments', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data && typeof data === 'object') {
        if (Array.isArray(data.tournaments)) {
          setTournaments(data.tournaments);
        } else if (Array.isArray(data)) {
          setTournaments(data);
        } else {
          setError('Invalid data format received from server');
          setTournaments([]);
        }
      }
    } catch (error: any) {
      console.error('Error fetching tournaments:', error);
      setError(error.message || 'Failed to load tournaments');
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  }

  // Get all competitions across all tournaments
  const allCompetitions = Array.isArray(tournaments) 
    ? tournaments.flatMap(t => 
        Array.isArray(t.competitions) 
          ? t.competitions.map(c => ({ ...c, tournament: t }))
          : []
      )
    : [];

  // Filter competitions by type
  const filteredCompetitions = selectedFilter === 'all' 
    ? allCompetitions 
    : allCompetitions.filter(c => c.competition_types.slug === selectedFilter);

  // Sort competitions
  const sortedCompetitions = [...filteredCompetitions].sort((a, b) => {
    switch (sortBy) {
      case 'prize_pool':
        // Sort by entry fee since we don't have prize pool
        return b.entry_fee_pennies - a.entry_fee_pennies;
      case 'entry_fee':
        return b.entry_fee_pennies - a.entry_fee_pennies;
      case 'start_date':
        return new Date(a.reg_open_at || a.tournament.start_date).getTime() - new Date(b.reg_open_at || b.tournament.start_date).getTime();
      case 'entries':
        return b.entrants_cap - a.entrants_cap;
      default:
        return 0;
    }
  });

  // Calculate stats for header
  const calculatedTotalPrizePool = allCompetitions.reduce((sum, c) => {
    const totalPot = (c.entry_fee_pennies / 100) * c.entrants_cap;
    const prizePot = totalPot * (1 - c.admin_fee_percent / 100);
    return sum + prizePot;
  }, 0);
  const calculatedActiveTournaments = tournaments.length;

  // Update state when tournaments change
  useEffect(() => {
    setTotalPrizePool(calculatedTotalPrizePool);
    setActiveTournaments(calculatedActiveTournaments);
  }, [calculatedTotalPrizePool, calculatedActiveTournaments]);

  // Get unique competition types for filters
  const competitionTypes = Array.from(
    new Set(allCompetitions.map(c => JSON.stringify({
      slug: c.competition_types.slug,
      name: c.competition_types.name
    })))
  ).map(str => JSON.parse(str));

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `£${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `£${(amount / 1000).toFixed(1)}K`;
    }
    return `£${amount}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const sameMonth = startDate.getMonth() === endDate.getMonth();
    const sameYear = startDate.getFullYear() === endDate.getFullYear();
    
    if (sameMonth && sameYear) {
      return `${startDate.getDate()}-${endDate.getDate()} ${startDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
    }
    
    return `${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=300&h=180&fit=crop';
  };

  const handleBuildTeam = async (e: React.MouseEvent, competitionId: string, entryFee: number, regCloseAt?: string | null) => {
    e.preventDefault();
    
    // ========================================
    // ARCHITECTURAL RULE: ONLY CHECK COMPETITION REGISTRATION DEADLINE
    // 
    // DO NOT check tournament.start_date or tournament status here
    // Competition registration is independent of tournament timing
    // 
    // A user can build a team as long as competition.reg_close_at hasn't passed,
    // even if the tournament has already started or is in progress
    // ========================================
    
    // Check if THIS COMPETITION's registration deadline has passed
    // Each competition has its own reg_close_at time
    if (regCloseAt) {
      const now = new Date();
      const closeDate = new Date(regCloseAt);
      if (now >= closeDate) {
        alert('Registration is closed - the deadline for this competition has passed.');
        return;
      }
    }
    
    try {
      // Fetch user balance
      const balanceRes = await fetch('/api/user/balance');
      if (!balanceRes.ok) {
        throw new Error('Failed to fetch balance');
      }
      const balanceData = await balanceRes.json();
      const balance = balanceData.balance_pennies || 0;
      
      // Check if user has enough balance
      if (balance < entryFee) {
        setUserBalance(balance);
        setRequiredAmount(entryFee);
        setShowInsufficientModal(true);
        return;
      }
      
      // Navigate to team builder
      router.push(`/build-team/${competitionId}`);
    } catch (error) {
      console.error('Error building team:', error);
      alert('Unable to connect to the server. Please try again.');
    }
  };

  if (loading) {
    return (
      <RequireAuth>
        <div className={styles.wrap}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading tournaments...</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (error) {
    return (
      <RequireAuth>
        <div className={styles.wrap}>
          <div className={styles.emptyState}>
            <div className={styles.glass}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', color: '#f87171', marginBottom: '1rem' }}></i>
              <h3>Error Loading Tournaments</h3>
              <p style={{ marginBottom: '1rem' }}>{error}</p>
              <button 
                onClick={fetchTournaments}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <TournamentBackgroundControls 
        currentSettings={backgroundSettings}
        onSettingsChange={setBackgroundSettings}
      />
      <div 
        className={styles.wrap}
        style={{
          '--bg-image': `url(${backgroundSettings.backgroundImage})`,
          '--bg-opacity': backgroundSettings.opacity,
          '--bg-overlay': backgroundSettings.overlay
        } as React.CSSProperties}
      >
        {/* Tournaments Display */}
        {tournaments.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.glass}>
              <i className="fas fa-calendar-times" style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: '1rem' }}></i>
              <h3>No Tournaments Available</h3>
              <p>Check back soon for upcoming tournaments!</p>
            </div>
          </div>
        ) : (
          <>
            {(() => {
              // Filter tournaments that have open registration OR live competitions
              const now = new Date();
              const upcomingTournaments = tournaments.filter(tournament => {
                // CRITICAL: Exclude tournaments that have already ended (safety check)
                const tournamentEnd = new Date(tournament.end_date);
                tournamentEnd.setHours(23, 59, 59, 999); // End of the last day
                if (now > tournamentEnd) return false; // Tournament has ended
                
                // Show if tournament itself has registration open, OR any competition has open registration OR is live
                if (tournament.status === 'registration_open') return true;

                const hasOpenRegistration = tournament.competitions.some(comp => {
                  const regCloseAt = comp.reg_close_at ? new Date(comp.reg_close_at) : null;
                  // Show if status is reg_open, live, or registration close date is in the future
                  return comp.status === 'reg_open' || comp.status === 'live' || (regCloseAt && now < regCloseAt);
                });

                // Show tournament if it has open competitions
                return hasOpenRegistration;
              });
              
              if (upcomingTournaments.length === 0) {
                return (
                  <div className={styles.emptyState}>
                    <div className={styles.glass}>
                      <i className="fas fa-calendar-check" style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: '1rem' }}></i>
                      <h3>All Tournaments In Progress</h3>
                      <p>Check the leaderboards to see live tournament standings!</p>
                      <Link href="/leaderboards" className={styles.btnPrimary} style={{ marginTop: '1rem', display: 'inline-block' }}>
                        <i className="fas fa-trophy"></i>
                        View Leaderboards
                      </Link>
                    </div>
                  </div>
                );
              }
              
              return (
                <>
                  {/* Page Header */}
                  <div className={styles.pageHeader}>
                    <div className={styles.headerTop}>
                      <div className={styles.headerContent}>
                        <h1 className={styles.pageTitle}>Tournament Selection</h1>
                      </div>
                      
                      {userEmail && (
                        <div className={styles.headerStats}>
                          <div className={styles.statCard}>
                            <div className={styles.statValue}>{activeTournaments}</div>
                            <div className={styles.statLabel}>Active Tournaments</div>
                          </div>
                          <div className={styles.statCard}>
                            <div className={styles.statValue}>{formatCurrency(totalPrizePool)}</div>
                            <div className={styles.statLabel}>Total Prize Pool</div>
                          </div>
                          <div className={styles.statCard}>
                            <div className={styles.statValue}>{myEntries}</div>
                            <div className={styles.statLabel}>My Entries</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Featured Tournament Slider */}
                  <div className={styles.featuredSliderSection}>
                    <div className={styles.featuredSlider}>
                      <div 
                        className={styles.sliderTrack}
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                      >
                        {/* Dynamic Slides - Only Registration Open Tournaments */}
                        {tournaments
                          .filter(tournament => {
                            // Show tournaments with competitions where registration is actually open
                            // Check status OR check if reg_open_at has passed (in case status not updated yet)
                            const now = new Date();
                            return tournament.competitions?.some(c => {
                              if (c.status === 'reg_open') return true;
                              if (c.status === 'live' || c.status === 'completed' || c.status === 'reg_closed') return false;
                              // For upcoming/draft, check if registration actually opened
                              if (c.reg_open_at && c.reg_close_at) {
                                const regOpen = new Date(c.reg_open_at);
                                const regClose = new Date(c.reg_close_at);
                                return now >= regOpen && now < regClose;
                              }
                              return false;
                            });
                          })
                          .map((tournament, index) => {
                          // Find Full Course competition for featured display (prefer reg_open)
                          const now = new Date();
                          const isCompetitionOpen = (c: any) => {
                            if (c.status === 'reg_open') return true;
                            if (c.status === 'live' || c.status === 'completed' || c.status === 'reg_closed') return false;
                            // Check timestamps for upcoming/draft
                            if (c.reg_open_at && c.reg_close_at) {
                              const regOpen = new Date(c.reg_open_at);
                              const regClose = new Date(c.reg_close_at);
                              return now >= regOpen && now < regClose;
                            }
                            return false;
                          };
                          const fullCourseComp = tournament.competitions?.find(
                            c => c.competition_types?.name === 'Full Course' && isCompetitionOpen(c)
                          );
                          const featuredComp = tournament.featured_competition || fullCourseComp || tournament.competitions?.find(c => isCompetitionOpen(c));
                          // Calculate prize pool
                          const prizePool = featuredComp
                            ? (featuredComp.guaranteed_prize_pool_pennies && featuredComp.guaranteed_prize_pool_pennies > 0
                                ? featuredComp.guaranteed_prize_pool_pennies / 100
                                : ((featuredComp.entry_fee_pennies || 0) / 100) * (featuredComp.entrants_cap || 0) * (1 - (featuredComp.admin_fee_percent || 0) / 100))
                            : 0;
                          
                          const entryFee = featuredComp ? (featuredComp.entry_fee_pennies || 0) / 100 : 0;
                          const maxEntries = featuredComp ? (featuredComp.entrants_cap || 0) : 0;
                          const firstPlace = featuredComp && featuredComp.first_place_prize_pennies && featuredComp.first_place_prize_pennies > 0
                            ? featuredComp.first_place_prize_pennies / 100
                            : prizePool * 0.25;

                          const competitionType = featuredComp?.competition_types?.name || 'Full Course';
                          const badgeClass = index === 0 ? styles.featuredBadge : `${styles.featuredBadge} ${styles.badgeElite}`;
                          const badgeIcon = index === 0 ? 'fas fa-crown' : 'fas fa-star';
                          const badgeText = competitionType.toUpperCase();
                          const isRegOpen = featuredComp ? isCompetitionOpen(featuredComp) : false;

                          return (
                            <div key={tournament.id} className={styles.sliderSlide}>
                              <div className={`${styles.featuredCompetitionCard} ${styles.glass}`}>
                                <div className={styles.featuredTop}>
                                  <div className={badgeClass}>
                                    <i className={badgeIcon}></i>
                                    {badgeText}
                                  </div>
                                  {isRegOpen && (
                                    <div className={styles.registrationOpenBadge}>
                                      <i className="fas fa-circle-check"></i>
                                      <span>Registration Open</span>
                                    </div>
                                  )}
                                  <div className={styles.featuredCourseInfo}>
                                    <div className={styles.featuredCourseSubtitle}>{featuredComp?.competition_types?.description || 'The Complete Competition'}</div>
                                  </div>
                                </div>
                                
                                <div className={styles.featuredContent}>
                                  <div className={styles.featuredImage}>
                                    <img 
                                      src={tournament.image_url || `https://images.unsplash.com/photo-${index === 0 ? '1593111774240-d529f12cf4bb' : '1592919505780-303950717480'}?w=600&h=300&fit=crop`}
                                      alt={tournament.name}
                                    />
                                  </div>
                                  <div className={styles.featuredInfo}>
                                    <h3 className={styles.featuredName}>{tournament.name}</h3>
                                    <p className={styles.featuredLocation}>
                                      <i className="fas fa-map-marker-alt"></i>
                                      {tournament.location || 'Venue TBA'}
                                    </p>
                                    <p className={styles.featuredDates}>
                                      <i className="fas fa-calendar"></i>
                                      {tournament.start_date && tournament.end_date ? 
                                        `${new Date(tournament.start_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}-${new Date(tournament.end_date).toLocaleDateString('en-GB', { day: 'numeric', year: 'numeric' })}` :
                                        'Dates TBA'
                                      }
                                    </p>
                                  </div>
                                  <div className={styles.featuredBadgeRight}>
                                    <i className="fas fa-star"></i>
                                    <span>FEATURED</span>
                                  </div>
                                </div>
                                
                                <div className={styles.featuredStats}>
                                  <div className={styles.featuredStatBox}>
                                    <i className="fas fa-trophy"></i>
                                    <div>
                                      <div className={styles.featuredStatValue}>
                                        {prizePool >= 1000000 ? `£${(prizePool / 1000000).toFixed(1)}M` : 
                                         prizePool >= 1000 ? `£${(prizePool / 1000).toFixed(0)}K` : 
                                         `£${prizePool.toFixed(0)}`}
                                      </div>
                                      <div className={styles.featuredStatLabel}>Prize Pool</div>
                                    </div>
                                  </div>
                                  <div className={styles.featuredStatBox}>
                                    <i className="fas fa-users"></i>
                                    <div>
                                      <div className={styles.featuredStatValue}>
                                        {maxEntries >= 1000 ? `${(maxEntries / 1000).toFixed(0)}K` : maxEntries.toLocaleString()}
                                      </div>
                                      <div className={styles.featuredStatLabel}>Max Entries</div>
                                    </div>
                                  </div>
                                  <div className={styles.featuredStatBox}>
                                    <i className="fas fa-ticket-alt"></i>
                                    <div>
                                      <div className={styles.featuredStatValue}>£{entryFee.toFixed(0)}</div>
                                      <div className={styles.featuredStatLabel}>Entry Fee</div>
                                    </div>
                                  </div>
                                  <div className={styles.featuredStatBox}>
                                    <i className="fas fa-medal"></i>
                                    <div>
                                      <div className={styles.featuredStatValue}>
                                        {firstPlace >= 1000000 ? `£${(firstPlace / 1000000).toFixed(1)}M` : 
                                         firstPlace >= 1000 ? `£${(firstPlace / 1000).toFixed(0)}K` : 
                                         `£${firstPlace.toFixed(0)}`}
                                      </div>
                                      <div className={styles.featuredStatLabel}>1st Place</div>
                                    </div>
                                  </div>
                                  <div className={styles.featuredStatBox}>
                                    <i className="fas fa-info-circle"></i>
                                    <div>
                                      <div className={styles.featuredStatValue}>{competitionType}</div>
                                      <div className={styles.featuredStatLabel}>Competition Details</div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className={styles.featuredActions}>
                                  <Link 
                                    href={`/tournaments/${tournament.slug}`}
                                    className={styles.btnPrimary}
                                  >
                                    <i className="fas fa-users"></i>
                                    Build Your Team
                                  </Link>
                                  <Link 
                                    href="/leaderboards"
                                    className={styles.btnSecondary}
                                  >
                                    <i className="fas fa-list-ol"></i>
                                    Leaderboard List
                                  </Link>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Only show controls if there are multiple tournaments */}
                    {tournaments.length > 1 && (
                      <>
                        <div className={styles.sliderControls}>
                          <button 
                            className={styles.sliderArrow}
                            onClick={() => setCurrentSlide(currentSlide === 0 ? tournaments.length - 1 : currentSlide - 1)}
                          >
                            <i className="fas fa-chevron-left"></i>
                          </button>
                          <div className={styles.sliderDots}>
                            {tournaments.map((_, index) => (
                              <button
                                key={index}
                                className={`${styles.sliderDot} ${index === currentSlide ? styles.active : ''}`}
                                onClick={() => setCurrentSlide(index)}
                              />
                            ))}
                          </div>
                          <button 
                            className={styles.sliderArrow}
                            onClick={() => setCurrentSlide((currentSlide + 1) % tournaments.length)}
                          >
                            <i className="fas fa-chevron-right"></i>
                          </button>
                        </div>

                        <div className={styles.sliderProgress}>
                          <div
                            className={styles.progressBar}
                            style={{ width: `${((currentSlide + 1) / tournaments.length) * 100}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Filters */}
                  <div className={styles.filtersSection}>
                    <div className={styles.filterButtons}>
                      <button
                        className={`${styles.filterBtn} ${selectedFilter === 'all' ? styles.active : ''}`}
                        onClick={() => setSelectedFilter('all')}
                      >
                        All Competitions
                      </button>
                      {competitionTypes.map(type => (
                        <button
                          key={type.slug}
                          className={`${styles.filterBtn} ${selectedFilter === type.slug ? styles.active : ''}`}
                          onClick={() => setSelectedFilter(type.slug)}
                        >
                          {type.name}
                        </button>
                      ))}
                    </div>
                    
                    <div className={styles.sortOptions}>
                      <select 
                        className={styles.sortSelect}
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="prize_pool">Sort by Prize Pool</option>
                        <option value="entry_fee">Sort by Entry Fee</option>
                        <option value="start_date">Sort by Start Time</option>
                        <option value="entries">Sort by Entries</option>
                      </select>
                    </div>
                  </div>

                  {/* Competitions List */}
                  {sortedCompetitions.length === 0 ? (
                    <>
                      {/* Large Featured Cards */}
                      <div className={styles.featuredCardsGrid}>
                        <div className={`${styles.featuredCompetitionCard} ${styles.glass}`}>
                          <div className={styles.featuredTop}>
                            <div className={styles.featuredCourseInfo}>
                              <div className={styles.featuredCourseTitle}>THE FULL COURSE</div>
                              <div className={styles.featuredCourseSubtitle}>The Complete Competition</div>
                            </div>
                            <div className={styles.featuredBadge}>
                              <i className="fas fa-crown"></i>
                              FULL COURSE
                            </div>
                          </div>
                          
                          <div className={styles.featuredContent}>
                            <div className={styles.featuredImage}>
                              <img 
                                src="https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=300&h=180&fit=crop" 
                                alt="Tournament"
                              />
                            </div>
                            <div className={styles.featuredInfo}>
                              <h3 className={styles.featuredName}>Masters Tournament 2025</h3>
                              <p className={styles.featuredLocation}>
                                <i className="fas fa-map-marker-alt"></i>
                                Augusta National Golf Club
                              </p>
                              <p className={styles.featuredDates}>
                                <i className="fas fa-calendar"></i>
                                April 10-13, 2025
                              </p>
                            </div>
                            <div className={styles.featuredBadgeRight}>
                              <i className="fas fa-star"></i>
                              <span>FEATURED</span>
                            </div>
                          </div>
                          
                          <div className={styles.featuredStats}>
                            <div className={styles.featuredStatBox}>
                              <i className="fas fa-trophy"></i>
                              <div>
                                <div className={styles.featuredStatValue}>£2.5M</div>
                                <div className={styles.featuredStatLabel}>Prize Pool</div>
                              </div>
                            </div>
                            <div className={styles.featuredStatBox}>
                              <i className="fas fa-users"></i>
                              <div>
                                <div className={styles.featuredStatValue}>12,847</div>
                                <div className={styles.featuredStatLabel}>Entries</div>
                              </div>
                            </div>
                            <div className={styles.featuredStatBox}>
                              <i className="fas fa-ticket-alt"></i>
                              <div>
                                <div className={styles.featuredStatValue}>£25</div>
                                <div className={styles.featuredStatLabel}>Entry Fee</div>
                              </div>
                            </div>
                            <div className={styles.featuredStatBox}>
                              <i className="fas fa-medal"></i>
                              <div>
                                <div className={styles.featuredStatValue}>£500K</div>
                                <div className={styles.featuredStatLabel}>1st Place</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className={styles.featuredActions}>
                            <button className={styles.btnPrimary}>
                              <i className="fas fa-users"></i>
                              Build Your Team
                            </button>
                            <button className={styles.btnSecondary}>
                              <i className="fas fa-list-ol"></i>
                              Leaderboard List
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Smaller Empty State Cards */}
                      <div className={styles.emptyStateGrid}>
                        <div className={`${styles.smallCompetitionCard} ${styles.glass}`}>
                          <div className={styles.smallTop}>
                            <div className={styles.smallBadge}>
                              <i className="fas fa-clock"></i>
                              COMING SOON
                            </div>
                          </div>
                          
                          <div className={styles.smallContent}>
                            <div className={styles.smallImage}>
                              <img 
                                src="https://images.unsplash.com/photo-1592919505780-303950717480?w=300&h=180&fit=crop" 
                                alt="Tournament"
                              />
                            </div>
                            <h4 className={styles.smallName}>US Open Championship</h4>
                            <p className={styles.smallLocation}>
                              <i className="fas fa-map-marker-alt"></i>
                              Pebble Beach Golf Links
                            </p>
                          </div>
                          
                          <div className={styles.smallStats}>
                            <div className={styles.smallStat}>
                              <i className="fas fa-trophy"></i>
                              <div>
                                <div className={styles.smallStatValue}>£1.8M</div>
                                <div className={styles.smallStatLabel}>Prize Pool</div>
                              </div>
                            </div>
                            <div className={styles.smallStat}>
                              <i className="fas fa-users"></i>
                              <div>
                                <div className={styles.smallStatValue}>8,234</div>
                                <div className={styles.smallStatLabel}>Entries</div>
                              </div>
                            </div>
                            <div className={styles.smallStat}>
                              <i className="fas fa-ticket-alt"></i>
                              <div>
                                <div className={styles.smallStatValue}>£15</div>
                                <div className={styles.smallStatLabel}>Entry Fee</div>
                              </div>
                            </div>
                            <div className={styles.smallStat}>
                              <i className="fas fa-medal"></i>
                              <div>
                                <div className={styles.smallStatValue}>£350K</div>
                                <div className={styles.smallStatLabel}>1st Place</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className={styles.smallActions}>
                            <button className={styles.btnGlass}>
                              Coming Soon
                            </button>
                          </div>
                        </div>

                        <div className={`${styles.smallCompetitionCard} ${styles.glass}`}>
                          <div className={styles.smallTop}>
                            <div className={`${styles.smallBadge} ${styles.badgeRound2}`}>
                              <i className="fas fa-clock"></i>
                              COMING SOON
                            </div>
                          </div>
                          
                          <div className={styles.smallContent}>
                            <div className={styles.smallImage}>
                              <img 
                                src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=300&h=180&fit=crop" 
                                alt="Tournament"
                              />
                            </div>
                            <h4 className={styles.smallName}>The Open Championship</h4>
                            <p className={styles.smallLocation}>
                              <i className="fas fa-map-marker-alt"></i>
                              St Andrews Links
                            </p>
                          </div>
                          
                          <div className={styles.smallStats}>
                            <div className={styles.smallStat}>
                              <i className="fas fa-trophy"></i>
                              <div>
                                <div className={styles.smallStatValue}>£2.1M</div>
                                <div className={styles.smallStatLabel}>Prize Pool</div>
                              </div>
                            </div>
                            <div className={styles.smallStat}>
                              <i className="fas fa-users"></i>
                              <div>
                                <div className={styles.smallStatValue}>15,621</div>
                                <div className={styles.smallStatLabel}>Entries</div>
                              </div>
                            </div>
                            <div className={styles.smallStat}>
                              <i className="fas fa-ticket-alt"></i>
                              <div>
                                <div className={styles.smallStatValue}>£20</div>
                                <div className={styles.smallStatLabel}>Entry Fee</div>
                              </div>
                            </div>
                            <div className={styles.smallStat}>
                              <i className="fas fa-medal"></i>
                              <div>
                                <div className={styles.smallStatValue}>£425K</div>
                                <div className={styles.smallStatLabel}>1st Place</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className={styles.smallActions}>
                            <button className={styles.btnGlass}>
                              Coming Soon
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={styles.competitionsGrid}>
                      {sortedCompetitions.map(competition => {
                        const prizePool = (competition.entry_fee_pennies / 100) * competition.entrants_cap * (1 - competition.admin_fee_percent / 100);
                        const firstPlace = prizePool * 0.25; // Assume 25% to winner
                        
                        return (
                          <div key={competition.id} className={`${styles.competitionCard} ${styles.glass}`}>
                            <div className={styles.competitionHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div className={styles.competitionBadge}>
                                {competition.competition_types.name}
                              </div>
                              <div style={{
                                flex: 1,
                                textAlign: 'center',
                                fontSize: '1.125rem',
                                fontWeight: 600,
                                color: '#fff',
                                letterSpacing: '0.3px',
                                padding: '0 1rem'
                              }}>
                                {competition.tournament.name}
                              </div>
                            </div>
                            
                            <div className={styles.competitionContent}>
                              <div className={styles.competitionImage}>
                                <img 
                                  src={competition.tournament.image_url || "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=300&h=180&fit=crop"} 
                                  alt={competition.tournament.name}
                                  onError={handleImageError}
                                />
                              </div>
                              
                              <div className={styles.competitionInfo}>
                                <p className={styles.competitionLocation}>
                                  <i className="fas fa-map-marker-alt"></i>
                                  {competition.tournament.location}
                                </p>
                                <p className={styles.competitionDates}>
                                  <i className="fas fa-calendar"></i>
                                  {formatDateRange(competition.tournament.start_date, competition.tournament.end_date)}
                                </p>

                                {/* Registration Status & Countdown - inline with location/date */}
                                <CompetitionCountdown 
                                  regCloseAt={competition.reg_close_at}
                                  status={competition.status}
                                />
                              </div>
                            </div>
                            
                            <div className={styles.competitionStats}>
                              <div className={styles.competitionStat}>
                                <i className="fas fa-trophy"></i>
                                <div>
                                  <div className={styles.competitionStatValue}>{formatCurrency(prizePool)}</div>
                                  <div className={styles.competitionStatLabel}>Prize Pool</div>
                                </div>
                              </div>
                              <div className={styles.competitionStat}>
                                <i className="fas fa-users"></i>
                                <div>
                                  <div className={styles.competitionStatValue}>{competition.entrants_cap.toLocaleString()}</div>
                                  <div className={styles.competitionStatLabel}>Max Entries</div>
                                </div>
                              </div>
                              <div className={styles.competitionStat}>
                                <i className="fas fa-ticket-alt"></i>
                                <div>
                                  <div className={styles.competitionStatValue}>£{(competition.entry_fee_pennies / 100).toFixed(0)}</div>
                                  <div className={styles.competitionStatLabel}>Entry Fee</div>
                                </div>
                              </div>
                              <div className={styles.competitionStat}>
                                <i className="fas fa-medal"></i>
                                <div>
                                  <div className={styles.competitionStatValue}>{formatCurrency(firstPlace)}</div>
                                  <div className={styles.competitionStatLabel}>1st Place</div>
                                </div>
                              </div>
                            </div>
                            
                            <div className={styles.competitionActions}>
                              <Link 
                                href={`/tournaments/${competition.tournament.slug}`}
                                className={styles.btnPrimary}
                              >
                                <i className="fas fa-users"></i>
                                Build Your Team
                              </Link>
                              <Link 
                                href="/leaderboards"
                                className={styles.btnSecondary}
                              >
                                <i className="fas fa-list-ol"></i>
                                Leaderboard
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}
      </div>
      
      <InsufficientFundsModal
        isOpen={showInsufficientModal}
        onClose={() => setShowInsufficientModal(false)}
        currentBalance={userBalance}
        requiredAmount={requiredAmount}
      />
    </RequireAuth>
  );
}