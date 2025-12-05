'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './one-2-one.module.css';

interface One2OneTemplate {
  id: string;
  name: string;
  short_name: string;
  description: string;
  entry_fee_pennies: number;
  admin_fee_percent: number;
  max_players: number;
  rounds_covered: number[];
  reg_close_round: number | null;
  status: string;
  tournament_id: string;
  reg_close_at: string | null;
  is_open: boolean;
  available_instances: number;
}

interface Tournament {
  id: string;
  name: string;
  slug: string;
  start_date: string;
  current_round: number;
}

export default function One2OnePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [templates, setTemplates] = useState<One2OneTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/tournaments/${slug}/one-2-one`);
        if (!response.ok) throw new Error('Failed to fetch ONE 2 ONE data');
        
        const data = await response.json();
        setTournament(data.tournament);
        setTemplates(data.templates || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [slug]);

  const formatCurrency = (pennies: number) => {
    return `£${(pennies / 100).toFixed(2)}`;
  };

  const getRoundDescription = (roundsCovered: number[]) => {
    if (roundsCovered.length === 4) return 'ALL 4 ROUNDS';
    if (roundsCovered.length === 1) {
      const round = roundsCovered[0];
      return `ROUND ${round} ONLY`;
    }
    return `ROUNDS ${roundsCovered.join(', ')}`;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading ONE 2 ONE competitions...</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error || 'Tournament not found'}</p>
          <Link href="/tournaments" className={styles.backButton}>
            Back to Tournaments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.backgroundAnimation}>
        <div className={styles.gradientOrb1}></div>
        <div className={styles.gradientOrb2}></div>
        <div className={styles.gradientOrb3}></div>
      </div>

      <div className={styles.content}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/tournaments">Tournaments</Link>
          <i className="fas fa-chevron-right"></i>
          <Link href={`/tournaments/${slug}`}>{tournament.name}</Link>
          <i className="fas fa-chevron-right"></i>
          <span>ONE 2 ONE</span>
        </div>

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroIcon}>
            <i className="fas fa-swords"></i>
          </div>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>ONE 2 ONE MATCHMAKING</h1>
            <p className={styles.heroSubtitle}>Head-to-head battles • Winner takes all • Auto-matched opponents</p>
          </div>
        </div>

        {/* Info Cards */}
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <i className="fas fa-trophy"></i>
            </div>
            <div className={styles.infoContent}>
              <h3>Winner Takes All</h3>
              <p>Beat your opponent and take home 90% of the combined entry fees</p>
            </div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <i className="fas fa-users"></i>
            </div>
            <div className={styles.infoContent}>
              <h3>Auto-Matching</h3>
              <p>First-come-first-served matching • No skill-based pairing</p>
            </div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>
              <i className="fas fa-shield-alt"></i>
            </div>
            <div className={styles.infoContent}>
              <h3>Fair Play</h3>
              <p>If no opponent joins, you'll get a full refund automatically</p>
            </div>
          </div>
        </div>

        {/* Competitions Grid */}
        <div className={styles.competitionsSection}>
          <h2 className={styles.sectionTitle}>Available Competitions</h2>
          <div className={styles.competitionsGrid}>
            {templates.map((template) => {
              const prizePool = (template.entry_fee_pennies * 2 * (100 - template.admin_fee_percent)) / 100;
              const isClosed = !template.is_open;

              return (
                <div key={template.id} className={styles.competitionCard}>
                  <div className={styles.cardBadge}>
                    <i className="fas fa-swords"></i>
                    <span>1v1</span>
                  </div>

                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{getRoundDescription(template.rounds_covered)}</h3>
                    <p className={styles.cardDescription}>{template.description}</p>
                  </div>

                  <div className={styles.cardStats}>
                    <div className={styles.cardStat}>
                      <div className={styles.statIcon}>
                        <i className="fas fa-trophy"></i>
                      </div>
                      <div className={styles.statContent}>
                        <span className={styles.statLabel}>Winner Takes</span>
                        <span className={styles.statValue}>{formatCurrency(Math.round(prizePool))}</span>
                      </div>
                    </div>
                    <div className={styles.cardStat}>
                      <div className={styles.statIcon}>
                        <i className="fas fa-ticket-alt"></i>
                      </div>
                      <div className={styles.statContent}>
                        <span className={styles.statLabel}>Entry Fee</span>
                        <span className={styles.statValue}>{formatCurrency(template.entry_fee_pennies)}</span>
                      </div>
                    </div>
                    <div className={styles.cardStat}>
                      <div className={styles.statIcon}>
                        <i className="fas fa-users"></i>
                      </div>
                      <div className={styles.statContent}>
                        <span className={styles.statLabel}>Max Entries</span>
                        <span className={styles.statValue}>2 Entries Only</span>
                      </div>
                    </div>
                    <div className={styles.cardStat}>
                      <div className={styles.statIcon}>
                        <i className="fas fa-gamepad"></i>
                      </div>
                      <div className={styles.statContent}>
                        <span className={styles.statLabel}>Available Matches</span>
                        <span className={styles.statValue}>
                          {template.available_instances === 0 ? 'Join to Start' : `${template.available_instances} Open`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardStatus}>
                    {isClosed ? (
                      <div className={styles.statusClosed}>
                        <i className="fas fa-door-closed"></i>
                        <span>Registration Closed</span>
                      </div>
                    ) : (
                      <div className={styles.statusOpen}>
                        <i className="fas fa-check-circle"></i>
                        <span>Registration Open</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.cardActions}>
                    {!isClosed ? (
                      <button
                        className={styles.btnFindMatch}
                        onClick={() => router.push(`/one-2-one/${tournament.slug}/build-team?template=${template.id}`)}
                      >
                        <i className="fas fa-swords"></i>
                        <span>Find Match</span>
                      </button>
                    ) : (
                      <button className={styles.btnDisabled} disabled>
                        <i className="fas fa-door-closed"></i>
                        <span>Registration Closed</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
