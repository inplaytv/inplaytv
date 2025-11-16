'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './tournament-detail.module.css';

interface CompetitionType {
  id: string;
  name: string;
  slug: string;
}

interface Competition {
  id: string;
  tournament_id: string;
  competition_type_id: string;
  entry_fee_pennies: number;
  entrants_cap: number;
  admin_fee_percent: number;
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
      const res = await fetch(`/api/tournaments/${slug}`);
      if (!res.ok) throw new Error('Tournament not found');
      
      const data = await res.json();
      setTournament(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (pennies: number) => {
    return `£${(pennies / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
    
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; icon: string; color: string }> = {
      draft: { label: 'Draft', icon: 'fa-pencil-alt', color: '#6b7280' },
      upcoming: { label: 'Upcoming', icon: 'fa-clock', color: '#3b82f6' },
      reg_open: { label: 'Registration Open', icon: 'fa-door-open', color: '#10b981' },
      reg_closed: { label: 'Registration Closed', icon: 'fa-door-closed', color: '#f59e0b' },
      live: { label: 'Live', icon: 'fa-circle', color: '#ef4444' },
      completed: { label: 'Completed', icon: 'fa-check-circle', color: '#8b5cf6' },
      cancelled: { label: 'Cancelled', icon: 'fa-times-circle', color: '#ef4444' },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return { ...config };
  };

  const calculatePrizePool = (comp: Competition) => {
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
      <div className={styles.heroSection}>
        <div 
          className={styles.heroBackground}
          style={{
            backgroundImage: tournament.image_url 
              ? `linear-gradient(rgba(10, 15, 26, 0.7), rgba(10, 15, 26, 0.9)), url(${tournament.image_url})`
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          <div className={styles.heroOverlay}></div>
        </div>
        
        <div className={styles.heroContent}>
          <Link href="/tournaments" className={styles.backLink}>
            <i className="fas fa-arrow-left"></i>
            <span>Back to Tournaments</span>
          </Link>

          <div className={styles.heroTitle}>
            <h1>{tournament.name}</h1>
            <div className={styles.heroSubtitle}>
              <div className={styles.metaChip}>
                <i className="fas fa-map-marker-alt"></i>
                <span>{tournament.location || 'Venue TBA'}</span>
              </div>
              <div className={styles.metaDivider}>•</div>
              <div className={styles.metaChip}>
                <i className="fas fa-calendar-alt"></i>
                <span>{formatDateRange(tournament.start_date, tournament.end_date)}</span>
              </div>
              <div className={styles.metaDivider}>•</div>
              <div className={styles.metaChip}>
                <i className="fas fa-users"></i>
                <span>{tournament.competitions.length} Competition{tournament.competitions.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Competitions Section */}
      <div className={styles.mainContent}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <div>
              <h2>Choose Your Competition</h2>
              <p>Select a competition format and build your dream team</p>
            </div>
          </div>
        </div>

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
              const firstPlacePrize = prizePool * 0.25;
              const statusBadge = getStatusBadge(competition.status);
              const canRegister = competition.status === 'reg_open';

              return (
                <div key={competition.id} className={`${styles.competitionCard} ${styles.glass}`}>
                  {/* Status Badge Ribbon */}
                  <div 
                    className={styles.statusRibbon} 
                    style={{ background: statusBadge.color }}
                  >
                    <span>{statusBadge.label}</span>
                  </div>

                  <div className={styles.cardContent}>
                    {/* Competition Type Header */}
                    <div className={styles.cardHeader}>
                      <h3>{competition.competition_types.name}</h3>
                    </div>

                    {/* Prize Pool Highlight */}
                    <div className={styles.prizeHighlight}>
                      <div className={styles.prizeLabel}>Total Prize Pool</div>
                      <div className={styles.prizeAmount}>{formatCurrency(Math.round(prizePool * 100))}</div>
                      <div className={styles.prizeSubtext}>
                        <i className="fas fa-medal"></i>
                        1st Place: {formatCurrency(Math.round(firstPlacePrize * 100))}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className={styles.statsGrid}>
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
                          <div className={styles.statLabel}>Max Teams</div>
                          <div className={styles.statValue}>
                            {competition.entrants_cap === 0 ? '∞' : competition.entrants_cap.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Registration Dates */}
                    {competition.reg_open_at && (
                      <div className={styles.registrationInfo}>
                        <div className={styles.regItem}>
                          <i className="fas fa-door-open"></i>
                          <span>Opens: {formatDate(competition.reg_open_at)}</span>
                        </div>
                        {competition.reg_close_at && (
                          <div className={styles.regItem}>
                            <i className="fas fa-door-closed"></i>
                            <span>Closes: {formatDate(competition.reg_close_at)}</span>
                          </div>
                        )}
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
                            <span>Build Your Team</span>
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}
