'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import RequireAuth from '@/components/RequireAuth';
import styles from './team-builder.module.css';

interface Player {
  id: string;
  name: string;
  country: string;
  avatar: string;
  salary: number;
  worldRanking: number;
  recentForm: number; // Average score last 3 tournaments
  ownership: number; // Percentage of users who picked this player
  avgScore: number;
}

interface LineupSlot {
  slotNumber: number;
  player: Player | null;
  isCaptain: boolean;
}

export default function TeamBuilderPage() {
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [lineup, setLineup] = useState<LineupSlot[]>([
    { slotNumber: 1, player: null, isCaptain: false },
    { slotNumber: 2, player: null, isCaptain: false },
    { slotNumber: 3, player: null, isCaptain: false },
    { slotNumber: 4, player: null, isCaptain: false },
    { slotNumber: 5, player: null, isCaptain: false },
    { slotNumber: 6, player: null, isCaptain: false },
  ]);
  
  const [totalBudget] = useState(50000);
  const [searchQuery, setSearchQuery] = useState('');
  const [salaryFilter, setSalaryFilter] = useState<'all' | 'premium' | 'mid' | 'value'>('all');
  const [sortBy, setSortBy] = useState<'salary' | 'ranking' | 'form' | 'ownership'>('ranking');
  const [showOptimalTeam, setShowOptimalTeam] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch real golfers from API
  useEffect(() => {
    async function fetchGolfers() {
      try {
        setLoading(true);
        // TODO: Get competition ID from URL or tournament context
        // For now, this will need to be passed from the tournament/competition selection
        const competitionId = 'your-competition-id'; // This needs to come from router or context
        
        const res = await fetch(`/api/competitions/${competitionId}/available-golfers`);
        const data = await res.json();
        
        if (res.ok && data.golfers) {
          setAvailablePlayers(data.golfers);
        } else {
          console.error('Failed to fetch golfers:', data.error);
          // Fallback to empty or show error
          setAvailablePlayers([]);
        }
      } catch (error) {
        console.error('Error fetching golfers:', error);
        setAvailablePlayers([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchGolfers();
  }, []);

  // Calculate budget stats
  const usedBudget = lineup.reduce((sum, slot) => sum + (slot.player?.salary || 0), 0);
  const remainingBudget = totalBudget - usedBudget;
  const budgetPercentage = (usedBudget / totalBudget) * 100;
  const playersSelected = lineup.filter(slot => slot.player !== null).length;
  const averageSalary = playersSelected > 0 ? usedBudget / playersSelected : 0;
  const captain = lineup.find(slot => slot.isCaptain);

  // Budget health indicator
  const getBudgetHealth = () => {
    const remaining = remainingBudget;
    const emptySlots = 6 - playersSelected;
    const avgNeeded = emptySlots > 0 ? remaining / emptySlots : 0;

    if (emptySlots === 0) return { label: 'Complete', color: '#22c55e' };
    if (avgNeeded >= 8000) return { label: 'Excellent', color: '#22c55e' };
    if (avgNeeded >= 6000) return { label: 'Good', color: '#3b82f6' };
    if (avgNeeded >= 4000) return { label: 'Tight', color: '#f59e0b' };
    return { label: 'Critical', color: '#ef4444' };
  };

  const budgetHealth = getBudgetHealth();

  // Filter and sort players
  const filteredPlayers = availablePlayers
    .filter(player => {
      // Remove already selected players
      const isSelected = lineup.some(slot => slot.player?.id === player.id);
      if (isSelected) return false;

      // Search filter
      if (searchQuery && !player.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Salary filter
      if (salaryFilter === 'premium' && player.salary < 10000) return false;
      if (salaryFilter === 'mid' && (player.salary < 7000 || player.salary >= 10000)) return false;
      if (salaryFilter === 'value' && player.salary >= 7000) return false;

      // Affordability filter
      if (player.salary > remainingBudget) return false;

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'salary':
          return b.salary - a.salary;
        case 'ranking':
          return a.worldRanking - b.worldRanking;
        case 'form':
          return a.recentForm - b.recentForm;
        case 'ownership':
          return b.ownership - a.ownership;
        default:
          return 0;
      }
    });

  // Add player to lineup
  const addPlayer = (player: Player) => {
    const emptySlot = lineup.find(slot => slot.player === null);
    if (!emptySlot) {
      alert('Lineup is full! Remove a player first.');
      return;
    }

    if (player.salary > remainingBudget) {
      alert(`Insufficient budget! You need £${(player.salary - remainingBudget).toLocaleString()} more.`);
      return;
    }

    const newLineup = lineup.map(slot =>
      slot.slotNumber === emptySlot.slotNumber
        ? { ...slot, player }
        : slot
    );
    setLineup(newLineup);
  };

  // Remove player from lineup
  const removePlayer = (slotNumber: number) => {
    const newLineup = lineup.map(slot =>
      slot.slotNumber === slotNumber
        ? { ...slot, player: null, isCaptain: false }
        : slot
    );
    setLineup(newLineup);
  };

  // Set captain
  const setCaptain = (slotNumber: number) => {
    const newLineup = lineup.map(slot => ({
      ...slot,
      isCaptain: slot.slotNumber === slotNumber && slot.player !== null,
    }));
    setLineup(newLineup);
  };

  // Clear all players
  const clearLineup = () => {
    if (playersSelected === 0) return;
    if (confirm('Are you sure you want to clear your entire lineup?')) {
      setLineup(lineup.map(slot => ({ ...slot, player: null, isCaptain: false })));
    }
  };

  // Submit lineup
  const submitLineup = () => {
    if (playersSelected < 6) {
      alert('Please complete your lineup by selecting 6 players.');
      return;
    }
    if (!captain) {
      alert('Please select a captain to earn 2x points!');
      return;
    }
    alert('Lineup submitted successfully! Redirecting to scorecards...');
    // TODO: Submit to API and redirect
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `£${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading Team Builder...</p>
        </div>
      </div>
    );
  }

  return (
    <RequireAuth>
      <Header />
      <div className={styles.wrap}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerTop}>
            <div className={styles.headerContent}>
              <h1 className={styles.pageTitle}>Masters Tournament 2025</h1>
              <p className={styles.pageSubtitle}>April 10-13, 2025 • Build your dream team within the salary cap</p>
            </div>
          </div>
        </div>

        {/* Main Container */}
        <div className={styles.mainContainer}>
        {/* Left Panel - Available Players */}
        <section className={styles.leftPanel}>
          {/* Top Row: Search/Filters + Budget */}
          <div className={styles.topRow}>
            {/* Search and Filters */}
            <div className={`${styles.filtersCard} ${styles.glass}`}>
              <div className={styles.searchBox}>
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <div className={styles.filterRow}>
                <div className={styles.salaryFilters}>
                  <button
                    className={`${styles.filterBtn} ${salaryFilter === 'all' ? styles.active : ''}`}
                    onClick={() => setSalaryFilter('all')}
                  >
                    All Players
                  </button>
                  <button
                    className={`${styles.filterBtn} ${salaryFilter === 'premium' ? styles.active : ''}`}
                    onClick={() => setSalaryFilter('premium')}
                  >
                    Premium (£10K+)
                  </button>
                  <button
                    className={`${styles.filterBtn} ${salaryFilter === 'mid' ? styles.active : ''}`}
                    onClick={() => setSalaryFilter('mid')}
                  >
                    Mid-Range
                  </button>
                  <button
                    className={`${styles.filterBtn} ${salaryFilter === 'value' ? styles.active : ''}`}
                    onClick={() => setSalaryFilter('value')}
                  >
                    Value (&lt;£7K)
                  </button>
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={styles.sortSelect}
                >
                  <option value="ranking">Sort by Ranking</option>
                  <option value="salary">Sort by Salary</option>
                  <option value="form">Sort by Form</option>
                  <option value="ownership">Sort by Ownership</option>
                </select>
              </div>
            </div>

            {/* Budget Tracker */}
            <div className={`${styles.budgetCard} ${styles.glass}`}>
              <div className={styles.budgetHeader}>
                <div className={styles.budgetTitle}>
                  <i className="fas fa-wallet"></i>
                  <span>Budget Management</span>
                </div>
                <div className={styles.budgetHealth} style={{ background: `${budgetHealth.color}20`, color: budgetHealth.color, border: `1px solid ${budgetHealth.color}40` }}>
                  {budgetHealth.label}
                </div>
              </div>

              <div className={styles.budgetStats}>
                <div className={styles.budgetStat}>
                  <span className={styles.budgetLabel}>Remaining</span>
                  <span className={styles.budgetValue}>{formatCurrency(remainingBudget)}</span>
                </div>
                <div className={styles.budgetStat}>
                  <span className={styles.budgetLabel}>Players</span>
                  <span className={styles.budgetValue}>{playersSelected}/6</span>
                </div>
                <div className={styles.budgetStat}>
                  <span className={styles.budgetLabel}>Avg Salary</span>
                  <span className={styles.budgetValue}>{formatCurrency(Math.round(averageSalary))}</span>
                </div>
              </div>

              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${budgetPercentage}%` }}
                  ></div>
                </div>
                <span className={styles.progressLabel}>{budgetPercentage.toFixed(0)}% Used</span>
              </div>
            </div>
          </div>

          {/* Available Players List */}
          <div className={`${styles.playersCard} ${styles.glass}`}>
            <div className={styles.cardHeader}>
              <h3>Available Players</h3>
              <span className={styles.playerCount}>{filteredPlayers.length} players</span>
            </div>

            <div className={styles.playersList}>
              {filteredPlayers.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className="fas fa-user-slash"></i>
                  <p>No players match your filters</p>
                </div>
              ) : (
                filteredPlayers.map(player => (
                  <div key={player.id} className={styles.playerCard}>
                    <div className={styles.playerLeft}>
                      <img src={player.avatar} alt={player.name} className={styles.playerAvatar} />
                      <div className={styles.playerInfo}>
                        <div className={styles.playerName}>{player.name}</div>
                        <div className={styles.playerMeta}>
                          <span className={styles.country}>
                            <i className="fas fa-flag"></i>
                            {player.country}
                          </span>
                          <span className={styles.ranking}>
                            <i className="fas fa-medal"></i>
                            #{player.worldRanking}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.playerStats}>
                      <div className={styles.statItem}>
                        <div className={styles.statLabel}>Form</div>
                        <div className={styles.statValue}>{player.recentForm.toFixed(1)}</div>
                      </div>
                      <div className={styles.statItem}>
                        <div className={styles.statLabel}>Own%</div>
                        <div className={styles.statValue}>{player.ownership}%</div>
                      </div>
                    </div>

                    <div className={styles.playerRight}>
                      <div className={styles.playerSalary}>{formatCurrency(player.salary)}</div>
                      <button
                        onClick={() => addPlayer(player)}
                        className={styles.addBtn}
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right Panel - My Scorecard */}
        <section className={styles.rightPanel}>
          {/* My Scorecard */}
          <div className={`${styles.lineupCard} ${styles.glass}`}>
            <div className={styles.lineupHeader}>
              <div>
                <h3>Your Scorecard ({playersSelected}/6)</h3>
                <p className={styles.captainHint}>
                  <i className="fas fa-crown"></i>
                  {captain ? `${captain.player?.name} is your captain!` : 'Select a captain to earn 2x points'}
                </p>
              </div>
              {playersSelected > 0 && (
                <button onClick={clearLineup} className={styles.clearBtn}>
                  <i className="fas fa-trash-alt"></i>
                  Clear All
                </button>
              )}
            </div>

            <div className={styles.lineupSlots}>
              {lineup.map(slot => (
                <div
                  key={slot.slotNumber}
                  className={`${styles.lineupSlot} ${slot.player ? styles.filled : styles.empty} ${slot.isCaptain ? styles.captain : ''}`}
                >
                  {slot.player ? (
                    <>
                      {slot.isCaptain && (
                        <div className={styles.captainBadge}>
                          <i className="fas fa-crown"></i>
                          CAPTAIN - 2X POINTS
                        </div>
                      )}
                      <div className={styles.slotContent}>
                        <img src={slot.player.avatar} alt={slot.player.name} className={styles.slotAvatar} />
                        <div className={styles.slotInfo}>
                          <div className={styles.slotName}>{slot.player.name}</div>
                          <div className={styles.slotMeta}>
                            <span>#{slot.player.worldRanking}</span>
                            <span>•</span>
                            <span>Form: {slot.player.recentForm.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className={styles.slotSalary}>{formatCurrency(slot.player.salary)}</div>
                        <div className={styles.slotActions}>
                          {!slot.isCaptain && (
                            <button
                              onClick={() => setCaptain(slot.slotNumber)}
                              className={styles.captainBtn}
                              title="Make Captain"
                            >
                              <i className="fas fa-crown"></i>
                            </button>
                          )}
                          <button
                            onClick={() => removePlayer(slot.slotNumber)}
                            className={styles.removeBtn}
                            title="Remove Player"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={styles.emptySlot}>
                      <i className="fas fa-user-plus"></i>
                      <span>Select Player {slot.slotNumber}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Submit Button */}
            {playersSelected === 6 && captain && (
              <div className={styles.submitContainer}>
                <button onClick={submitLineup} className={styles.submitBtn}>
                  <i className="fas fa-check-circle"></i>
                  Submit Lineup
                </button>
              </div>
            )}

            {playersSelected === 6 && !captain && (
              <div className={styles.warningContainer}>
                <i className="fas fa-exclamation-triangle"></i>
                <span>Select a captain to continue</span>
              </div>
            )}
          </div>
        </section>
      </div>
      </div>
    </RequireAuth>
  );
}
