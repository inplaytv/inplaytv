'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TournamentSelector from '@/components/TournamentSelector';
import { formatPounds } from '@/lib/money';
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

interface OpenChallenge {
  instanceId: string;
  instanceNumber: number;
  tournamentId: string;
  tournamentName: string;
  tournamentSlug: string;
  templateName: string;
  shortName: string;
  roundsCovered: number[];
  entryFeePennies: number;
  adminFeePercent: number;
  currentPlayers: number;
  maxPlayers: number;
  createdAt: string;
  challenger: {
    userId: string;
    displayName: string;
    entryName: string | null;
  };
}

function formatCurrency(pennies: number): string {
  return formatPounds(pennies);
}

function getRoundDescription(rounds: number[]): string {
  if (!rounds || rounds.length === 0) return 'Unknown';
  if (rounds.length === 1) return `Round ${rounds[0]}`;
  if (rounds.length === 4) return 'All Rounds';
  const sorted = [...rounds].sort((a, b) => a - b);
  return `Rounds ${sorted[0]}-${sorted[sorted.length - 1]}`;
}

export default function One2OneUniversalPage() {
  const router = useRouter();
  
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
  const [openChallenges, setOpenChallenges] = useState<OpenChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'all' | 'by-tournament'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTournamentSlug, setCreateTournamentSlug] = useState<string | null>(null);

  // Fetch current user
  useEffect(() => {
    async function getCurrentUser() {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const data = await response.json();
          setCurrentUserId(data.user?.id || null);
        }
      } catch (err) {
        console.error('Failed to fetch current user:', err);
      }
    }
    getCurrentUser();
  }, []);

  // Fetch all active tournaments
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
          
          setAllTournaments(activeTournaments);
        }
      } catch (err) {
        console.error('Failed to fetch tournaments:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTournaments();
  }, []);

  // Fetch all open challenges
  const fetchOpenChallenges = useCallback(async () => {
    setLoadingChallenges(true);
    try {
      const response = await fetch('/api/one-2-one/all-open-challenges');
      if (response.ok) {
        const data = await response.json();
        setOpenChallenges(data.challenges || []);
      }
    } catch (err) {
      console.error('Failed to fetch challenges:', err);
    } finally {
      setLoadingChallenges(false);
    }
  }, []);

  useEffect(() => {
    fetchOpenChallenges();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchOpenChallenges, 30000);
    return () => clearInterval(interval);
  }, [fetchOpenChallenges]);

  // Filter challenges by selected tournament
  const displayedChallenges = selectedTournament
    ? openChallenges.filter(c => c.tournamentId === selectedTournament.id)
    : openChallenges;

  const handleJoinChallenge = async (instanceId: string) => {
    router.push(`/one-2-one/challenge/${instanceId}`);
  };

  const handleCreateChallenge = (tournamentSlug: string) => {
    console.log('🎯 Navigating to challenge creation for:', tournamentSlug);
    router.push(`/one-2-one/${tournamentSlug}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading ONE 2 ONE Challenge Board...</p>
        </div>
      </div>
    );
  }

  if (allTournaments.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <i className="fas fa-swords"></i> ONE 2 ONE Challenge Board
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
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backLink}>
          <i className="fas fa-arrow-left"></i> Back
        </Link>
        
        <h1 className={styles.title}>
          <i className="fas fa-swords"></i> ONE 2 ONE Challenge Board
        </h1>
        
        <p className={styles.subtitle}>
          Head-to-head golf challenges across all active tournaments
        </p>
      </div>

      {/* Tournament Filter */}
      <div className={styles.filterSection}>
        <div className={styles.filterHeader}>
          <h3>Filter by Tournament</h3>
          {selectedTournament && (
            <button 
              onClick={() => setSelectedTournament(null)}
              className={styles.clearFilter}
            >
              <i className="fas fa-times"></i> Show All
            </button>
          )}
        </div>
        
        <div className={styles.tournamentGrid}>
          {allTournaments.map(tournament => (
            <button
              key={tournament.id}
              onClick={() => setSelectedTournament(tournament)}
              className={`${styles.tournamentCard} ${
                selectedTournament?.id === tournament.id ? styles.selected : ''
              }`}
            >
              {tournament.image_url && (
                <img 
                  src={tournament.image_url} 
                  alt={tournament.name}
                  className={styles.tournamentImage}
                />
              )}
              <div className={styles.tournamentInfo}>
                <h4>{tournament.name}</h4>
                <span className={styles.challengeCount}>
                  {openChallenges.filter(c => c.tournamentId === tournament.id).length} open challenges
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Create Challenge Section */}
      <div className={styles.createSection}>
        <h3>
          <i className="fas fa-plus-circle"></i> Create New Challenge
        </h3>
        <p>Select a tournament to create your own ONE 2 ONE challenge</p>
        
        <div className={styles.tournamentList}>
          {allTournaments.map(tournament => (
            <button
              key={`create-${tournament.id}`}
              onClick={() => handleCreateChallenge(tournament.slug)}
              className={styles.createTournamentButton}
            >
              <div className={styles.createTournamentContent}>
                {tournament.image_url && (
                  <img 
                    src={tournament.image_url} 
                    alt={tournament.name}
                    className={styles.smallTournamentImage}
                  />
                )}
                <span>{tournament.name}</span>
              </div>
              <i className="fas fa-arrow-right"></i>
            </button>
          ))}
        </div>
      </div>

      {/* Open Challenges */}
      <div className={styles.challengesSection}>
        <div className={styles.challengesHeader}>
          <h3>
            <i className="fas fa-fire"></i> Open Challenges
          </h3>
          <button 
            onClick={fetchOpenChallenges}
            className={styles.refreshButton}
            disabled={loadingChallenges}
          >
            <i className={`fas fa-sync ${loadingChallenges ? styles.spinning : ''}`}></i>
            Refresh
          </button>
        </div>

        {loadingChallenges ? (
          <div className={styles.loadingChallenges}>
            <div className={styles.spinner}></div>
            <p>Loading challenges...</p>
          </div>
        ) : displayedChallenges.length === 0 ? (
          <div className={styles.emptyChallenges}>
            <div className={styles.emptyIcon}>
              <i className="fas fa-swords" style={{ fontSize: '80px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}></i>
            </div>
            <h2 className={styles.emptyTitle}>
              {selectedTournament ? 'No Open Challenges for This Tournament' : 'No Open Challenges'}
            </h2>
            <p className={styles.emptyDescription}>
              {selectedTournament 
                ? `Be the first to create a ONE 2 ONE challenge for ${selectedTournament.name}!`
                : 'Be the first to create a ONE 2 ONE challenge! Select a tournament above to get started.'
              }
            </p>
            <div className={styles.ctaButtons}>
              <button 
                onClick={() => selectedTournament && handleCreateChallenge(selectedTournament.slug)}
                className={styles.primaryCta}
                disabled={!selectedTournament}
              >
                <i className="fas fa-plus-circle"></i> Create Challenge
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.challengesGrid}>
            {displayedChallenges.map(challenge => {
              const isMyChallenge = currentUserId && challenge.challenger?.userId === currentUserId;
              const tournament = allTournaments.find(t => t.id === challenge.tournamentId);
              
              return (
                <div key={challenge.instanceId} className={styles.challengeCard}>
                  <div className={styles.challengeHeader}>
                    <div className={styles.tournamentBadge}>
                      {tournament?.image_url && (
                        <img 
                          src={tournament.image_url} 
                          alt={challenge.tournamentName}
                          className={styles.badgeImage}
                        />
                      )}
                      <span>{challenge.tournamentName}</span>
                    </div>
                  </div>
                  
                  <div className={styles.challengeBody}>
                    <div className={styles.challengeInfo}>
                      <div className={styles.infoRow}>
                        <span className={styles.label}>Entry Fee:</span>
                        <span className={styles.value}>{formatCurrency(challenge.entryFeePennies)}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.label}>Rounds:</span>
                        <span className={styles.value}>{getRoundDescription(challenge.roundsCovered)}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.label}>Players:</span>
                        <span className={styles.value}>{challenge.currentPlayers}/{challenge.maxPlayers}</span>
                      </div>
                      {challenge.challenger && (
                        <div className={styles.infoRow}>
                          <span className={styles.label}>Created by:</span>
                          <span className={styles.value}>
                            {isMyChallenge ? 'You' : challenge.challenger.displayName}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleJoinChallenge(challenge.instanceId)}
                      className={`${styles.joinButton} ${isMyChallenge ? styles.viewButton : ''}`}
                      disabled={isMyChallenge}
                    >
                      {isMyChallenge ? (
                        <>
                          <i className="fas fa-eye"></i> View Challenge
                        </>
                      ) : (
                        <>
                          <i className="fas fa-bolt"></i> Join Challenge
                        </>
                      )}
                    </button>
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
