'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  reg_open_at: string | null;
  reg_close_at: string | null;
  start_at: string | null;
  end_at: string | null;
  status: string;
  competition_type_id: string;
  tournament_id: string;
  competition_types: CompetitionType; // Single object, not array
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

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('prize_pool');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userEntries, setUserEntries] = useState<string[]>([]);
  const [activeTournaments, setActiveTournaments] = useState(0);
  const [totalPrizePools, setTotalPrizePools] = useState(0);
  const [yourEntries, setYourEntries] = useState(0);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const router = useRouter();

  const fetchBackgroundSetting = async () => {
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/settings/tournament-background?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🎯 Background setting fetched:', data.backgroundUrl);
        setBackgroundUrl(data.backgroundUrl);
      } else {
        console.error('❌ Failed to fetch background setting');
      }
    } catch (error) {
      console.error('❌ Error fetching background setting:', error);
    }
  };

  const checkUser = async () => {
    const supabase = createClient();
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error getting user:', error);
        return;
      }

      if (!user) {
        router.push('/login');
        return;
      }

      setUserEmail(user.email || null);
    } catch (error) {
      console.error('Error in checkUser:', error);
      router.push('/login');
    }
  };

  useEffect(() => {
    checkUser();
    fetchBackgroundSetting();
  }, []);

  const fetchTournaments = async () => {
    const supabase = createClient();
    
    try {
      setLoading(true);
      setError(null);

      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from('tournaments')
        .select(`
          id,
          name,
          slug,
          description,
          location,
          start_date,
          end_date,
          status,
          image_url,
          competitions (
            id,
            entry_fee_pennies,
            entrants_cap,
            admin_fee_percent,
            reg_open_at,
            reg_close_at,
            start_at,
            end_at,
            status,
            competition_type_id,
            tournament_id,
            competition_types (
              id,
              name,
              slug,
              description
            )
          )
        `)
        .in('status', ['upcoming', 'live'])
        .order('start_date', { ascending: true });

      if (tournamentsError) {
        console.error('Error fetching tournaments:', tournamentsError);
        throw tournamentsError;
      }

      console.log('Fetched tournaments:', tournamentsData);
      
      // Transform the data to match our interface
      const transformedTournaments = (tournamentsData || []).map(tournament => ({
        ...tournament,
        competitions: tournament.competitions.map(comp => ({
          ...comp,
          competition_types: Array.isArray(comp.competition_types) ? comp.competition_types[0] : comp.competition_types
        }))
      }));
      
      setTournaments(transformedTournaments);

    } catch (error: any) {
      console.error('Error in fetchTournaments:', error);
      setError(error.message || 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEntries = async () => {
    if (!userEmail) return;

    const supabase = createClient();
    
    try {
      const { data: entriesData, error: entriesError } = await supabase
        .from('entries')
        .select('competition_id')
        .eq('user_email', userEmail);

      if (entriesError) {
        console.error('Error fetching user entries:', entriesError);
        return;
      }

      const entryIds = entriesData?.map(entry => entry.competition_id) || [];
      setUserEntries(entryIds);
      setYourEntries(entryIds.length);

    } catch (error) {
      console.error('Error in fetchUserEntries:', error);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (userEmail) {
      fetchUserEntries();
    }
  }, [userEmail]);

  useEffect(() => {
    const active = tournaments.filter(t => t.status === 'live' || t.status === 'upcoming').length;
    setActiveTournaments(active);

    const totalPrize = tournaments.reduce((sum, tournament) => {
      const tournamentPrize = tournament.competitions.reduce((compSum, comp) => {
        const entryFee = comp.entry_fee_pennies / 100;
        const adminFeePercent = comp.admin_fee_percent / 100;
        const prizePool = entryFee * comp.entrants_cap * (1 - adminFeePercent);
        return compSum + prizePool;
      }, 0);
      return sum + tournamentPrize;
    }, 0);
    
    setTotalPrizePools(totalPrize);
  }, [tournaments]);

  const filteredTournaments = tournaments.filter(tournament => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'live') return tournament.status === 'live';
    if (selectedFilter === 'upcoming') return tournament.status === 'upcoming';
    if (selectedFilter === 'entered') {
      return tournament.competitions.some(comp => userEntries.includes(comp.id));
    }
    return true;
  });

  const sortedTournaments = [...filteredTournaments].sort((a, b) => {
    if (sortBy === 'prize_pool') {
      const aPrize = a.competitions.reduce((sum, comp) => {
        const entryFee = comp.entry_fee_pennies / 100;
        const adminFeePercent = comp.admin_fee_percent / 100;
        return sum + (entryFee * comp.entrants_cap * (1 - adminFeePercent));
      }, 0);
      const bPrize = b.competitions.reduce((sum, comp) => {
        const entryFee = comp.entry_fee_pennies / 100;
        const adminFeePercent = comp.admin_fee_percent / 100;
        return sum + (entryFee * comp.entrants_cap * (1 - adminFeePercent));
      }, 0);
      return bPrize - aPrize;
    }
    if (sortBy === 'start_date') {
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    }
    if (sortBy === 'entry_fee') {
      const aMinFee = Math.min(...a.competitions.map(comp => comp.entry_fee_pennies));
      const bMinFee = Math.min(...b.competitions.map(comp => comp.entry_fee_pennies));
      return aMinFee - bMinFee;
    }
    return 0;
  });

  const formatCurrency = (pennies: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(pennies / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return '#22c55e';
      case 'upcoming': return '#3b82f6';
      case 'completed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const isUserEntered = (competitionId: string) => {
    return userEntries.includes(competitionId);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading tournaments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <h2>Error loading tournaments</h2>
          <p>{error}</p>
          <button onClick={fetchTournaments} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={styles.container}
      style={{
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>Tournament Selection (DEV VERSION)</h1>
          </div>
          
          {userEmail && (
            <div className={styles.headerStats}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{activeTournaments}</div>
                <div className={styles.statLabel}>Active Tournaments</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>${totalPrizePools.toLocaleString()}</div>
                <div className={styles.statLabel}>Total Prize Pools</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{yourEntries}</div>
                <div className={styles.statLabel}>Your Entries</div>
              </div>
            </div>
          )}
        </div>

        {/* Filters and Sort */}
        <div className={styles.controls}>
          <div className={styles.filters}>
            <button 
              className={selectedFilter === 'all' ? styles.activeFilter : styles.filter}
              onClick={() => setSelectedFilter('all')}
            >
              All
            </button>
            <button 
              className={selectedFilter === 'live' ? styles.activeFilter : styles.filter}
              onClick={() => setSelectedFilter('live')}
            >
              Live
            </button>
            <button 
              className={selectedFilter === 'upcoming' ? styles.activeFilter : styles.filter}
              onClick={() => setSelectedFilter('upcoming')}
            >
              Upcoming
            </button>
            <button 
              className={selectedFilter === 'entered' ? styles.activeFilter : styles.filter}
              onClick={() => setSelectedFilter('entered')}
            >
              Entered
            </button>
          </div>

          <div className={styles.sortControls}>
            <label htmlFor="sort-select">Sort by:</label>
            <select 
              id="sort-select"
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="prize_pool">Prize Pool</option>
              <option value="start_date">Start Date</option>
              <option value="entry_fee">Entry Fee</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tournament Grid */}
      <div className={styles.tournamentGrid}>
        {sortedTournaments.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No tournaments found</h3>
            <p>There are no tournaments matching your current filter.</p>
          </div>
        ) : (
          sortedTournaments.map((tournament) => (
            <div key={tournament.id} className={styles.tournamentCard}>
              {/* Tournament Header */}
              <div className={styles.tournamentHeader}>
                {tournament.image_url && (
                  <img 
                    src={tournament.image_url} 
                    alt={tournament.name}
                    className={styles.tournamentImage}
                  />
                )}
                <div className={styles.tournamentInfo}>
                  <div className={styles.tournamentTitle}>
                    <h3>{tournament.name}</h3>
                    <span 
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusColor(tournament.status) }}
                    >
                      {tournament.status}
                    </span>
                  </div>
                  <p className={styles.tournamentLocation}>{tournament.location}</p>
                  <p className={styles.tournamentDates}>
                    {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
                  </p>
                </div>
              </div>

              {/* Tournament Description */}
              {tournament.description && (
                <p className={styles.tournamentDescription}>{tournament.description}</p>
              )}

              {/* Competitions */}
              <div className={styles.competitions}>
                <h4>Available Competitions</h4>
                {tournament.competitions.length === 0 ? (
                  <p className={styles.noCompetitions}>No competitions available</p>
                ) : (
                  <div className={styles.competitionsList}>
                    {tournament.competitions.map((competition) => {
                      const prizePool = (competition.entry_fee_pennies / 100) * 
                                       competition.entrants_cap * 
                                       (1 - competition.admin_fee_percent / 100);
                      const isEntered = isUserEntered(competition.id);

                      return (
                        <div key={competition.id} className={styles.competitionCard}>
                          <div className={styles.competitionHeader}>
                            <div className={styles.competitionTitle}>
                              <h5>{competition.competition_types.name}</h5>
                              {isEntered && (
                                <span className={styles.enteredBadge}>Entered</span>
                              )}
                            </div>
                            <div className={styles.competitionPrize}>
                              <span className={styles.prizeAmount}>
                                {formatCurrency(prizePool)}
                              </span>
                              <span className={styles.prizeLabel}>Prize Pool</span>
                            </div>
                          </div>

                          <div className={styles.competitionDetails}>
                            <div className={styles.competitionStat}>
                              <span className={styles.statLabel}>Entry Fee</span>
                              <span className={styles.statValue}>
                                {formatCurrency(competition.entry_fee_pennies)}
                              </span>
                            </div>
                            <div className={styles.competitionStat}>
                              <span className={styles.statLabel}>Max Entries</span>
                              <span className={styles.statValue}>
                                {competition.entrants_cap}
                              </span>
                            </div>
                            <div className={styles.competitionStat}>
                              <span className={styles.statLabel}>Registration</span>
                              <span className={styles.statValue}>
                                {competition.reg_open_at && competition.reg_close_at ? (
                                  <>
                                    {formatDate(competition.reg_open_at)} - {formatDate(competition.reg_close_at)}
                                  </>
                                ) : (
                                  'TBD'
                                )}
                              </span>
                            </div>
                          </div>

                          <div className={styles.competitionActions}>
                            {isEntered ? (
                              <Link
                                href={`/tournaments/${tournament.slug}/${competition.id}/manage`}
                                className={`${styles.actionButton} ${styles.manageButton}`}
                              >
                                Manage Entry
                              </Link>
                            ) : (
                              <Link
                                href={`/tournaments/${tournament.slug}/${competition.id}/enter`}
                                className={`${styles.actionButton} ${styles.enterButton}`}
                              >
                                Enter Competition
                              </Link>
                            )}
                            <Link
                              href={`/tournaments/${tournament.slug}/${competition.id}`}
                              className={`${styles.actionButton} ${styles.viewButton}`}
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}