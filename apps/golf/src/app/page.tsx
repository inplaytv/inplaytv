'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import { createClient } from '@/lib/supabaseClient';
import { usePageBackground } from '@/hooks/usePageBackground';
import styles from './lobby.module.css';

// Force dynamic rendering (requires auth)
export const dynamic = 'force-dynamic';

interface Tournament {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  start_date: string;
  end_date: string;
  status: string;
  image_url: string | null;
  current_round: number;
}

interface UserStats {
  totalEntries: number;
  activeEntries: number;
  inplayEntries: number;
  clubhouseEntries: number;
  totalWinnings: number;
  winRate: number;
}

export default function LobbyPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalEntries: 0,
    activeEntries: 0,
    inplayEntries: 0,
    clubhouseEntries: 0,
    totalWinnings: 0,
    winRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [clubhouseLeaderboardUrl, setClubhouseLeaderboardUrl] = useState<string>('/clubhouse/events');
  const supabase = createClient();
  const backgroundSettings = usePageBackground('lobby_page_background');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user info
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setEmail(user.email);
          
          // Get username and display name
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name, first_name, last_name')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            setUsername(profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username);
          }
        }

        // Get balance
        const balanceRes = await fetch('/api/user/balance');
        if (balanceRes.ok) {
          const balanceData = await balanceRes.json();
          setBalance(balanceData.balance_pennies || 0);
        }

        // Get tournaments
        const tournamentsRes = await fetch('/api/tournaments?status=active');
        if (tournamentsRes.ok) {
          const tournamentsData = await tournamentsRes.json();
          setTournaments(tournamentsData.tournaments || []);
        }

        // Get user entries for stats
        const entriesRes = await fetch('/api/user/my-entries');
        if (entriesRes.ok) {
          const entriesData = await entriesRes.json();
          const entries = entriesData.entries || [];
          const activeEntries = entries.filter((e: any) => 
            e.status === 'active' || e.status === 'submitted'
          ).length;
          
          // Get InPlay entries count
          let inplayCount = 0;
          let clubhouseCount = 0;
          
          if (user?.id) {
            const { count: inplayResult } = await supabase
              .from('competition_entries')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('status', 'active');
            
            inplayCount = inplayResult || 0;
            
            // Get Clubhouse entries count
            const { count: clubhouseResult } = await supabase
              .from('clubhouse_entries')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('status', 'active');
            
            clubhouseCount = clubhouseResult || 0;
          }
          
          setUserStats({
            totalEntries: entries.length,
            activeEntries,
            inplayEntries: inplayCount,
            clubhouseEntries: clubhouseCount,
            totalWinnings: 0, // TODO: Calculate from wins
            winRate: entries.length > 0 ? 0 : 0 // TODO: Calculate win rate
          });
        }
        
        // Get active clubhouse competition for leaderboard link
        const { data: clubhouseComp } = await supabase
          .from('clubhouse_competitions')
          .select('id')
          .in('status', ['open', 'live'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (clubhouseComp) {
          setClubhouseLeaderboardUrl(`/clubhouse/leaderboard/${clubhouseComp.id}`);
        }
      } catch (error) {
        console.error('Error fetching lobby data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const formatCurrency = (pennies: number) => {
    return `£${(pennies / 100).toFixed(2)}`;
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

  const getTournamentStatus = (tournament: Tournament) => {
    const now = new Date();
    const start = new Date(tournament.start_date);
    const end = new Date(tournament.end_date);

    if (now < start) {
      return { label: 'Upcoming', color: '#3b82f6', icon: 'fa-calendar' };
    } else if (now >= start && now <= end) {
      return { label: 'Live Now', color: '#10b981', icon: 'fa-circle', pulse: true };
    } else {
      return { label: 'Completed', color: '#6b7280', icon: 'fa-check-circle' };
    }
  };

  if (loading) {
    return (
      <RequireAuth>
        <div 
          className={styles.container}
          style={{
            '--bg-image': `url(${backgroundSettings.backgroundImage})`,
            '--bg-opacity': backgroundSettings.opacity,
            '--bg-overlay': backgroundSettings.overlay
          } as React.CSSProperties}
        >
          <div className={styles.loading}>
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div 
        className={styles.container}
        style={{
          '--bg-image': `url(${backgroundSettings.backgroundImage})`,
          '--bg-opacity': backgroundSettings.opacity,
          '--bg-overlay': backgroundSettings.overlay
        } as React.CSSProperties}
      >
        {/* Compact Hero with Welcome */}
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.welcomeSection}>
              <h1 className={styles.welcomeTitle}>
                Welcome back, <span className={styles.username}>{username || 'Player'}</span>
              </h1>
              <p className={styles.welcomeSubtitle}>Choose your next challenge</p>
            </div>
            
            {/* Compact Stats */}
            <div className={styles.compactStats}>
              <div className={styles.compactStatItem}>
                <i className="fas fa-trophy"></i>
                <span className={styles.compactStatValue}>{userStats.activeEntries}</span>
                <span className={styles.compactStatLabel}>Active</span>
              </div>
              <div className={styles.compactStatItem}>
                <i className="fas fa-clipboard-list"></i>
                <span className={styles.compactStatValue}>{userStats.totalEntries}</span>
                <span className={styles.compactStatLabel}>Total</span>
              </div>
              <div className={styles.compactStatItem}>
                <i className="fas fa-coins"></i>
                <span className={styles.compactStatValue}>{formatCurrency(userStats.totalWinnings)}</span>
                <span className={styles.compactStatLabel}>Winnings</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation Cards - Featured */}
        <div className={styles.mainNav}>
          <Link href="/tournaments" className={`${styles.mainNavCard} ${styles.mainNavCardPrimary}`}>
            <div className={styles.mainNavIcon}>
              <i className="fas fa-trophy"></i>
            </div>
            <div className={styles.mainNavContent}>
              <h2>InPlay Tournaments</h2>
              <p>Full course competitions with big prize pools</p>
              <div className={styles.mainNavBadge}>
                <i className="fas fa-fire"></i>
                Live Now
              </div>
            </div>
            <i className="fas fa-arrow-right"></i>
          </Link>

          <Link href="/clubhouse/events" className={`${styles.mainNavCard} ${styles.mainNavCardSecondary}`}>
            <div className={styles.mainNavIcon}>
              <i className="fas fa-users"></i>
            </div>
            <div className={styles.mainNavContent}>
              <h2>Clubhouse Events</h2>
              <p>Private events and exclusive competitions</p>
              <div className={styles.mainNavBadge}>
                <i className="fas fa-star"></i>
                Exclusive
              </div>
            </div>
            <i className="fas fa-arrow-right"></i>
          </Link>

          <Link href="/one-2-one" className={`${styles.mainNavCard} ${styles.mainNavCardAccent}`}>
            <div className={styles.mainNavIcon}>
              <i className="fas fa-swords"></i>
            </div>
            <div className={styles.mainNavContent}>
              <h2>1-2-1 Challenges</h2>
              <p>Head-to-head matchups for instant action</p>
              <div className={styles.mainNavBadge}>
                <i className="fas fa-bolt"></i>
                Quick Play
              </div>
            </div>
            <i className="fas fa-arrow-right"></i>
          </Link>
        </div>

        {/* Quick Access Grid */}
        <div className={styles.quickAccessSection}>
          <h2 className={styles.sectionTitle}>
            <i className="fas fa-bolt"></i>
            Quick Access
          </h2>
          <div className={styles.quickAccessGrid}>
            <Link href="/entries" className={styles.quickAccessCard}>
              <div className={styles.quickAccessIcon}>
                <i className="fas fa-trophy"></i>
              </div>
              <div className={styles.quickAccessContent}>
                <h3>InPlay Entries</h3>
                <p>{userStats.inplayEntries} active</p>
              </div>
            </Link>

            <Link href="/clubhouse/events" className={styles.quickAccessCard}>
              <div className={styles.quickAccessIcon}>
                <i className="fas fa-users"></i>
              </div>
              <div className={styles.quickAccessContent}>
                <h3>Clubhouse Entries</h3>
                <p>{userStats.clubhouseEntries} active</p>
              </div>
            </Link>

            <Link href="/leaderboards" className={styles.quickAccessCard}>
              <div className={styles.quickAccessIcon}>
                <i className="fas fa-ranking-star"></i>
              </div>
              <div className={styles.quickAccessContent}>
                <h3>InPlay Leaderboard</h3>
                <p>Tournament standings</p>
              </div>
            </Link>

            <Link href={clubhouseLeaderboardUrl} className={styles.quickAccessCard}>
              <div className={styles.quickAccessIcon}>
                <i className="fas fa-chart-line"></i>
              </div>
              <div className={styles.quickAccessContent}>
                <h3>Clubhouse Leaderboard</h3>
                <p>Event standings</p>
              </div>
            </Link>

            <Link href="/profile" className={styles.quickAccessCard}>
              <div className={styles.quickAccessIcon}>
                <i className="fas fa-user-circle"></i>
              </div>
              <div className={styles.quickAccessContent}>
                <h3>Profile</h3>
                <p>Settings</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Upcoming Tournaments */}
        <div className={styles.tournamentsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-calendar-alt"></i>
              Upcoming Tournaments
            </h2>
            <Link href="/tournaments" className={styles.viewAllLink}>
              View All
              <i className="fas fa-arrow-right"></i>
            </Link>
          </div>

          {tournaments.length === 0 ? (
            <div className={styles.emptyState}>
              <i className="fas fa-calendar-times"></i>
              <p>No tournaments available yet.</p>
              <p className={styles.emptySubtext}>Check back soon for new competitions!</p>
            </div>
          ) : (
            <div className={styles.tournamentsGrid}>
              {tournaments
                .filter(tournament => {
                  // CRITICAL: Exclude completed tournaments as a safety check
                  const now = new Date();
                  const tournamentEnd = new Date(tournament.end_date);
                  tournamentEnd.setHours(23, 59, 59, 999);
                  return now <= tournamentEnd; // Only show tournaments that haven't ended yet
                })
                .slice(0, 3).map((tournament) => {
                const status = getTournamentStatus(tournament);
                return (
                  <Link 
                    key={tournament.id} 
                    href={`/tournaments/${tournament.slug}`}
                    className={styles.tournamentCard}
                  >
                    {/* Tournament Image */}
                    <div className={styles.tournamentImage}>
                      {tournament.image_url && (
                        <img 
                          src={tournament.image_url} 
                          alt={tournament.name}
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=240&fit=crop';
                          }}
                        />
                      )}
                      <div className={styles.tournamentOverlay}></div>
                      
                      {/* Status Badge */}
                      <div 
                        className={`${styles.statusBadge} ${status.pulse ? styles.statusPulse : ''}`}
                        style={{ background: status.color }}
                      >
                        <i className={`fas ${status.icon}`}></i>
                        <span>{status.label}</span>
                      </div>
                    </div>

                    {/* Tournament Info */}
                    <div className={styles.tournamentInfo}>
                      <h3 className={styles.tournamentName}>{tournament.name}</h3>
                      <div className={styles.tournamentMeta}>
                        <div className={styles.metaItem}>
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{tournament.location || 'Venue TBA'}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <i className="fas fa-calendar"></i>
                          <span>{formatDateRange(tournament.start_date, tournament.end_date)}</span>
                        </div>
                        {tournament.current_round > 0 && (
                          <div className={styles.metaItem}>
                            <i className="fas fa-golf-ball"></i>
                            <span>Round {tournament.current_round}</span>
                          </div>
                        )}
                      </div>
                      <div className={styles.tournamentAction}>
                        <span>View Details</span>
                        <i className="fas fa-arrow-right"></i>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}
