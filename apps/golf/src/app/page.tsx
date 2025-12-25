'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import { createClient } from '@/lib/supabaseClient';
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
    totalWinnings: 0,
    winRate: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

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
          
          setUserStats({
            totalEntries: entries.length,
            activeEntries,
            totalWinnings: 0, // TODO: Calculate from wins
            winRate: entries.length > 0 ? 0 : 0 // TODO: Calculate win rate
          });
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
        <div className={styles.container}>
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
      <div className={styles.container}>
        {/* Hero Section with Stats */}
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.welcomeSection}>
              <h1 className={styles.welcomeTitle}>
                Welcome back, <span className={styles.username}>{username || 'Player'}</span>
              </h1>
              <p className={styles.welcomeSubtitle}>Are you ready to dominate the greens?</p>
            </div>
            
            {/* Cards container on the right */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.546rem', width: '60%', flexShrink: 0 }}>
              {/* Stats Grid inside Hero */}
              <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <i className="fas fa-trophy"></i>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{userStats.activeEntries}</div>
                  <div className={styles.statLabel}>Active Entries</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                  <i className="fas fa-clipboard-list"></i>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{userStats.totalEntries}</div>
                  <div className={styles.statLabel}>Total Entries</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  <i className="fas fa-coins"></i>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{formatCurrency(userStats.totalWinnings)}</div>
                  <div className={styles.statLabel}>Total Winnings</div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                  <i className="fas fa-percentage"></i>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{userStats.winRate}%</div>
                  <div className={styles.statLabel}>Win Rate</div>
                </div>
              </div>
            </div>

            {/* Quick Actions inside Hero */}
            <div className={styles.actionGrid}>
              <Link href="/tournaments" className={styles.actionCard}>
                <div className={styles.actionIcon} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <i className="fas fa-trophy"></i>
                </div>
                <div className={styles.actionContent}>
                  <h3>Browse Tournaments</h3>
                  <p>Enter competitions & win prizes</p>
                </div>
              </Link>

              <Link href="/one-2-one" className={styles.actionCard}>
                <div className={styles.actionIcon} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  <i className="fas fa-swords"></i>
                </div>
                <div className={styles.actionContent}>
                  <h3>1-2-1 Matchmaker</h3>
                  <p>Challenge players head-to-head</p>
                </div>
              </Link>

              <Link href="/entries" className={styles.actionCard}>
                <div className={styles.actionIcon} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                  <i className="fas fa-clipboard-list"></i>
                </div>
                <div className={styles.actionContent}>
                  <h3>My Scorecards</h3>
                  <p>Track your active entries</p>
                </div>
              </Link>

              <Link href="/leaderboards" className={styles.actionCard}>
                <div className={styles.actionIcon} style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                  <i className="fas fa-ranking-star"></i>
                </div>
                <div className={styles.actionContent}>
                  <h3>Leaderboards</h3>
                  <p>Check competition standings</p>
                </div>
              </Link>
            </div>
            </div>
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
