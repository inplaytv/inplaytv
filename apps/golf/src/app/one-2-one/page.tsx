'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePageBackground } from '@/hooks/usePageBackground';
import styles from './one-2-one.module.css';

interface Tournament {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  start_date: string;
  end_date: string;
  current_round: number;
  status?: string;
  is_visible?: boolean;
}

export default function One2OneLobbyPage() {
  const router = useRouter();
  const backgroundSettings = usePageBackground('one2one_page_background');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTournaments() {
      try {
        const response = await fetch('/api/tournaments?status=active');
        if (response.ok) {
          const data = await response.json();
          
          // Filter tournaments that haven't ended
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const activeTournaments = (data.tournaments || []).filter((t: Tournament) => {
            if (!t.end_date) return false;
            const tournamentEnd = new Date(t.end_date);
            tournamentEnd.setHours(23, 59, 59, 999);
            return today <= tournamentEnd;
          });
          
          setTournaments(activeTournaments);
        }
      } catch (err) {
        // Silent fail - user will see empty state
      } finally {
        setLoading(false);
      }
    }
    fetchTournaments();
  }, []);

  const handleSelectTournament = (slug: string) => {
    router.push(`/one-2-one/${slug}`);
  };

  if (loading) {
    return (
      <div 
        className={styles.container}
        style={{
          '--bg-image': `url(${backgroundSettings.backgroundImage})`,
          '--bg-opacity': backgroundSettings.opacity,
          '--bg-overlay': backgroundSettings.overlay
        } as React.CSSProperties}
      >
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading tournaments...</p>
        </div>
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div 
        className={styles.container}
        style={{
          '--bg-image': `url(${backgroundSettings.backgroundImage})`,
          '--bg-opacity': backgroundSettings.opacity,
          '--bg-overlay': backgroundSettings.overlay
        } as React.CSSProperties}
      >
        <div className={styles.header}>
          <h1 className={styles.title}>
            <i className="fas fa-swords"></i> ONE 2 ONE Matchmaker
          </h1>
        </div>
        
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <i className="fas fa-calendar-xmark"></i>
          </div>
          <h2 className={styles.emptyTitle}>No Active Tournaments</h2>
          <p className={styles.emptyDescription}>
            There are currently no active tournaments available for ONE 2 ONE challenges.
            Check back soon for upcoming tournaments!
          </p>
          <Link href="/tournaments" className={styles.backButton}>
            <i className="fas fa-arrow-left"></i> Browse Tournaments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={styles.container}
      style={{
        '--bg-image': `url(${backgroundSettings.backgroundImage})`,
        '--bg-opacity': backgroundSettings.opacity,
        '--bg-overlay': backgroundSettings.overlay
      } as React.CSSProperties}
    >
      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        <div style={{ marginBottom: '3rem' }}>
          {/* Header with inline Back to Lobby link */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.5rem'
          }}>
            <Link href="/" style={{
              color: 'rgba(255,255,255,0.6)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              transition: 'color 0.2s ease',
              whiteSpace: 'nowrap'
            }}>
              <i className="fas fa-arrow-left"></i> Back to Lobby
            </Link>
            
            <h1 style={{
              fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
              fontWeight: 700,
              flex: 1,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 1rem'
            }}>
              <i className="fas fa-swords"></i> ONE 2 ONE Matchmaker
            </h1>
            
            {/* Empty spacer to balance the flex layout */}
            <div style={{ width: '120px' }}></div>
          </div>
          
          <p style={{
            fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
            marginBottom: '0',
            padding: '0 1rem'
          }}>
            Head-to-head battles • Winner takes all • Auto-matched opponents
          </p>
        </div>

        {/* Info Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '16px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 1rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: '#fff'
            }}>
              <i className="fas fa-trophy"></i>
            </div>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Winner Takes All
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
              Beat your opponent and take home 90% of the combined entry fees
            </p>
          </div>

          <div style={{
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '16px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 1rem',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: '#fff'
            }}>
              <i className="fas fa-sync-alt"></i>
            </div>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Auto-Matching
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
              First-come-first-served matching • No skill-based pairing
            </p>
          </div>

          <div style={{
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '16px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 1rem',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: '#fff'
            }}>
              <i className="fas fa-shield-alt"></i>
            </div>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Fair Play
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
              If no opponent joins, you'll get a full refund automatically
            </p>
          </div>
        </div>

        <h2 style={{
          fontSize: '1.8rem',
          fontWeight: 700,
          marginBottom: '1.5rem',
          color: '#fff',
          textAlign: 'center'
        }}>
          Select a Tournament
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
          padding: '0 0.5rem'
        }}>
          {tournaments.map(tournament => (
            <button
              key={tournament.id}
              onClick={() => handleSelectTournament(tournament.slug)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = '#fbbf24';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {tournament.image_url && (
                <div style={{
                  width: '100%',
                  height: '150px',
                  marginBottom: '1rem',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={tournament.image_url} 
                    alt={tournament.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              )}
              
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '0.5rem'
              }}>
                {tournament.name}
              </h3>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '1rem'
              }}>
                <span style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255,255,255,0.6)'
                }}>
                  Create or join challenges
                </span>
                <i className="fas fa-arrow-right" style={{
                  color: '#fbbf24',
                  fontSize: '1.2rem'
                }}></i>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
