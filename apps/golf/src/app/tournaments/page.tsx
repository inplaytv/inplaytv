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
}

interface Competition {
  id: string;
  entry_fee_pennies: number;
  entrants_cap: number;
  admin_fee_percent: number;
  status: string;
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
  competitions: Competition[];
  featured_competition: Competition | null;
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
      const res = await fetch('/api/tournaments');
      
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
    return `${startDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}-${endDate.toLocaleDateString('en-GB', { day: 'numeric', year: 'numeric' })}`;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=300&h=180&fit=crop';
  };

  const handleBuildTeam = async (e: React.MouseEvent, competitionId: string, entryFee: number) => {
    e.preventDefault();
    
    // Fetch user balance
    const balanceRes = await fetch('/api/user/balance');
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
      <div className={styles.wrap}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Tournament Selection</h1>
          <p className={styles.pageSubtitle}>Choose your fantasy golf competition</p>
        </div>

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
            {/* Featured Tournaments - First 2 */}
            {tournaments.slice(0, 2).length > 0 && (
              <div className={styles.featuredCardsGrid}>
                {tournaments.slice(0, 2).map(tournament => {
                  const featuredComp = tournament.featured_competition;
                  const hasCompetitions = tournament.competitions.length > 0;
                  
                  const prizePool = featuredComp
                    ? (featuredComp.entry_fee_pennies / 100) * featuredComp.entrants_cap * (1 - featuredComp.admin_fee_percent / 100)
                    : tournament.competitions.reduce((sum, c) => sum + (c.entry_fee_pennies / 100) * c.entrants_cap * (1 - c.admin_fee_percent / 100), 0);
                  
                  const entryFee = featuredComp ? featuredComp.entry_fee_pennies / 100 : 0;
                  const maxEntries = featuredComp ? featuredComp.entrants_cap : tournament.competitions.reduce((sum, c) => sum + c.entrants_cap, 0);
                  const firstPlace = prizePool * 0.25;
                  
                  return (
                    <div key={tournament.id} className={`${styles.featuredCompetitionCard} ${styles.glass}`}>
                      <div className={styles.featuredTop}>
                        <div className={styles.featuredCourseInfo}>
                          <div className={styles.featuredCourseTitle}>
                            {tournament.name.toUpperCase()}
                          </div>
                          <div className={styles.featuredCourseSubtitle}>
                            {featuredComp 
                              ? `${featuredComp.competition_types.name} • ${tournament.competitions.length} Competition${tournament.competitions.length !== 1 ? 's' : ''}`
                              : hasCompetitions 
                                ? `${tournament.competitions.length} Competition${tournament.competitions.length !== 1 ? 's' : ''}`
                                : 'Registration Opening Soon'
                            }
                          </div>
                        </div>
                        <div className={styles.featuredBadge}>
                          <i className="fas fa-star"></i>
                          FEATURED
                        </div>
                      </div>
                      
                      <div className={styles.featuredContent}>
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
                                {formatCurrency(prizePool)}
                              </div>
                              <div className={styles.featuredStatLabel}>Prize Pool</div>
                            </div>
                          </div>
                          <div className={styles.featuredStatBox}>
                            <i className="fas fa-users"></i>
                            <div>
                              <div className={styles.featuredStatValue}>
                                {maxEntries.toLocaleString()}
                              </div>
                              <div className={styles.featuredStatLabel}>Max Entries</div>
                            </div>
                          </div>
                          {featuredComp && (
                            <>
                              <div className={styles.featuredStatBox}>
                                <i className="fas fa-ticket-alt"></i>
                                <div>
                                  <div className={styles.featuredStatValue}>
                                    {formatCurrency(entryFee)}
                                  </div>
                                  <div className={styles.featuredStatLabel}>Entry Fee</div>
                                </div>
                              </div>
                              <div className={styles.featuredStatBox}>
                                <i className="fas fa-medal"></i>
                                <div>
                                  <div className={styles.featuredStatValue}>
                                    {formatCurrency(firstPlace)}
                                  </div>
                                  <div className={styles.featuredStatLabel}>1st Place</div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      
                      <div className={styles.featuredActions}>
                        {hasCompetitions ? (
                          <>
                            {featuredComp ? (
                              <button
                                onClick={(e) => handleBuildTeam(e, featuredComp.id, featuredComp.entry_fee_pennies)}
                                className={styles.btnPrimary}
                              >
                                <i className="fas fa-users"></i>
                                Build Your Team
                              </button>
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
            )}

            {/* Small Tournament Cards - Remaining */}
            {tournaments.slice(2).length > 0 && (
              <div className={styles.emptyStateGrid}>
                {tournaments.slice(2).map(tournament => {
                  const featuredComp = tournament.featured_competition;
                  const hasCompetitions = tournament.competitions.length > 0;
                  
                  const prizePool = featuredComp
                    ? (featuredComp.entry_fee_pennies / 100) * featuredComp.entrants_cap * (1 - featuredComp.admin_fee_percent / 100)
                    : tournament.competitions.reduce((sum, c) => sum + (c.entry_fee_pennies / 100) * c.entrants_cap * (1 - c.admin_fee_percent / 100), 0);
                  
                  const entryFee = featuredComp ? featuredComp.entry_fee_pennies / 100 : 0;
                  const maxEntries = featuredComp ? featuredComp.entrants_cap : tournament.competitions.reduce((sum, c) => sum + c.entrants_cap, 0);
                  const firstPlace = prizePool * 0.25;
                  
                  return (
                    <div key={tournament.id} className={`${styles.smallCompetitionCard} ${styles.glass}`}>
                      <div className={styles.smallTop}>
                        <div className={`${styles.smallBadge} ${!hasCompetitions ? styles.badgeComingSoon : ''}`}>
                          <i className={hasCompetitions ? "fas fa-star" : "fas fa-clock"}></i>
                          {hasCompetitions ? 'UPCOMING' : 'COMING SOON'}
                        </div>
                      </div>
                      
                      <div className={styles.smallContent}>
                        <div className={styles.smallImage}>
                          <img 
                            src={tournament.image_url || 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=300&h=180&fit=crop'}
                            alt={tournament.name}
                            onError={handleImageError}
                          />
                        </div>
                        <h4 className={styles.smallName}>{tournament.name}</h4>
                        <p className={styles.smallLocation}>
                          <i className="fas fa-map-marker-alt"></i>
                          {tournament.location || 'Venue TBA'}
                        </p>
                      </div>
                      
                      {hasCompetitions && (
                        <div className={styles.smallStats}>
                          <div className={styles.smallStat}>
                            <i className="fas fa-trophy"></i>
                            <div>
                              <div className={styles.smallStatValue}>{formatCurrency(prizePool)}</div>
                              <div className={styles.smallStatLabel}>Prize Pool</div>
                            </div>
                          </div>
                          <div className={styles.smallStat}>
                            <i className="fas fa-users"></i>
                            <div>
                              <div className={styles.smallStatValue}>{maxEntries.toLocaleString()}</div>
                              <div className={styles.smallStatLabel}>Entries</div>
                            </div>
                          </div>
                          {featuredComp && (
                            <>
                              <div className={styles.smallStat}>
                                <i className="fas fa-ticket-alt"></i>
                                <div>
                                  <div className={styles.smallStatValue}>{formatCurrency(entryFee)}</div>
                                  <div className={styles.smallStatLabel}>Entry Fee</div>
                                </div>
                              </div>
                              <div className={styles.smallStat}>
                                <i className="fas fa-medal"></i>
                                <div>
                                  <div className={styles.smallStatValue}>{formatCurrency(firstPlace)}</div>
                                  <div className={styles.smallStatLabel}>1st Place</div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      
                      <div className={styles.smallActions}>
                        {hasCompetitions ? (
                          <>
                            {featuredComp ? (
                              <button
                                onClick={(e) => handleBuildTeam(e, featuredComp.id, featuredComp.entry_fee_pennies)}
                                className={styles.btnGlass}
                              >
                                <i className="fas fa-users"></i>
                                Build Your Team
                              </button>
                            ) : (
                              <Link 
                                href={`/tournaments/${tournament.slug}`}
                                className={styles.btnGlass}
                              >
                                <i className="fas fa-users"></i>
                                View Competitions
                              </Link>
                            )}
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
            )}
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
