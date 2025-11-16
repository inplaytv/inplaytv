'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import InsufficientFundsModal from '@/components/InsufficientFundsModal';
import styles from './build-team.module.css';

interface Golfer {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  world_ranking: number | null;
  image_url: string | null;
  salary: number;
}

interface LineupSlot {
  slotNumber: number;
  golfer: Golfer | null;
  isCaptain: boolean;
}

interface Competition {
  id: string;
  tournament_id: string;
  competition_type_name: string;
  tournament_name: string;
  entry_fee_pennies: number;
  entrants_cap: number;
  reg_open_at: string | null;
  reg_close_at: string | null;
}

interface ExistingEntry {
  id: string;
  entry_name: string | null;
  total_salary: number;
  captain_golfer_id: string | null;
  status: string;
  picks: Array<{
    golfer_id: string;
    slot_position: number;
    salary_at_selection: number;
  }>;
}

export default function BuildTeamPage({ params }: { params: { competitionId: string } }) {
  const router = useRouter();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [availableGolfers, setAvailableGolfers] = useState<Golfer[]>([]);
  const [lineup, setLineup] = useState<LineupSlot[]>([
    { slotNumber: 1, golfer: null, isCaptain: false },
    { slotNumber: 2, golfer: null, isCaptain: false },
    { slotNumber: 3, golfer: null, isCaptain: false },
    { slotNumber: 4, golfer: null, isCaptain: false },
    { slotNumber: 5, golfer: null, isCaptain: false },
    { slotNumber: 6, golfer: null, isCaptain: false },
  ]);
  
  const [totalBudget] = useState(50000); // £50,000 salary cap
  const [searchQuery, setSearchQuery] = useState('');
  const [salaryFilter, setSalaryFilter] = useState<'all' | 'premium' | 'mid' | 'value'>('all');
  const [sortBy, setSortBy] = useState<'salary' | 'ranking' | 'points' | 'name'>('ranking');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [entryName, setEntryName] = useState('');
  const [existingEntryId, setExistingEntryId] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [insufficientFunds, setInsufficientFunds] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [requiredAmount, setRequiredAmount] = useState(0);

  // Load competition details and golfers
  useEffect(() => {
    fetchCompetitionData();
  }, [params.competitionId]);

  async function fetchCompetitionData() {
    try {
      setLoading(true);
      setError('');

      // Check user's wallet balance first
      console.log('🔍 Checking user balance...');
      const balanceRes = await fetch('/api/user/balance');
      let userBalanceAmount = 0;
      
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        userBalanceAmount = balanceData.balance_pennies || 0;
        setUserBalance(userBalanceAmount);
        console.log('💰 User balance:', userBalanceAmount, 'pennies (£' + (userBalanceAmount / 100).toFixed(2) + ')');
      } else {
        console.error('❌ Failed to fetch balance:', balanceRes.status);
      }

      // Fetch competition details
      const compRes = await fetch(`/api/competitions/${params.competitionId}`);
      if (!compRes.ok) throw new Error('Failed to load competition');
      const compData = await compRes.json();
      
      console.log('🏆 Competition entry fee:', compData.entry_fee_pennies, 'pennies (£' + (compData.entry_fee_pennies / 100).toFixed(2) + ')');

      // Check if user has enough balance - use the local variable, not state
      if (userBalanceAmount < compData.entry_fee_pennies) {
        console.log('❌ INSUFFICIENT FUNDS!');
        setInsufficientFunds(true);
        setRequiredAmount(compData.entry_fee_pennies);
        setShowInsufficientModal(true);
        setError(`Insufficient funds. You need £${(compData.entry_fee_pennies / 100).toFixed(2)} but have £${(userBalanceAmount / 100).toFixed(2)} in your wallet.`);
        // Don't set competition or load any more data - stop here
        setLoading(false);
        return;
      }
      
      // Only set competition if balance check passed
      setCompetition(compData);
      
      console.log('✅ Balance check passed');

      // Fetch available golfers for this competition
      const golfersRes = await fetch(`/api/competitions/${params.competitionId}/golfers`);
      if (!golfersRes.ok) throw new Error('Failed to load golfers');
      const golfersData = await golfersRes.json();
      console.log('Fetched golfers:', golfersData.length, golfersData);
      setAvailableGolfers(golfersData);

      // Check if user has an existing entry
      const entryRes = await fetch(`/api/competitions/${params.competitionId}/my-entry`);
      if (entryRes.ok) {
        const existingEntry: ExistingEntry = await entryRes.json();
        if (existingEntry && existingEntry.status === 'draft') {
          // Load existing draft entry
          loadExistingEntry(existingEntry, golfersData);
        }
      }

    } catch (err: any) {
      console.error('Failed to load competition data:', err);
      setError(err.message || 'Failed to load competition data');
    } finally {
      setLoading(false);
    }
  }

  function loadExistingEntry(entry: ExistingEntry, golfers: Golfer[]) {
    setExistingEntryId(entry.id);
    setEntryName(entry.entry_name || '');
    
    const newLineup = [...lineup];
    entry.picks.forEach(pick => {
      const golfer = golfers.find(g => g.id === pick.golfer_id);
      if (golfer) {
        const slot = newLineup.find(s => s.slotNumber === pick.slot_position);
        if (slot) {
          slot.golfer = golfer;
          slot.isCaptain = (pick.golfer_id === entry.captain_golfer_id);
        }
      }
    });
    setLineup(newLineup);
  }

  // Calculate budget stats
  const usedBudget = lineup.reduce((sum, slot) => sum + (slot.golfer?.salary || 0), 0);
  const remainingBudget = totalBudget - usedBudget;
  const budgetPercentage = (usedBudget / totalBudget) * 100;
  const playersSelected = lineup.filter(slot => slot.golfer !== null).length;
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

  // Filter and sort golfers
  const filteredGolfers = availableGolfers
    .filter(golfer => {
      // Remove already selected golfers
      const isSelected = lineup.some(slot => slot.golfer?.id === golfer.id);
      if (isSelected) return false;

      // Search filter
      if (searchQuery && !golfer.full_name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Salary filter
      if (salaryFilter === 'premium' && golfer.salary < 10000) return false;
      if (salaryFilter === 'mid' && (golfer.salary < 7000 || golfer.salary >= 10000)) return false;
      if (salaryFilter === 'value' && golfer.salary >= 7000) return false;

      // Affordability filter - Don't filter if no players selected yet
      if (playersSelected > 0 && golfer.salary > remainingBudget) return false;

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'salary':
          return b.salary - a.salary;
        case 'ranking':
          return (a.world_ranking || 999) - (b.world_ranking || 999);
        case 'name':
          return a.full_name.localeCompare(b.full_name);
        default:
          return 0;
      }
    });

  // Add golfer to lineup
  const addGolfer = (golfer: Golfer) => {
    const emptySlot = lineup.find(slot => slot.golfer === null);
    if (!emptySlot) {
      alert('Lineup is full! Remove a golfer first.');
      return;
    }

    if (golfer.salary > remainingBudget) {
      alert(`Not enough budget! This golfer costs £${golfer.salary.toLocaleString()}`);
      return;
    }

    const newLineup = lineup.map(slot => 
      slot.slotNumber === emptySlot.slotNumber 
        ? { ...slot, golfer }
        : slot
    );
    setLineup(newLineup);
  };

  // Remove golfer from lineup
  const removeGolfer = (slotNumber: number) => {
    const newLineup = lineup.map(slot =>
      slot.slotNumber === slotNumber
        ? { ...slot, golfer: null, isCaptain: false }
        : slot
    );
    setLineup(newLineup);
  };

  // Set captain
  const setCaptain = (slotNumber: number) => {
    const slot = lineup.find(s => s.slotNumber === slotNumber);
    if (!slot || !slot.golfer) {
      alert('Select a golfer for this slot first!');
      return;
    }

    const newLineup = lineup.map(s => ({
      ...s,
      isCaptain: s.slotNumber === slotNumber,
    }));
    setLineup(newLineup);
  };

  // Clear all selections
  const clearLineup = () => {
    if (!confirm('Are you sure you want to clear your entire lineup?')) return;
    setLineup([
      { slotNumber: 1, golfer: null, isCaptain: false },
      { slotNumber: 2, golfer: null, isCaptain: false },
      { slotNumber: 3, golfer: null, isCaptain: false },
      { slotNumber: 4, golfer: null, isCaptain: false },
      { slotNumber: 5, golfer: null, isCaptain: false },
      { slotNumber: 6, golfer: null, isCaptain: false },
    ]);
  };

  // Save draft
  const saveDraft = async () => {
    if (playersSelected === 0) {
      alert('Select at least one golfer before saving.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const picks = lineup
        .filter(slot => slot.golfer !== null)
        .map(slot => ({
          golfer_id: slot.golfer!.id,
          slot_position: slot.slotNumber,
          salary_at_selection: slot.golfer!.salary,
        }));

      const payload = {
        entry_name: entryName || null,
        total_salary: usedBudget,
        captain_golfer_id: captain?.golfer?.id || null,
        status: 'draft',
        picks,
      };

      const method = existingEntryId ? 'PUT' : 'POST';
      const url = existingEntryId 
        ? `/api/competitions/${params.competitionId}/my-entry`
        : `/api/competitions/${params.competitionId}/entries`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save draft');
      }

      const data = await res.json();
      if (!existingEntryId) {
        setExistingEntryId(data.entry_id);
      }

      alert('Draft saved successfully!');
    } catch (err: any) {
      console.error('Save draft error:', err);
      setError(err.message || 'Failed to save draft');
      alert(err.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  // Submit lineup - Navigate to confirmation page
  const submitLineup = async () => {
    if (playersSelected < 6) {
      alert('Please complete your lineup by selecting 6 golfers.');
      return;
    }
    if (!captain) {
      alert('Please select a captain to earn 2x points!');
      return;
    }

    if (insufficientFunds) {
      alert('Insufficient funds. Please add money to your wallet to continue.');
      return;
    }

    try {
      // Prepare lineup data
      const picks = lineup
        .filter(slot => slot.golfer !== null)
        .map(slot => ({
          golfer_id: slot.golfer!.id,
          slot_position: slot.slotNumber,
          salary_at_selection: slot.golfer!.salary,
        }));

      const lineupData = {
        entry_name: entryName || null,
        total_salary: usedBudget,
        captain_golfer_id: captain.golfer!.id,
        picks,
      };

      // Store lineup in sessionStorage for confirmation page
      sessionStorage.setItem(`lineup_${params.competitionId}`, JSON.stringify(lineupData));

      // Navigate to confirmation page
      router.push(`/build-team/${params.competitionId}/confirm`);
    } catch (err: any) {
      console.error('Navigation error:', err);
      setError(err.message || 'Failed to proceed to confirmation');
      alert(err.message || 'Failed to proceed to confirmation');
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `£${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <RequireAuth>
        <div className={styles.wrap}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading Team Builder...</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (error && !competition) {
    return (
      <RequireAuth>
        <InsufficientFundsModal
          isOpen={showInsufficientModal}
          onClose={() => router.push('/tournaments')}
          currentBalance={userBalance || 0}
          requiredAmount={requiredAmount}
        />
        <div className={styles.wrap}>
          <div className={styles.error}>
            <i className="fas fa-exclamation-triangle"></i>
            <p>{error}</p>
            <button onClick={() => router.back()} className={styles.backBtn}>
              Go Back
            </button>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className={styles.wrap}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerTop}>
            <button onClick={() => router.back()} className={styles.backButton}>
              <i className="fas fa-arrow-left"></i>
              Back
            </button>
            <div className={styles.headerContent}>
              <h1 className={styles.pageTitle}>{competition?.tournament_name}</h1>
              <p className={styles.pageSubtitle}>
                {competition?.competition_type_name} • Entry Fee: £{(competition?.entry_fee_pennies || 0) / 100}
              </p>
            </div>
          </div>

          {/* Entry Name Input */}
          <div className={styles.entryNameSection}>
            <label htmlFor="entryName">Team Name (Optional)</label>
            <input
              id="entryName"
              type="text"
              value={entryName}
              onChange={(e) => setEntryName(e.target.value)}
              placeholder="e.g., Tiger's Revenge"
              maxLength={50}
              className={styles.entryNameInput}
            />
          </div>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        <div className={styles.container}>
          {/* Left Panel - Available Golfers */}
          <section className={styles.leftPanel}>
            <div className={`${styles.filtersCard} ${styles.glass}`}>
              <div className={styles.searchRow}>
                <div className={styles.searchBox}>
                  <i className="fas fa-search"></i>
                  <input
                    type="text"
                    placeholder="Search golfers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.filterRow}>
                <div className={styles.salaryFilters}>
                  <button
                    className={`${styles.filterBtn} ${salaryFilter === 'all' ? styles.active : ''}`}
                    onClick={() => setSalaryFilter('all')}
                  >
                    All Golfers
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
                  <option value="points">Sort by Points</option>
                  <option value="name">Sort by Name</option>
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

            {/* Available Golfers List */}
            <div className={`${styles.golfersCard} ${styles.glass}`}>
              <div className={styles.cardHeader}>
                <h3>Available Golfers</h3>
                <span className={styles.golferCount}>{filteredGolfers.length} golfers</span>
              </div>

              <div className={styles.golfersList}>
                {availableGolfers.length === 0 ? (
                  <div className={styles.emptyState}>
                    <i className="fas fa-users-slash"></i>
                    <p>No golfers assigned to this competition yet</p>
                    <small style={{marginTop: '0.5rem', opacity: 0.7}}>Assign golfers in the admin panel</small>
                  </div>
                ) : filteredGolfers.length === 0 ? (
                  <div className={styles.emptyState}>
                    <i className="fas fa-filter"></i>
                    <p>No golfers match your current filters</p>
                    <small style={{marginTop: '0.5rem', opacity: 0.7}}>
                      Try adjusting your search or filters
                    </small>
                  </div>
                ) : (
                  filteredGolfers.map(golfer => (
                    <div key={golfer.id} className={styles.golferCard}>
                      <div className={styles.golferLeft}>
                        <img 
                          src={golfer.image_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'} 
                          alt={golfer.full_name} 
                          className={styles.golferAvatar} 
                        />
                        <div className={styles.golferInfo}>
                          <div className={styles.golferName}>{golfer.full_name}</div>
                          <div className={styles.golferMeta}>
                            {golfer.world_ranking && (
                              <span className={styles.ranking}>
                                <i className="fas fa-medal"></i>
                                #{golfer.world_ranking}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={styles.golferRight}>
                        <div className={styles.golferSalary}>{formatCurrency(golfer.salary)}</div>
                        <button
                          onClick={() => addGolfer(golfer)}
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

          {/* Right Panel - My Lineup */}
          <section className={styles.rightPanel}>
            <div className={`${styles.lineupCard} ${styles.glass}`}>
              <div className={styles.lineupHeader}>
                <div>
                  <h3>Your Lineup ({playersSelected}/6)</h3>
                  <p className={styles.captainHint}>
                    <i className="fas fa-crown"></i>
                    {captain ? `${captain.golfer?.full_name} is your captain!` : 'Select a captain to earn 2x points'}
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
                    className={`${styles.lineupSlot} ${slot.golfer ? styles.filled : styles.empty} ${slot.isCaptain ? styles.captain : ''}`}
                  >
                    {slot.golfer ? (
                      <>
                        {slot.isCaptain && (
                          <div className={styles.captainBadge}>
                            <i className="fas fa-crown"></i>
                            CAPTAIN - 2X POINTS
                          </div>
                        )}
                        <div className={styles.slotContent}>
                          <img 
                            src={slot.golfer.image_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'} 
                            alt={slot.golfer.full_name} 
                            className={styles.slotAvatar} 
                          />
                          <div className={styles.slotInfo}>
                            <div className={styles.slotName}>{slot.golfer.full_name}</div>
                            <div className={styles.slotMeta}>
                              {slot.golfer.world_ranking && (
                                <span>Rank #{slot.golfer.world_ranking}</span>
                              )}
                              <span>{formatCurrency(slot.golfer.salary)}</span>
                            </div>
                          </div>
                          <div className={styles.slotActions}>
                            {!slot.isCaptain && (
                              <button
                                onClick={() => setCaptain(slot.slotNumber)}
                                className={styles.captainBtn}
                                title="Set as Captain"
                              >
                                <i className="fas fa-crown"></i>
                              </button>
                            )}
                            <button
                              onClick={() => removeGolfer(slot.slotNumber)}
                              className={styles.removeBtn}
                              title="Remove"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className={styles.emptySlot}>
                        <i className="fas fa-user-plus"></i>
                        <span>Select Golfer {slot.slotNumber}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className={styles.actionsContainer}>
                {playersSelected === 6 && captain && (
                  <button onClick={submitLineup} disabled={saving} className={styles.submitBtn}>
                    <i className="fas fa-check-circle"></i>
                    {saving ? 'Processing...' : 'Purchase Scorecard'}
                  </button>
                )}
              </div>

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
