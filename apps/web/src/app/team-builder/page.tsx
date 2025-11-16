'use client';

import { useState, useEffect } from 'react';
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

  // Mock data - will be replaced with API calls
  useEffect(() => {
    const mockPlayers: Player[] = [
      { id: '1', name: 'Scottie Scheffler', country: 'USA', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', salary: 12500, worldRanking: 1, recentForm: 68.2, ownership: 78, avgScore: 69.1 },
      { id: '2', name: 'Rory McIlroy', country: 'NIR', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face', salary: 11800, worldRanking: 2, recentForm: 69.1, ownership: 72, avgScore: 69.5 },
      { id: '3', name: 'Jon Rahm', country: 'ESP', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face', salary: 11200, worldRanking: 3, recentForm: 68.8, ownership: 65, avgScore: 69.3 },
      { id: '4', name: 'Viktor Hovland', country: 'NOR', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face', salary: 9200, worldRanking: 5, recentForm: 69.8, ownership: 54, avgScore: 70.1 },
      { id: '5', name: 'Xander Schauffele', country: 'USA', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', salary: 10400, worldRanking: 4, recentForm: 69.2, ownership: 61, avgScore: 69.7 },
      { id: '6', name: 'Justin Thomas', country: 'USA', avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=100&h=100&fit=crop&crop=face', salary: 8900, worldRanking: 7, recentForm: 70.1, ownership: 48, avgScore: 70.3 },
      { id: '7', name: 'Hideki Matsuyama', country: 'JPN', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face', salary: 7600, worldRanking: 9, recentForm: 70.5, ownership: 42, avgScore: 70.6 },
      { id: '8', name: 'Collin Morikawa', country: 'USA', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face', salary: 9500, worldRanking: 6, recentForm: 69.6, ownership: 56, avgScore: 69.9 },
      { id: '9', name: 'Patrick Cantlay', country: 'USA', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', salary: 8800, worldRanking: 8, recentForm: 70.2, ownership: 45, avgScore: 70.4 },
      { id: '10', name: 'Bryson DeChambeau', country: 'USA', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face', salary: 8500, worldRanking: 10, recentForm: 70.8, ownership: 38, avgScore: 70.9 },
      { id: '11', name: 'Tony Finau', country: 'USA', avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=100&h=100&fit=crop&crop=face', salary: 7100, worldRanking: 12, recentForm: 71.1, ownership: 35, avgScore: 71.2 },
      { id: '12', name: 'Justin Rose', country: 'ENG', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face', salary: 6800, worldRanking: 15, recentForm: 71.5, ownership: 28, avgScore: 71.6 },
      { id: '13', name: 'Tommy Fleetwood', country: 'ENG', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face', salary: 7300, worldRanking: 11, recentForm: 70.9, ownership: 32, avgScore: 71.0 },
      { id: '14', name: 'Sam Burns', country: 'USA', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', salary: 5700, worldRanking: 18, recentForm: 71.8, ownership: 24, avgScore: 71.9 },
      { id: '15', name: 'Max Homa', country: 'USA', avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=100&h=100&fit=crop&crop=face', salary: 6900, worldRanking: 13, recentForm: 71.3, ownership: 30, avgScore: 71.4 },
      { id: '16', name: 'Cameron Smith', country: 'AUS', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', salary: 8700, worldRanking: 9, recentForm: 70.4, ownership: 41, avgScore: 70.5 },
      { id: '17', name: 'Will Zalatoris', country: 'USA', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face', salary: 7500, worldRanking: 14, recentForm: 71.0, ownership: 33, avgScore: 71.1 },
      { id: '18', name: 'Corey Conners', country: 'CAN', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face', salary: 6600, worldRanking: 16, recentForm: 71.6, ownership: 27, avgScore: 71.7 },
    ];
    
    setAvailablePlayers(mockPlayers);
    setLoading(false);
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
  );
}
