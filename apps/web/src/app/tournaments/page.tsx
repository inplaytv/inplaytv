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

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('prize_pool');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [myEntries, setMyEntries] = useState(0);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchData();
    checkUser();
  }, []);

  const handleJoinPrompt = () => {
    if (!userEmail) {
      // Not logged in - redirect to signup with return URL
      router.push('/signup?redirect=/tournaments');
    } else {
      // Logged in - redirect to golf app
      window.location.href = 'https://golf.inplay.tv/tournaments';
    }
  };

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

  async function fetchData() {
    try {
      setError(null);
      // Fetch both upcoming and live tournaments
      const res = await fetch('/api/tournaments?status=upcoming,live');
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setTournaments(data);
      } else {
        setError('Invalid data format received from server');
        setTournaments([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching tournaments:', error);
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
        return new Date(a.start_at || a.tournament.start_date).getTime() - new Date(b.start_at || b.tournament.start_date).getTime();
      case 'entries':
        return b.entrants_cap - a.entrants_cap;
      default:
        return 0;
    }
  });

  // Calculate total prize pool from all competitions (entry_fee * entrants_cap * (1 - admin_fee))
  const totalPrizePool = allCompetitions.reduce((sum, c) => {
    const totalPot = (c.entry_fee_pennies / 100) * c.entrants_cap;
    const prizePot = totalPot * (1 - c.admin_fee_percent / 100);
    return sum + prizePot;
  }, 0);
  const activeTournaments = tournaments.length;

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `£${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `£${(amount / 1000).toFixed(1)}K`;
    }
    return `£${amount}`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format date range
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}-${endDate.toLocaleDateString('en-GB', { day: 'numeric', year: 'numeric' })}`;
  };

  // Get unique competition types for filters
  const competitionTypes = Array.from(
    new Set(allCompetitions.map(c => JSON.stringify({
      slug: c.competition_types.slug,
      name: c.competition_types.name
    })))
  ).map(str => JSON.parse(str));

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading tournaments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wrap}>
        <div className={styles.emptyState}>
          <div className={styles.glass}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', color: '#f87171', marginBottom: '1rem' }}></i>
            <h3>Error Loading Tournaments</h3>
            <p style={{ marginBottom: '1rem' }}>{error}</p>
            <button 
              onClick={fetchData}
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
    );
  }

  return (
    <div className={styles.wrap}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>Tournament Selection</h1>
            <p className={styles.pageSubtitle}>Choose your fantasy golf competition</p>
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
                <button className={styles.btnPrimary} onClick={handleJoinPrompt}>
                  <i className="fas fa-users"></i>
                  Build Your Team
                </button>
                <button className={styles.btnSecondary}>
                  <i className="fas fa-list-ol"></i>
                  Leaderboard List
                </button>
              </div>
            </div>

            <div className={`${styles.featuredCompetitionCard} ${styles.glass}`}>
              <div className={styles.featuredTop}>
                <div className={styles.featuredCourseInfo}>
                  <div className={styles.featuredCourseTitle}>BEAT THE CUT</div>
                  <div className={styles.featuredCourseSubtitle}>36 Holes Competition</div>
                </div>
                <div className={`${styles.featuredBadge} ${styles.badgeElite}`}>
                  <i className="fas fa-star"></i>
                  BEAT THE CUT
                </div>
              </div>
              
              <div className={styles.featuredContent}>
                <div className={styles.featuredImage}>
                  <img 
                    src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=300&h=180&fit=crop" 
                    alt="Tournament"
                  />
                </div>
                <div className={styles.featuredInfo}>
                  <h3 className={styles.featuredName}>PGA Championship 2025</h3>
                  <p className={styles.featuredLocation}>
                    <i className="fas fa-map-marker-alt"></i>
                    Kiawah Island Golf Resort
                  </p>
                  <p className={styles.featuredDates}>
                    <i className="fas fa-calendar"></i>
                    May 15-18, 2025
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
                    <div className={styles.featuredStatValue}>£5.0M</div>
                    <div className={styles.featuredStatLabel}>Prize Pool</div>
                  </div>
                </div>
                <div className={styles.featuredStatBox}>
                  <i className="fas fa-users"></i>
                  <div>
                    <div className={styles.featuredStatValue}>2,543</div>
                    <div className={styles.featuredStatLabel}>Entries</div>
                  </div>
                </div>
                <div className={styles.featuredStatBox}>
                  <i className="fas fa-ticket-alt"></i>
                  <div>
                    <div className={styles.featuredStatValue}>£100</div>
                    <div className={styles.featuredStatLabel}>Entry Fee</div>
                  </div>
                </div>
                <div className={styles.featuredStatBox}>
                  <i className="fas fa-medal"></i>
                  <div>
                    <div className={styles.featuredStatValue}>£1.2M</div>
                    <div className={styles.featuredStatLabel}>1st Place</div>
                  </div>
                </div>
              </div>
              
              <div className={styles.featuredActions}>
                <button className={styles.btnPrimary} onClick={handleJoinPrompt}>
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
                    <div className={styles.smallStatValue}>£2.2M</div>
                    <div className={styles.smallStatLabel}>Prize Pool</div>
                  </div>
                </div>
                <div className={styles.smallStat}>
                  <i className="fas fa-users"></i>
                  <div>
                    <div className={styles.smallStatValue}>9,567</div>
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
                    <div className={styles.smallStatValue}>£450K</div>
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
                <div className={`${styles.smallBadge} ${styles.badgeRound3}`}>
                  <i className="fas fa-clock"></i>
                  COMING SOON
                </div>
              </div>
              
              <div className={styles.smallContent}>
                <div className={styles.smallImage}>
                  <img 
                    src="https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=300&h=180&fit=crop" 
                    alt="Tournament"
                  />
                </div>
                <h4 className={styles.smallName}>Players Championship</h4>
                <p className={styles.smallLocation}>
                  <i className="fas fa-map-marker-alt"></i>
                  TPC Sawgrass
                </p>
              </div>
              
              <div className={styles.smallStats}>
                <div className={styles.smallStat}>
                  <i className="fas fa-trophy"></i>
                  <div>
                    <div className={styles.smallStatValue}>£3.0M</div>
                    <div className={styles.smallStatLabel}>Prize Pool</div>
                  </div>
                </div>
                <div className={styles.smallStat}>
                  <i className="fas fa-users"></i>
                  <div>
                    <div className={styles.smallStatValue}>11,245</div>
                    <div className={styles.smallStatLabel}>Entries</div>
                  </div>
                </div>
                <div className={styles.smallStat}>
                  <i className="fas fa-ticket-alt"></i>
                  <div>
                    <div className={styles.smallStatValue}>£30</div>
                    <div className={styles.smallStatLabel}>Entry Fee</div>
                  </div>
                </div>
                <div className={styles.smallStat}>
                  <i className="fas fa-medal"></i>
                  <div>
                    <div className={styles.smallStatValue}>£600K</div>
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
        <div className={styles.competitionsList}>
          {sortedCompetitions.map(competition => (
            <div key={competition.id} className={`${styles.competitionCard} ${styles.glass}`}>
              <div className={styles.cardTop}>
                <div className={styles.courseInfo}>
                  <div className={styles.courseTitle}>{competition.competition_types.name.toUpperCase()}</div>
                  <div className={styles.courseSubtitle}>{competition.competition_types.description || 'Fantasy Golf Competition'}</div>
                </div>
                <div className={styles.badges}>
                  <div className={styles.badge}>
                    <i className="fas fa-trophy"></i>
                    {competition.competition_types.name.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className={styles.cardContent}>
                <div className={styles.tournamentImage}>
                  <img 
                    src={competition.tournament.image_url || 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=300&h=180&fit=crop'} 
                    alt={competition.tournament.name}
                  />
                </div>

                <div className={styles.tournamentInfo}>
                  <h3 className={styles.tournamentName}>{competition.tournament.name}</h3>
                  <p className={styles.tournamentLocation}>
                    <i className="fas fa-map-marker-alt"></i>
                    {competition.tournament.location || 'Venue TBA'}
                  </p>
                  <p className={styles.tournamentDates}>
                    <i className="fas fa-calendar"></i>
                    {formatDateRange(competition.tournament.start_date, competition.tournament.end_date)}
                  </p>
                </div>
              </div>

              <div className={styles.competitionStats}>
                <div className={styles.stat}>
                  <div className={styles.statValue}>
                    {formatCurrency((competition.entry_fee_pennies / 100) * competition.entrants_cap * (1 - competition.admin_fee_percent / 100))}
                  </div>
                  <div className={styles.statLabel}>Prize Pool</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statValue}>{competition.entrants_cap.toLocaleString()}</div>
                  <div className={styles.statLabel}>Max Entries</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statValue}>{formatCurrency(competition.entry_fee_pennies / 100)}</div>
                  <div className={styles.statLabel}>Entry Fee</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statValue}>
                    {formatCurrency((competition.entry_fee_pennies / 100) * competition.entrants_cap * (1 - competition.admin_fee_percent / 100) * 0.25)}
                  </div>
                  <div className={styles.statLabel}>1st Place</div>
                </div>
              </div>

              <div className={styles.cardActions}>
                <Link 
                  href={`/tournaments/${competition.tournament.slug}/competitions/${competition.id}`}
                  className={styles.btnPrimary}
                >
                  Build Your Team
                  <i className="fas fa-arrow-right"></i>
                </Link>
                <Link 
                  href={`/tournaments/${competition.tournament.slug}/leaderboard`}
                  className={styles.btnSecondary}
                >
                  <i className="fas fa-list"></i>
                  Leaderboard
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
