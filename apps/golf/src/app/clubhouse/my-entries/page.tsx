'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import styles from './my-entries.module.css';

interface Entry {
  id: string;
  created_at: string;
  credits_paid: number;
  status: string;
  golfer_ids: string[];
  captain_id: string;
  golfers?: Array<{
    id: string;
    name: string;
    isCaptain: boolean;
  }>;
  competition: {
    id: string;
    name: string;
    event: {
      id: string;
      name: string;
      slug: string;
      status: string;
    };
  };
}

export default function MyEntriesPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [activeEntryIndex, setActiveEntryIndex] = useState<{[competitionId: string]: number}>({});

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  async function fetchEntries() {
    const supabase = createClient();
    
    // Fetch entries first
    const { data: entriesData, error: entriesError } = await supabase
      .from('clubhouse_entries')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (entriesError) {
      console.error('Error fetching entries:', entriesError);
      setLoading(false);
      return;
    }

    if (!entriesData || entriesData.length === 0) {
      setEntries([]);
      setLoading(false);
      return;
    }

    // Get unique competition IDs
    const competitionIds = [...new Set(entriesData.map(e => e.competition_id))];

    // Fetch competitions
    const { data: competitions, error: compError } = await supabase
      .from('clubhouse_competitions')
      .select('id, name, event_id')
      .in('id', competitionIds);

    if (compError) {
      console.error('Error fetching competitions:', compError);
      setLoading(false);
      return;
    }

    // Get unique event IDs
    const eventIds = [...new Set(competitions?.map(c => c.event_id) || [])];

    // Fetch events
    const { data: events, error: eventsError } = await supabase
      .from('clubhouse_events')
      .select('id, name, slug, status')
      .in('id', eventIds);

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      setLoading(false);
      return;
    }

    // Get all golfer IDs from all entries
    const allGolferIds = [...new Set(entriesData.flatMap(e => e.golfer_ids))];

    // Fetch golfer names
    const { data: golfers } = await supabase
      .from('golfers')
      .select('id, first_name, last_name')
      .in('id', allGolferIds);

    // Map data together
    const enrichedEntries = entriesData.map(entry => {
      const competition = competitions?.find(c => c.id === entry.competition_id);
      const event = events?.find(e => e.id === competition?.event_id);
      
      // Map golfer names
      const entryGolfers = entry.golfer_ids.map((golferId: string) => {
        const golfer = golfers?.find(g => g.id === golferId);
        return {
          id: golferId,
          name: golfer ? `${golfer.first_name} ${golfer.last_name}` : 'Unknown',
          isCaptain: golferId === entry.captain_id
        };
      });
      
      return {
        ...entry,
        golfers: entryGolfers,
        competition: {
          id: competition?.id || entry.competition_id,
          name: competition?.name || 'Unknown Competition',
          event: {
            id: event?.id || '',
            name: event?.name || 'Unknown Event',
            slug: event?.slug || '',
            status: event?.status || 'unknown'
          }
        }
      };
    });

    setEntries(enrichedEntries as any);
    setLoading(false);
  }

  const filteredEntries = entries.filter(entry => {
    if (filter === 'all') return true;
    if (filter === 'active') return entry.competition.event.status === 'open' || entry.competition.event.status === 'active';
    if (filter === 'completed') return entry.competition.event.status === 'completed';
    return true;
  });

  const getStatusBadge = (status: string) => {
    const statusColors = {
      upcoming: '#6b7280',
      open: '#10b981',
      active: '#f59e0b',
      completed: '#6366f1'
    };

    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: 600,
        background: statusColors[status as keyof typeof statusColors] || '#6b7280',
        color: '#fff',
        textTransform: 'uppercase'
      }}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <RequireAuth>
        <div className={styles.container}>
          <div className={styles.loading}>
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading your entries...</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              <i className="fas fa-clipboard-list"></i>
              My Entries ({entries.length})
            </h1>
            <p className={styles.subtitle}>View your tournament entries and teams</p>
          </div>
          <Link href="/clubhouse/events" className={styles.enterBtn}>
            <i className="fas fa-plus"></i>
            Enter New Event
          </Link>
        </div>

        {/* Entries Grid */}
        {filteredEntries.length === 0 ? (
          <div className={styles.empty}>
            <i className="fas fa-inbox"></i>
            <h3>No entries found</h3>
            <p>You haven't entered any {filter !== 'all' ? filter : ''} events yet</p>
            <Link href="/clubhouse/events" className={styles.browseBtn}>
              Browse Events
            </Link>
          </div>
        ) : (
          <div className={styles.entriesGrid}>
            {/* Group entries by competition */}
            {(() => {
              // Group entries by competition
              const groupedEntries = filteredEntries.reduce((acc, entry) => {
                const compId = entry.competition.id;
                if (!acc[compId]) {
                  acc[compId] = [];
                }
                acc[compId].push(entry);
                return acc;
              }, {} as {[key: string]: Entry[]});

              // Convert to array and sort by entry count (descending - most entries first)
              const sortedCompetitions = Object.entries(groupedEntries)
                .sort(([, aEntries], [, bEntries]) => bEntries.length - aEntries.length);

              return sortedCompetitions.map(([competitionId, compEntries]) => {
                const currentIndex = activeEntryIndex[competitionId] || 0;
                const entry = compEntries[currentIndex];
                const totalEntries = compEntries.length;

                return (
                  <div key={competitionId} className={styles.entryCard}>
                    <div className={styles.cardContainer}>
                      {/* Left Side - Event/Competition Details */}
                      <div className={styles.detailsPanel}>
                        <div className={styles.miniFilters}>
                          <div className={styles.miniFilter}>All ({entries.length})</div>
                          <div className={styles.miniFilter}>Active ({entries.filter(e => e.competition.event.status === 'open' || e.competition.event.status === 'active').length})</div>
                          <div className={styles.miniFilter}>Completed ({entries.filter(e => e.competition.event.status === 'completed').length})</div>
                        </div>
                        <h3 className={styles.eventName}>{entry.competition.event.name}</h3>
                        <p className={styles.compName}>{entry.competition.name}</p>
                        
                        <div className={styles.metaGrid}>
                          <div className={styles.metaItem}>
                            <i className="fas fa-coins"></i>
                            <div>
                              <span className={styles.metaLabel}>Entry Fee</span>
                              <span className={styles.metaValue}>{entry.credits_paid}</span>
                            </div>
                          </div>
                          <div className={styles.metaItem}>
                            <i className="fas fa-users"></i>
                            <div>
                              <span className={styles.metaLabel}>Entries</span>
                              <span className={styles.metaValue}>
                                {totalEntries}/50
                              </span>
                            </div>
                          </div>
                        </div>

                        <Link 
                          href={`/clubhouse/leaderboard/${entry.competition.id}`} 
                          className={styles.leaderboardBtn}
                        >
                          <i className="fas fa-trophy"></i>
                          View Leaderboard
                        </Link>
                      </div>

                      {/* Right Side - Team Selection */}
                      <div className={styles.teamPanel}>
                        <div className={styles.teamHeader}>
                          <h4>
                            <i className="fas fa-users"></i>
                            Your Team
                          </h4>
                          <button className={styles.editBtn} disabled title="Edit coming soon">
                            <i className="fas fa-edit"></i>
                            Edit
                          </button>
                        </div>

                        <div className={styles.golferGrid}>
                          {entry.golfers?.map((golfer) => (
                            <div 
                              key={golfer.id}
                              className={`${styles.golferCard} ${golfer.isCaptain ? styles.captain : ''}`}
                            >
                              <div className={styles.golferInfo}>
                                <span className={styles.golferName}>{golfer.name}</span>
                                {golfer.isCaptain && (
                                  <span className={styles.captainBadge}>
                                    <i className="fas fa-star"></i>
                                    Captain
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Entry Navigation */}
                        {totalEntries > 1 && (
                          <div className={styles.entryNavigation}>
                            <button
                              className={styles.navArrow}
                              onClick={() => setActiveEntryIndex(prev => ({
                                ...prev,
                                [competitionId]: Math.max(0, currentIndex - 1)
                              }))}
                              disabled={currentIndex === 0}
                            >
                              <i className="fas fa-chevron-left"></i>
                            </button>

                            <div className={styles.entryNumbers}>
                              {compEntries.map((_, idx) => (
                                <button
                                  key={idx}
                                  className={`${styles.entryNumberBtn} ${idx === currentIndex ? styles.active : ''}`}
                                  onClick={() => setActiveEntryIndex(prev => ({
                                    ...prev,
                                    [competitionId]: idx
                                  }))}
                                >
                                  {idx + 1}
                                </button>
                              ))}
                            </div>

                            <button
                              className={styles.navArrow}
                              onClick={() => setActiveEntryIndex(prev => ({
                                ...prev,
                                [competitionId]: Math.min(totalEntries - 1, currentIndex + 1)
                              }))}
                              disabled={currentIndex === totalEntries - 1}
                            >
                              <i className="fas fa-chevron-right"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
