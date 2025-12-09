'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import InsufficientFundsModal from '@/components/InsufficientFundsModal';
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

// Custom hook for countdown timer
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
  
  // Get display text for tournament status
  const getStatusDisplay = () => {
    switch (tournament.status) {
      case 'registration_open': return 'REGISTRATION OPEN';
      case 'registration_closed': return 'REGISTRATION CLOSED';
      case 'live': return 'LIVE NOW';
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
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchTournaments();
  }, []);

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

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `£${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `£${(amount / 1000).toFixed(1)}K`;
    }
    return `£${amount}`;
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

  const handleBuildTeam = async (e: React.MouseEvent, competitionId: string, entryFee: number, regCloseAt?: string) => {
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
      <div className={styles.wrap} style={{ paddingTop: '2rem' }}>
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
                const tournamentEnd = tournament.end_date ? new Date(tournament.end_date) : null;
                const tournamentEndOfDay = tournamentEnd ? new Date(tournamentEnd) : null;
                if (tournamentEndOfDay) {
                  tournamentEndOfDay.setHours(23, 59, 59, 999);
                }
                
                // Show if tournament has open registration by EITHER status OR future date
                const hasOpenRegistration = tournament.competitions.some(comp => {
                  const regCloseAt = comp.reg_close_at ? new Date(comp.reg_close_at) : null;
                  // Show if status is reg_open OR registration close date is in the future
                  return comp.status === 'reg_open' || (regCloseAt && now < regCloseAt);
                });
                
                // Hide only if tournament is fully completed (past end date)
                const isCompleted = tournamentEndOfDay && now > tournamentEndOfDay;
                
                // Show tournaments that are either upcoming OR live with open registration
                return !isCompleted && hasOpenRegistration;
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
            {/* Featured Tournaments Carousel - All featured tournaments */}
            {upcomingTournaments.length > 0 && (
              <div className={styles.carouselSection}>
                <div className={styles.carouselContainer}>
                  <button 
                    className={styles.carouselArrow} 
                    style={{ left: '1rem' }}
                    onClick={() => {
                      const track = document.querySelector(`.${styles.carouselTrack}`) as HTMLElement;
                      if (track) {
                        const containerWidth = track.clientWidth;
                        track.scrollBy({ left: -containerWidth, behavior: 'smooth' });
                      }
                    }}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  
                  <div className={styles.carouselTrack}>
                    {upcomingTournaments.map(tournament => {
                  // Find Full Course competition for featured display
                  const fullCourseComp = tournament.competitions.find(
                    c => c.competition_types?.name === 'Full Course'
                  );
                  const featuredComp = tournament.featured_competition || fullCourseComp;
                  const hasCompetitions = tournament.competitions.length > 0;
                  
                  // Use guaranteed prize pool from database if available, otherwise calculate
                  const prizePool = featuredComp
                    ? (featuredComp.guaranteed_prize_pool_pennies && featuredComp.guaranteed_prize_pool_pennies > 0
                        ? featuredComp.guaranteed_prize_pool_pennies / 100
                        : ((featuredComp.entry_fee_pennies || 0) / 100) * (featuredComp.entrants_cap || 0) * (1 - (featuredComp.admin_fee_percent || 0) / 100))
                    : tournament.competitions.reduce((sum, c) => sum + ((c.entry_fee_pennies || 0) / 100) * (c.entrants_cap || 0) * (1 - (c.admin_fee_percent || 0) / 100), 0);
                  
                  const entryFee = featuredComp ? (featuredComp.entry_fee_pennies || 0) / 100 : 0;
                  const maxEntries = featuredComp ? (featuredComp.entrants_cap || 0) : tournament.competitions.reduce((sum, c) => sum + (c.entrants_cap || 0), 0);
                  
                  // Use first place prize from database if available, otherwise calculate (25%)
                  const firstPlace = featuredComp && featuredComp.first_place_prize_pennies && featuredComp.first_place_prize_pennies > 0
                    ? featuredComp.first_place_prize_pennies / 100
                    : prizePool * 0.25;
                  
                  const tour = extractTour(tournament.description, tournament.name);
                  
                  // Calculate if registration is actually open by checking tournament dates
                  const now = new Date();
                  const tournamentStart = tournament.start_date ? new Date(tournament.start_date) : null;
                  const tournamentEnd = tournament.end_date ? new Date(tournament.end_date) : null;
                  const tournamentEndOfDay = tournamentEnd ? new Date(tournamentEnd) : null;
                  if (tournamentEndOfDay) {
                    tournamentEndOfDay.setHours(23, 59, 59, 999);
                  }
                  
                  // ========================================
                  // CRITICAL: TOURNAMENT STATUS ≠ COMPETITION REGISTRATION STATUS
                  // These are COMPLETELY INDEPENDENT:
                  // - Tournament can be "In Play" while competitions are still accepting registrations
                  // - Competition registration is ONLY determined by competition.reg_close_at
                  // ========================================
                  
                  const regCloseAt = featuredComp?.reg_close_at ? new Date(featuredComp.reg_close_at) : null;
                  const regOpenAt = featuredComp?.reg_open_at ? new Date(featuredComp.reg_open_at) : null;
                  
                  // Tournament status (for badge display)
                  const tournamentInProgress = tournamentStart && tournamentEndOfDay && now >= tournamentStart && now <= tournamentEndOfDay;
                  
                  // Competition registration status (INDEPENDENT of tournament status)
                  const registrationIsOpen = hasCompetitions && regOpenAt && regCloseAt && now >= regOpenAt && now < regCloseAt;
                  const isRegistrationOpen = registrationIsOpen;
                  
                  return (
                    <div key={tournament.id} className={`${styles.featuredCompetitionCard} ${styles.glass}`} style={{ 
                      position: 'relative', 
                      paddingTop: '3.5rem'
                    }}>
                      {/* Badge - Top Left */}
                      {isRegistrationOpen ? (
                        <div style={{ 
                          position: 'absolute',
                          top: '1rem',
                          left: '1rem',
                          zIndex: 10
                        }}>
                          <span className={styles.statusBadge}>
                            Registration Open
                          </span>
                        </div>
                      ) : tournamentInProgress && (
                        <div style={{ 
                          position: 'absolute',
                          top: '1rem',
                          left: '1rem',
                          zIndex: 10
                        }}>
                          <span className={styles.statusBadge} style={{ color: 'white' }}>
                            Tournament InPlay
                          </span>
                        </div>
                      )}
                      
                      {/* Competition Type - Center */}
                      {featuredComp && (
                        <div style={{ 
                          position: 'absolute',
                          top: '1rem',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          zIndex: 10,
                          textAlign: 'center'
                        }}>
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
                      
                      {/* Tour Badge - Top Right */}
                      {tour && (
                        <div className={`${styles.tourBadge} ${
                          tour === 'PGA' ? styles.tourBadgePGA :
                          tour === 'LPGA' ? styles.tourBadgeLPGA :
                          styles.tourBadgeEuropean
                        }`} style={{ position: 'absolute', top: '1rem', right: '1rem', left: 'auto' }}>
                          {tour} TOUR
                        </div>
                      )}
                      
                      {/* Dividing Line */}
                      {hasCompetitions && (
                        <div style={{
                          position: 'absolute',
                          top: '5.56rem',
                          left: 0,
                          right: 0,
                          height: '1px',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.1) 80%, transparent)',
                          zIndex: 5
                        }} />
                      )}
                      
                      <div className={styles.featuredContent} style={{ paddingTop: '60px' }}>
                        <div className={styles.featuredImage}>
                          <img 
                            src={tournament.image_url || 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=300&h=180&fit=crop'}
                            alt={tournament.name}
                            onError={handleImageError}
                          />
                        </div>
                        <div className={styles.featuredInfo}>
                          <h3 className={styles.featuredName}>
                            {tournament.name}
                          </h3>
                          <p className={styles.featuredLocation}>
                            <i className="fas fa-map-marker-alt"></i>
                            {tournament.location || 'Venue TBA'}
                          </p>
                          <p className={styles.featuredDates}>
                            <i className="fas fa-calendar"></i>
                            {formatDateRange(tournament.start_date, tournament.end_date)}
                          </p>
                        </div>
                        <div className={styles.featuredBadgeRight}>
                          <i className="fas fa-star"></i>
                          <span>FEATURED</span>
                        </div>
                      </div>
                      
                      {hasCompetitions && (
                        <div className={styles.featuredStats}>
                          <div className={styles.featuredStatBox}>
                            <i className="fas fa-trophy"></i>
                            <div>
                              <div className={styles.featuredStatValue}>
                                {prizePool > 0 ? formatCurrency(prizePool) : 'FREE'}
                              </div>
                              <div className={styles.featuredStatLabel}>Prize Pool</div>
                            </div>
                          </div>
                          <div className={styles.featuredStatBox}>
                            <i className="fas fa-users"></i>
                            <div>
                              <div className={styles.featuredStatValue}>
                                {maxEntries > 0 ? maxEntries.toLocaleString() : 'TBA'}
                              </div>
                              <div className={styles.featuredStatLabel}>Max Entries</div>
                            </div>
                          </div>
                          <div className={styles.featuredStatBox}>
                            <i className="fas fa-ticket-alt"></i>
                            <div>
                              <div className={styles.featuredStatValue}>
                                {entryFee > 0 ? formatCurrency(entryFee) : 'FREE'}
                              </div>
                              <div className={styles.featuredStatLabel}>Entry Fee</div>
                            </div>
                          </div>
                          <div className={styles.featuredStatBox}>
                            <i className="fas fa-medal"></i>
                            <div>
                              <div className={styles.featuredStatValue}>
                                {firstPlace > 0 ? formatCurrency(firstPlace) : 'FREE'}
                              </div>
                              <div className={styles.featuredStatLabel}>1st Place</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className={styles.featuredActions}>
                        {hasCompetitions ? (
                          <>
                            {featuredComp ? (
                              (() => {
                                const now = new Date();
                                const regCloseAt = featuredComp.reg_close_at ? new Date(featuredComp.reg_close_at) : null;
                                const isRegOpen = !regCloseAt || now < regCloseAt;
                                const tournamentStart = tournament.start_date ? new Date(tournament.start_date) : null;
                                const tournamentEnd = tournament.end_date ? new Date(tournament.end_date) : null;
                                const tournamentEndOfDay = tournamentEnd ? new Date(tournamentEnd) : null;
                                if (tournamentEndOfDay) {
                                  tournamentEndOfDay.setHours(23, 59, 59, 999);
                                }
                                const isLive = tournamentStart && tournamentEndOfDay && now >= tournamentStart && now <= tournamentEndOfDay;
                                
                                if (!isRegOpen || isLive) {
                                  return (
                                    <button
                                      className={styles.btnGlass}
                                      style={{ cursor: 'not-allowed', opacity: 0.6 }}
                                      disabled
                                    >
                                      <i className="fas fa-door-closed"></i>
                                      {isLive ? 'Tournament In Progress' : 'Registration Closed'}
                                    </button>
                                  );
                                }
                                
                                return (
                                  <button
                                    onClick={(e) => handleBuildTeam(e, featuredComp.id, featuredComp.entry_fee_pennies, featuredComp.reg_close_at || undefined)}
                                    className={styles.btnPrimary}
                                  >
                                    <i className="fas fa-users"></i>
                                    Build Your Team
                                  </button>
                                );
                              })()
                            ) : (
                              <Link 
                                href={`/tournaments/${tournament.slug}`}
                                className={styles.btnPrimary}
                              >
                                <i className="fas fa-users"></i>
                                View Competitions
                              </Link>
                            )}
                            <Link 
                              href={`/tournaments/${tournament.slug}`}
                              className={styles.btnSecondary}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              <i className="fas fa-layer-group"></i>
                              View All Competitions
                            </Link>
                          </>
                        ) : (
                          <button className={styles.btnGlass}>
                            <i className="fas fa-clock"></i>
                            Coming Soon
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                  </div>

                  <button 
                    className={styles.carouselArrow} 
                    style={{ right: '1rem' }}
                    onClick={() => {
                      const track = document.querySelector(`.${styles.carouselTrack}`) as HTMLElement;
                      if (track) {
                        const containerWidth = track.clientWidth;
                        track.scrollBy({ left: containerWidth, behavior: 'smooth' });
                      }
                    }}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* ONE 2 ONE Hub Card - Dynamic first tournament */}
            <Link 
              href={tournaments.length > 0 ? `/one-2-one/${tournaments[0].slug}` : '/one-2-one/nedbank-golf-challenge-in-honour-of-gary-player'} 
              className={styles.one2OneHubCard}
            >
              <div className={styles.hubCardHeader}>
                <div className={styles.hubCardIcon}>
                  <i className="fas fa-swords"></i>
                </div>
                <div className={styles.hubCardTitle}>
                  <h3>ONE 2 ONE MATCHMAKING</h3>
                  <p>Head-to-head battles • Winner takes all • Auto-matched opponents</p>
                </div>
                <div className={styles.hubCardCta}>
                  <span>View All ONE 2 ONE Competitions</span>
                  <i className="fas fa-arrow-right"></i>
                </div>
              </div>
              
              <div className={styles.hubCardStats}>
                <div className={styles.hubStat}>
                  <div className={styles.hubStatIcon}>
                    <i className="fas fa-trophy"></i>
                  </div>
                  <div className={styles.hubStatContent}>
                    <span className={styles.hubStatLabel}>Winner Takes All</span>
                    <span className={styles.hubStatValue}>Beat your opponent and take home 90% of the combined entry fees</span>
                  </div>
                </div>
                <div className={styles.hubStat}>
                  <div className={styles.hubStatIcon}>
                    <i className="fas fa-sync-alt"></i>
                  </div>
                  <div className={styles.hubStatContent}>
                    <span className={styles.hubStatLabel}>Auto-Matching</span>
                    <span className={styles.hubStatValue}>First-come-first-served matching • No skill-based pairing</span>
                  </div>
                </div>
                <div className={styles.hubStat}>
                  <div className={styles.hubStatIcon}>
                    <i className="fas fa-shield-alt"></i>
                  </div>
                  <div className={styles.hubStatContent}>
                    <span className={styles.hubStatLabel}>Fair Play</span>
                    <span className={styles.hubStatValue}>If no opponent joins, you'll get a full refund automatically</span>
                  </div>
                </div>
              </div>
            </Link>

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
