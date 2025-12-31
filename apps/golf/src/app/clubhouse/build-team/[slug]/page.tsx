'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';
import RequireAuth from '@/components/RequireAuth';
import styles from './club-team-builder.module.css';

interface Golfer {
  id: string;
  first_name: string;
  last_name: string;
  country: string;
  salary_pennies: number;
  datagolf_id: number;
  owgr: number | null;
}

interface Tournament {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  prize_pool: number;
}

interface Competition {
  id: string;
  entry_fee_pennies: number;
  entrants_cap: number;
  credits_required: number;
  competition_types: {
    name: string;
    description: string;
  };
}

export default function ClubTeamBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [availableGolfers, setAvailableGolfers] = useState<Golfer[]>([]);
  const [selectedGolfers, setSelectedGolfers] = useState<(Golfer | null)[]>([null, null, null, null, null, null]);
  const [captainIndex, setCaptainIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'players' | 'info' | 'rules'>('players');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'ranking' | 'salary'>('ranking');
  const [userCredits, setUserCredits] = useState(500);

  useEffect(() => {
    loadTournamentData();
  }, [slug]);

  async function loadTournamentData() {
    const supabase = createClient();

    // Load tournament
    const { data: tournamentData } = await supabase
      .from('tournaments')
      .select('id, name, location, start_date, end_date')
      .eq('slug', slug)
      .single();

    if (tournamentData) {
      setTournament({
        ...tournamentData,
        prize_pool: 100000 // Mock prize pool
      });

      // Load competitions for this tournament
      const { data: competitionData } = await supabase
        .from('tournament_competitions')
        .select(`
          id,
          entry_fee_pennies,
          entrants_cap,
          competition_types (
            name,
            description
          )
        `)
        .eq('tournament_id', tournamentData.id)
        .eq('competition_format', 'inplay')
        .limit(1)
        .single();

      if (competitionData) {
        setCompetition({
          ...competitionData,
          credits_required: Math.floor(competitionData.entry_fee_pennies / 100) // Convert pennies to credits
        });
      }

      // Load available golfers
      const { data: golfersData } = await supabase
        .from('tournament_golfers')
        .select(`
          golfers (
            id,
            first_name,
            last_name,
            country,
            salary_pennies,
            datagolf_id,
            owgr
          )
        `)
        .eq('tournament_id', tournamentData.id)
        .eq('status', 'confirmed');

      if (golfersData) {
        const golfers = golfersData
          .map((tg: any) => tg.golfers)
          .filter(Boolean) as Golfer[];
        setAvailableGolfers(golfers);
      }
    }

    setLoading(false);
  }

  const handleGolferSelect = (golfer: Golfer) => {
    const firstEmptyIndex = selectedGolfers.findIndex(g => g === null);
    if (firstEmptyIndex !== -1) {
      const newSelected = [...selectedGolfers];
      newSelected[firstEmptyIndex] = golfer;
      setSelectedGolfers(newSelected);
    }
  };

  const handleGolferRemove = (index: number) => {
    const newSelected = [...selectedGolfers];
    newSelected[index] = null;
    setSelectedGolfers(newSelected);
    if (captainIndex === index) {
      setCaptainIndex(null);
    }
  };

  const handleSetCaptain = (index: number) => {
    if (selectedGolfers[index]) {
      setCaptainIndex(index);
    }
  };

  const handleSubmit = async () => {
    if (selectedGolfers.some(g => g === null)) {
      alert('Please select all 6 golfers');
      return;
    }
    if (captainIndex === null) {
      alert('Please select a captain');
      return;
    }
    
    // Submit entry logic here
    router.push('/clubhouse');
  };

  const filteredGolfers = availableGolfers
    .filter(g => {
      const fullName = `${g.first_name} ${g.last_name}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    })
    .filter(g => !selectedGolfers.some(sg => sg?.id === g.id))
    .sort((a, b) => {
      if (sortBy === 'name') return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      if (sortBy === 'ranking') return (a.owgr || 999) - (b.owgr || 999);
      return (b.salary_pennies || 0) - (a.salary_pennies || 0);
    });

  if (loading) {
    return (
      <RequireAuth>
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading team builder...</p>
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
          <div className={styles.headerOverlay}></div>
          <div className={styles.headerContent}>
            <div className={styles.clubBadge}>
              <i className="fas fa-shield-alt"></i>
            </div>
            <div className={styles.tournamentInfo}>
              <h1 className={styles.tournamentName}>{tournament?.name}</h1>
              <p className={styles.tournamentLocation}>
                <i className="fas fa-map-marker-alt"></i>
                {tournament?.location}
              </p>
            </div>
            <div className={styles.headerStats}>
              <div className={styles.headerStat}>
                <span className={styles.statLabel}>Credits Pool</span>
                <span className={styles.statValue}>{tournament?.prize_pool.toLocaleString()}</span>
              </div>
              <div className={styles.headerStat}>
                <span className={styles.statLabel}>Entry</span>
                <span className={styles.statValue}>{competition?.credits_required || 0} credits</span>
              </div>
            </div>
          </div>
        </div>

        {/* Team Slots */}
        <div className={styles.teamSection}>
          <h2 className={styles.teamTitle}>
            <i className="fas fa-users"></i>
            Build Your Club Team
          </h2>
          <p className={styles.teamSubtitle}>
            Select 6 golfers. Choose your captain - their points will be doubled.
          </p>
          
          <div className={styles.teamSlots}>
            {selectedGolfers.map((golfer, index) => (
              <div 
                key={index}
                className={`${styles.slot} ${captainIndex === index ? styles.captainSlot : ''}`}
                onClick={() => golfer && handleSetCaptain(index)}
              >
                {golfer ? (
                  <>
                    <button 
                      className={styles.removeBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGolferRemove(index);
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                    <div className={styles.slotAvatar}>
                      <div className={styles.avatarPlaceholder}>
                        <i className="fas fa-user"></i>
                      </div>
                    </div>
                    <div className={styles.slotName}>
                      {golfer.first_name[0]}. {golfer.last_name}
                    </div>
                    {captainIndex === index && (
                      <div className={styles.captainBadge}>
                        <i className="fas fa-star"></i>
                        CAPTAIN
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className={styles.slotAvatar}>
                      <div className={styles.avatarEmpty}>
                        <i className="fas fa-plus"></i>
                      </div>
                    </div>
                    <div className={styles.slotName}>
                      {index === 0 ? 'SELECT CAPTAIN' : 'ADD GOLFER'}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className={styles.creditsBar}>
            <div className={styles.creditsInfo}>
              <i className="fas fa-coins"></i>
              <span>Your Credits: <strong>{userCredits}</strong></span>
            </div>
            <div className={styles.creditsInfo}>
              <i className="fas fa-ticket-alt"></i>
              <span>Entry Cost: <strong>{competition?.credits_required || 0}</strong></span>
            </div>
            {selectedGolfers.every(g => g !== null) && captainIndex !== null && (
              <button className={styles.submitBtn} onClick={handleSubmit}>
                <i className="fas fa-check"></i>
                Purchase Scorecard
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'players' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('players')}
          >
            <i className="fas fa-users"></i>
            Player Selections
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'info' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <i className="fas fa-info-circle"></i>
            Event Information
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'rules' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            <i className="fas fa-book"></i>
            Rules & Scoring
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'players' && (
            <div className={styles.playersTab}>
              <div className={styles.searchBar}>
                <i className="fas fa-search"></i>
                <input 
                  type="text"
                  placeholder="Search golfers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={styles.sortSelect}
                >
                  <option value="ranking">Sort by Ranking</option>
                  <option value="name">Sort by Name</option>
                  <option value="salary">Sort by Salary</option>
                </select>
              </div>

              <div className={styles.golfersGrid}>
                {filteredGolfers.map((golfer) => (
                  <div 
                    key={golfer.id}
                    className={styles.golferCard}
                    onClick={() => handleGolferSelect(golfer)}
                  >
                    <div className={styles.golferRank}>
                      Ranked #{golfer.owgr || '—'}
                    </div>
                    <div className={styles.golferAvatar}>
                      <i className="fas fa-user-circle"></i>
                    </div>
                    <div className={styles.golferName}>
                      {golfer.first_name} {golfer.last_name}
                    </div>
                    <div className={styles.golferCountry}>
                      <span className={styles.flagIcon}>{golfer.country}</span>
                      {golfer.country}
                    </div>
                    <button className={styles.addBtn}>
                      <i className="fas fa-plus"></i>
                      Add to Team
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'info' && (
            <div className={styles.infoTab}>
              <h3>Tournament Information</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoCard}>
                  <i className="fas fa-calendar"></i>
                  <div>
                    <strong>Start Date</strong>
                    <p>{new Date(tournament!.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className={styles.infoCard}>
                  <i className="fas fa-flag-checkered"></i>
                  <div>
                    <strong>End Date</strong>
                    <p>{new Date(tournament!.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className={styles.infoCard}>
                  <i className="fas fa-trophy"></i>
                  <div>
                    <strong>Competition Type</strong>
                    <p>{competition?.competition_types.name}</p>
                  </div>
                </div>
                <div className={styles.infoCard}>
                  <i className="fas fa-info-circle"></i>
                  <div>
                    <strong>Description</strong>
                    <p>{competition?.competition_types.description || 'Club exclusive competition'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className={styles.rulesTab}>
              <h3>Club Competition Rules</h3>
              <div className={styles.rulesList}>
                <div className={styles.ruleItem}>
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <strong>Team Selection</strong>
                    <p>Select 6 golfers from the tournament field. One must be designated as your captain.</p>
                  </div>
                </div>
                <div className={styles.ruleItem}>
                  <i className="fas fa-star"></i>
                  <div>
                    <strong>Captain Bonus</strong>
                    <p>Your captain's points are doubled throughout the tournament.</p>
                  </div>
                </div>
                <div className={styles.ruleItem}>
                  <i className="fas fa-coins"></i>
                  <div>
                    <strong>Club Credits</strong>
                    <p>Use club credits to enter. Win credits that can be redeemed at partner pro shops.</p>
                  </div>
                </div>
                <div className={styles.ruleItem}>
                  <i className="fas fa-trophy"></i>
                  <div>
                    <strong>Scoring</strong>
                    <p>Points are awarded based on each golfer's performance. Lower scores = more points.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}
