'use client';

import { use, useState, useEffect } from 'react';
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

export default function BuildTeamPage({ params }: { params: Promise<{ competitionId: string }> }) {
  const { competitionId } = use(params);
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
  
  const [totalBudget] = useState(60000); // £60,000 salary cap (updated from £50,000)
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
  }, [competitionId]);

  async function fetchCompetitionData() {
    try {
      setLoading(true);
      setError('');

      // Fetch competition details FIRST to check tournament status
      const compRes = await fetch(`/api/competitions/${competitionId}`);
      if (!compRes.ok) throw new Error('Failed to load competition');
      const compData = await compRes.json();
      
      // ========================================
      // ARCHITECTURAL RULE: COMPETITION REGISTRATION IS INDEPENDENT OF TOURNAMENT STATUS
      // 
      // ONLY check competition.reg_close_at for registration validation
      // NEVER check tournament.start_date or tournament.end_date
      // 
      // Rationale:
      //   - Different competition types have different registration windows
      //   - ONE 2 ONE: Open throughout entire tournament (closes at tournament end)
      //   - THE WEEKENDER: Open until R3 starts (closes before R3)
      //   - Final Strike: Open until R4 starts (closes before R4)
      //   - Full Course/First Strike/Beat Cut: Close before R1
      // 
      // Users MUST be able to build teams if competition.reg_close_at hasn't passed,
      // regardless of whether the tournament has started or is in progress
      // ========================================
      
      // CRITICAL: Check if THIS COMPETITION's registration deadline has passed
      // Each competition has its own reg_close_at time (e.g., One-2-One stays open during tournament)
      if (compData.reg_close_at) {
        const now = new Date();
        const regClose = new Date(compData.reg_close_at);
        if (now >= regClose) {
          setError('Registration is closed - the deadline for this competition has passed.');
          setLoading(false);
          setTimeout(() => {
            router.push('/tournaments');
          }, 3000);
          return;
        }
      }

      // Check user's wallet balance
      const balanceRes = await fetch('/api/user/balance');
      let userBalanceAmount = 0;
      
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        userBalanceAmount = balanceData.balance_pennies || 0;
        setUserBalance(userBalanceAmount);
      }

      // Check if user has enough balance
      if (userBalanceAmount < compData.entry_fee_pennies) {
        setInsufficientFunds(true);
        setRequiredAmount(compData.entry_fee_pennies);
        setShowInsufficientModal(true);
        setError(`Insufficient funds. You need £${(compData.entry_fee_pennies / 100).toFixed(2)} but have £${(userBalanceAmount / 100).toFixed(2)} in your wallet.`);
        setLoading(false);
        return;
      }
      
      // Set competition data
      setCompetition(compData);

      // Fetch available golfers for this competition
      const golfersRes = await fetch(`/api/competitions/${competitionId}/golfers`);
      if (!golfersRes.ok) throw new Error('Failed to load golfers');
      const golfersData = await golfersRes.json();
      console.log('Fetched golfers:', golfersData.length, golfersData);
      setAvailableGolfers(golfersData);

      // Check if user has an existing entry
      const entryRes = await fetch(`/api/competitions/${competitionId}/my-entry`);
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
  const spotsLeft = 6 - playersSelected;
  const avgPerSpot = spotsLeft > 0 ? remainingBudget / spotsLeft : 0;
  const isOverBudget = remainingBudget < 0;

  // Budget status logic with color coding
  const getBudgetStatus = () => {
    // Team complete - always show positive status
    if (playersSelected === 6) {
      return { label: 'Your Score Card Is Full', color: '#10b981', status: 'complete' };
    }
    // Budget checks for incomplete teams
    if (remainingBudget < 0) {
      return { label: 'Over Budget', color: '#ef4444', status: 'critical' };
    } else if (remainingBudget < totalBudget * 0.1) {
      return { label: 'Critical', color: '#ef4444', status: 'critical' };
    } else if (remainingBudget < totalBudget * 0.2) {
      return { label: 'Tight Budget', color: '#fbbf24', status: 'warning' };
    } else {
      return { label: 'Good', color: '#10b981', status: 'safe' };
    }
  };

  const budgetStatus = getBudgetStatus();

  // Check if player uses >25% of budget (flag expensive players)
  const isExpensivePlayer = (salary: number) => {
    return (salary / totalBudget) > 0.25;
  };

  // Submission validation
  const canSubmit = () => {
    return (
      playersSelected === 6 &&
      captain !== undefined &&
      remainingBudget >= 0 &&
      !saving
    );
  };

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

  // Get available players by salary tier (that fit in remaining budget)
  const getTopTierPlayers = (count: number = 3) => {
    const selectedIds = lineup.filter(slot => slot.golfer).map(slot => slot.golfer!.id);
    return availableGolfers
      .filter(g => !selectedIds.includes(g.id) && g.salary >= 10000 && g.salary <= remainingBudget)
      .sort((a, b) => b.salary - a.salary) // Highest salary first
      .slice(0, count);
  };

  const getMidTierPlayers = (count: number = 3) => {
    const selectedIds = lineup.filter(slot => slot.golfer).map(slot => slot.golfer!.id);
    return availableGolfers
      .filter(g => !selectedIds.includes(g.id) && g.salary >= 7000 && g.salary < 10000 && g.salary <= remainingBudget)
      .sort((a, b) => b.salary - a.salary)
      .slice(0, count);
  };

  const getValuePickPlayers = (count: number = 3) => {
    const selectedIds = lineup.filter(slot => slot.golfer).map(slot => slot.golfer!.id);
    return availableGolfers
      .filter(g => !selectedIds.includes(g.id) && g.salary < 7000 && g.salary <= remainingBudget)
      .sort((a, b) => b.salary - a.salary)
      .slice(0, count);
  };

  // Get player lists for budget optimizer
  const topTierPlayers = playersSelected < 6 ? getTopTierPlayers(3) : [];
  const midTierPlayers = playersSelected < 6 ? getMidTierPlayers(3) : [];
  const valuePickPlayers = playersSelected < 6 ? getValuePickPlayers(3) : [];

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
        ? `/api/competitions/${competitionId}/my-entry`
        : `/api/competitions/${competitionId}/entries`;

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
      sessionStorage.setItem(`lineup_${competitionId}`, JSON.stringify(lineupData));

      // Navigate to confirmation page
      router.push(`/build-team/${competitionId}/confirm`);
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
      <div style={{ 
        maxWidth: '1800px', 
        margin: '0 auto', 
        padding: '0 40px 40px 40px',
        paddingTop: 'max(20px, calc(70px - 150px))',
        minHeight: '100vh'
      }}>
        {error && (
          <div style={{
            position: 'fixed',
            top: '90px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            padding: '16px 24px',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '15px',
            fontWeight: 500,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)'
          }}>
            <i className="fas fa-exclamation-circle" style={{ fontSize: '18px' }}></i>
            <span>{error}</span>
          </div>
        )}

        {/* Page Header - Above All Containers */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '12px',
          gap: '20px'
        }}>
          <button 
            onClick={() => router.back()}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.9)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            }}
          >
            ← Back To Tournaments
          </button>
        </div>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '300px 2fr 1fr',
          gap: '30px',
          alignItems: 'start'
        }}>
          {/* Column 1: Budget Tools Sidebar */}
          <div style={{ marginTop: '-30px' }}>
            {/* Empty spacer for alignment */}
            <div style={{ height: '37px', marginBottom: '12px' }}></div>
            
            <div style={{
              position: 'sticky',
              top: '90px',
              padding: '20px',
            height: 'fit-content',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.18)',
            borderRadius: '16px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
          }}>
            {/* Header Section */}
            <div style={{
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#fbbf24', marginBottom: '4px' }}>
                💰 Budget Tools
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                Track spending & optimize your team
              </div>
            </div>

            {/* Remaining Budget Display */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 700,
                color: budgetStatus.color,
                marginBottom: '8px'
              }}>
                £{remainingBudget.toLocaleString()} left
              </div>
              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: budgetStatus.color,
                marginBottom: '12px'
              }}>
                {playersSelected === 6 ? 'Your Score Card Is Full' :
                 budgetStatus.label === 'Over Budget' ? 'Over Budget!' : 
                 budgetPercentage >= 80 ? 'Budget Getting Full' :
                 budgetPercentage >= 50 ? 'Budget Half Used' :
                 'Budget Available'}
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '8px'
              }}>
                Used: £{usedBudget.toLocaleString()}
              </div>

              {/* Progress Bar with Player Count */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '6px'
              }}>
                <div style={{
                  flex: 1,
                  height: '8px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(budgetPercentage, 100)}%`,
                    height: '100%',
                    background: playersSelected === 6 ? '#10b981' : 
                                playersSelected >= 3 ? budgetStatus.color : '#3b82f6',
                    transition: 'width 0.3s ease, background 0.3s ease'
                  }}></div>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  minWidth: '40px'
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.7)',
                    lineHeight: '1'
                  }}>
                    {playersSelected}/6
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.5)',
                    lineHeight: '1.2'
                  }}>
                    Players
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.8)'
              }}>
                {budgetPercentage.toFixed(0)}%
              </div>
            </div>

            {/* No Players Available Warning */}
            {playersSelected < 6 && topTierPlayers.length === 0 && midTierPlayers.length === 0 && valuePickPlayers.length === 0 && (
              <div style={{
                marginBottom: '20px',
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px'
              }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#ef4444',
                  marginBottom: '8px'
                }}>
                  Budget Almost Full ({budgetPercentage.toFixed(0)}%)
                </div>
                <div style={{
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '8px'
                }}>
                  £{remainingBudget.toLocaleString()} remaining for {spotsLeft} player{spotsLeft !== 1 ? 's' : ''}
                </div>
                <div style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#fbbf24'
                }}>
                  ⚠️ No more players available for this amount - rearrange your selections
                </div>
              </div>
            )}

            {/* Salary Tier Players - Available to Select */}
            {(topTierPlayers.length > 0 || midTierPlayers.length > 0 || valuePickPlayers.length > 0) && playersSelected > 0 && playersSelected < 6 && (
              <div style={{
                marginBottom: '20px',
                padding: '14px',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '8px'
              }}>
                {/* Header */}
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#3b82f6',
                  marginBottom: '12px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                  💎 Available Players by Salary Tier
                </div>

                {/* Budget Status Message */}
                <div style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: budgetStatus.color,
                  marginBottom: '8px'
                }}>
                  💰 Budget {budgetPercentage >= 90 ? 'Almost Full' : budgetPercentage >= 70 ? 'Well Used' : 'Available'} ({budgetPercentage.toFixed(0)}%)
                </div>
                <div style={{
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: '14px'
                }}>
                  £{remainingBudget.toLocaleString()} remaining for {spotsLeft} player{spotsLeft !== 1 ? 's' : ''}
                </div>

                {/* Top Tier Players (£10k-£12k) */}
                {topTierPlayers.length > 0 && (
                  <div style={{ marginBottom: (midTierPlayers.length > 0 || valuePickPlayers.length > 0) ? '14px' : '0' }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#a855f7',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>🌟</span>
                      <span>Top 5 Players (£10k-£12k):</span>
                    </div>
                    {topTierPlayers.map((golfer) => (
                      <div
                        key={golfer.id}
                        style={{
                          fontSize: '10px',
                          color: 'rgba(255,255,255,0.8)',
                          marginBottom: '4px',
                          paddingLeft: '18px',
                          cursor: 'pointer',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#a855f7';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                        }}
                        onClick={() => addGolfer(golfer)}
                      >
                        {golfer.full_name} (£{golfer.salary.toLocaleString()})
                      </div>
                    ))}
                  </div>
                )}

                {/* Mid Tier Players (£7k-£9.9k) */}
                {midTierPlayers.length > 0 && (
                  <div style={{ marginBottom: valuePickPlayers.length > 0 ? '14px' : '0' }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#3b82f6',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>⭐</span>
                      <span>Mid Tier Players (£7k-£10k):</span>
                    </div>
                    {midTierPlayers.map((golfer) => (
                      <div
                        key={golfer.id}
                        style={{
                          fontSize: '10px',
                          color: 'rgba(255,255,255,0.8)',
                          marginBottom: '4px',
                          paddingLeft: '18px',
                          cursor: 'pointer',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#3b82f6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                        }}
                        onClick={() => addGolfer(golfer)}
                      >
                        {golfer.full_name} (£{golfer.salary.toLocaleString()})
                      </div>
                    ))}
                  </div>
                )}

                {/* Value Pick Players (Under £7k) */}
                {valuePickPlayers.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#10b981',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>💰</span>
                      <span>Value Picks (Under £7k):</span>
                    </div>
                    {valuePickPlayers.map((golfer) => (
                      <div
                        key={golfer.id}
                        style={{
                          fontSize: '10px',
                          color: 'rgba(255,255,255,0.8)',
                          marginBottom: '4px',
                          paddingLeft: '18px',
                          cursor: 'pointer',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#10b981';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                        }}
                        onClick={() => addGolfer(golfer)}
                      >
                        {golfer.full_name} (£{golfer.salary.toLocaleString()})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Team Overview Stats Box */}
            <div style={{
              marginTop: '20px',
              padding: '16px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ 
                fontSize: '13px', 
                fontWeight: 600, 
                color: '#fbbf24',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Team Overview
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Players Selected</span>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: playersSelected === 6 ? '#10b981' : '#3b82f6'
                  }}>
                    {playersSelected}/6
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Budget Used</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#fbbf24' }}>
                    £{usedBudget.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Avg. Cost per Player</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#6366f1' }}>
                    £{playersSelected > 0 ? Math.round(averageSalary).toLocaleString() : '0'}
                  </span>
                </div>
                {spotsLeft > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Avg. per Remaining Spot</span>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      color: avgPerSpot < 5000 ? '#ef4444' : avgPerSpot < 7000 ? '#fbbf24' : '#10b981'
                    }}>
                      £{Math.floor(avgPerSpot).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>

          {/* Column 2: Available Golfers */}
          <div style={{ marginTop: '-30px' }}>
            {/* Entry Details - Inline with Available Golfers Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '18px',
              marginBottom: '12px'
            }}>
              {competition && (
                <div style={{
                  flex: 1,
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(251, 191, 36, 0.04) 100%)',
                  border: '1px solid rgba(251, 191, 36, 0.25)',
                  borderRadius: '8px',
                  backdropFilter: 'blur(12px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <div style={{ 
                      fontSize: '15px', 
                      fontWeight: 600, 
                      color: '#fbbf24'
                    }}>
                      {competition.tournament_name}
                    </div>
                    <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)' }}></div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                      {competition.competition_type_name}
                    </div>
                    <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)' }}></div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#10b981' }}>
                      {competition.entry_fee_pennies === 0 ? 'FREE ENTRY' : `£${(competition.entry_fee_pennies / 100).toFixed(2)}`}
                    </div>
                    <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)' }}></div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                      Max: <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{competition.entrants_cap.toLocaleString()}</span> Entries
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 10px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#10b981',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap'
                  }}>
                    Registration Open
                  </div>
                </div>
              )}
            </div>

            {/* Glass Container */}
            <div style={{
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.18)',
              borderRadius: '16px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <div style={{
                    padding: '4px 12px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>👥</span>
                    <span>{availableGolfers.length}</span>
                  </div>
                  <h2 style={{ 
                    fontSize: '20px', 
                    fontWeight: 600, 
                    color: '#10b981', 
                    margin: 0
                  }}>
                    Available Golfers
                  </h2>
                </div>
                <p style={{ 
                  fontSize: '14px', 
                  color: 'rgba(255,255,255,0.6)', 
                  margin: 0 
                }}>
                  (Click to add to your scorecard)
                </p>
              </div>

              {/* Golfers List */}
              <div style={{
                display: 'grid',
                gap: '8px',
                maxHeight: '600px',
                overflowY: 'auto',
                paddingRight: '8px'
              }}>
                {availableGolfers.length === 0 ? (
                  <div style={{
                    padding: '60px 20px',
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.4)'
                  }}>
                    <i className="fas fa-users-slash" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
                    <p style={{ fontSize: '14px', margin: '0 0 8px 0' }}>No golfers assigned to this competition yet</p>
                    <small style={{ fontSize: '12px', opacity: 0.7 }}>Assign golfers in the admin panel</small>
                  </div>
                ) : (
                  availableGolfers.map(golfer => {
                    const isSelected = lineup.some(slot => slot.golfer?.id === golfer.id);
                    const canAfford = golfer.salary <= remainingBudget;
                    const isExpensive = isExpensivePlayer(golfer.salary);
                    const isFull = playersSelected >= 6;
                    
                    return (
                      <div
                        key={golfer.id}
                        id={`golfer-${golfer.id}`}
                        onClick={() => !isSelected && canAfford && !isFull && addGolfer(golfer)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          background: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSelected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                          borderRadius: '8px',
                          cursor: isSelected || !canAfford || isFull ? 'not-allowed' : 'pointer',
                          opacity: isSelected || !canAfford || isFull ? 0.5 : 1,
                          transition: 'all 0.2s ease',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected && canAfford && !isFull) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                          <img 
                            src={golfer.image_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'} 
                            alt={golfer.full_name}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid rgba(255,255,255,0.1)'
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#f9fafb', marginBottom: '2px' }}>
                              {golfer.full_name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                              {golfer.world_ranking && (
                                <>
                                  Rank #{golfer.world_ranking}
                                  {' • '}
                                </>
                              )}
                              Recent Form
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: 600, 
                            color: '#fbbf24',
                            marginRight: '4px'
                          }}>
                            £{golfer.salary.toLocaleString()}
                          </div>
                          {isExpensive && !isSelected && (
                            <div style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              borderRadius: '4px',
                              color: '#ef4444',
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}>
                              PREMIUM
                            </div>
                          )}
                          {!canAfford && !isSelected && (
                            <div style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              borderRadius: '4px',
                              color: '#ef4444',
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}>
                              TOO EXPENSIVE
                            </div>
                          )}
                          {isSelected && (
                            <div style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              background: 'rgba(16, 185, 129, 0.2)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              borderRadius: '4px',
                              color: '#10b981',
                              fontWeight: 600
                            }}>
                              SELECTED
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Your Scorecard */}
          <div style={{ marginTop: '-30px' }}>
            {/* Section Header */}
            <div style={{ marginBottom: '12px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#f9fafb', margin: 0 }}>
                Your Scorecard
              </h1>
            </div>

            {/* Glass Container */}
            <div style={{
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.18)',
              borderRadius: '16px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
            }}>
              {/* Header Row */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <h2 style={{ 
                    fontSize: '20px', 
                    fontWeight: 600, 
                    color: '#fbbf24', 
                    margin: 0 
                  }}>
                    Your Scorecard ({playersSelected}/6)
                  </h2>
                  {playersSelected > 0 && (
                    <button
                      onClick={clearLineup}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        background: '#ef4444',
                        border: 'none',
                        color: 'white',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#dc2626';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ef4444';
                      }}
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <p style={{ 
                  fontSize: '17px', 
                  fontWeight: 500, 
                  color: captain ? '#10b981' : 'rgba(255,255,255,0.7)',
                  margin: 0 
                }}>
                  {captain ? `⭐ ${captain.golfer?.full_name} is your captain!` : 'Select a captain to earn 2x points!'}
                </p>
              </div>

              {/* Team Slots */}
              <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
                {lineup.map(slot => (
                  <div
                    key={slot.slotNumber}
                    style={{
                      minHeight: '52px',
                      padding: slot.golfer ? '10px' : '14px',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: slot.isCaptain 
                        ? 'rgba(251, 191, 36, 0.15)' 
                        : slot.golfer 
                        ? 'rgba(255,255,255,0.03)' 
                        : 'rgba(255,255,255,0.02)',
                      border: slot.isCaptain
                        ? '2px solid rgba(251, 191, 36, 0.4)'
                        : slot.golfer
                        ? '1px solid rgba(255,255,255,0.06)'
                        : '2px dashed rgba(255,255,255,0.2)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {slot.golfer ? (
                      <>
                        <div style={{ flex: 1 }}>
                          {slot.isCaptain && (
                            <div style={{
                              display: 'inline-block',
                              background: '#fbbf24',
                              color: 'black',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '10px',
                              fontWeight: 700,
                              marginBottom: '6px',
                              letterSpacing: '0.5px'
                            }}>
                              CAPTAIN
                            </div>
                          )}
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: 600, 
                            color: '#f9fafb',
                            marginBottom: '4px'
                          }}>
                            {slot.golfer.full_name}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: 'rgba(255,255,255,0.6)' 
                          }}>
                            {slot.golfer.world_ranking && `Rank #${slot.golfer.world_ranking}`}
                          </div>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          marginLeft: '12px'
                        }}>
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: 600, 
                            color: '#fbbf24',
                            marginRight: '6px'
                          }}>
                            £{slot.golfer.salary.toLocaleString()}
                          </div>
                          {!slot.isCaptain && (
                            <button
                              onClick={() => setCaptain(slot.slotNumber)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                borderRadius: '4px',
                                background: 'rgba(251, 191, 36, 0.2)',
                                border: '1px solid rgba(251, 191, 36, 0.3)',
                                color: '#fbbf24',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(251, 191, 36, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(251, 191, 36, 0.2)';
                              }}
                            >
                              Set Captain
                            </button>
                          )}
                          {slot.isCaptain && (
                            <span style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              borderRadius: '4px',
                              background: 'rgba(251, 191, 36, 0.3)',
                              border: '1px solid rgba(251, 191, 36, 0.5)',
                              color: '#fbbf24',
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}>
                              ⭐ Captain
                            </span>
                          )}
                          <button
                            onClick={() => removeGolfer(slot.slotNumber)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              borderRadius: '4px',
                              background: '#ef4444',
                              border: 'none',
                              color: 'white',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#dc2626';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#ef4444';
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <div style={{ 
                        textAlign: 'center', 
                        width: '100%',
                        color: 'rgba(255,255,255,0.4)', 
                        fontSize: '14px',
                        fontWeight: 500
                      }}>
                        Empty Slot {slot.slotNumber}/6
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Captain Warning Box */}
              {playersSelected === 6 && !captain && (
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '2px solid rgba(251, 191, 36, 0.3)',
                  background: 'rgba(251, 191, 36, 0.15)'
                }}>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    color: '#fbbf24',
                    marginBottom: '8px'
                  }}>
                    ⚠️ Select a Captain to Continue
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: 'rgba(255,255,255,0.8)' 
                  }}>
                    Your captain will earn double points for their performance. Choose wisely!
                  </div>
                </div>
              )}

              {/* Submit Button - Only show when team is complete with captain OR when over budget */}
              {((playersSelected === 6 && captain) || isOverBudget) && (
                <button
                  onClick={submitLineup}
                  disabled={!canSubmit()}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    marginTop: '20px',
                    background: canSubmit() && remainingBudget >= 0
                      ? '#10b981' 
                      : isOverBudget
                      ? '#ef4444'
                      : '#6b7280',
                    border: 'none',
                    color: 'white',
                    cursor: canSubmit() ? 'pointer' : 'not-allowed',
                    opacity: canSubmit() ? 1 : 0.6,
                    boxShadow: canSubmit() && remainingBudget >= 0
                      ? '0 4px 12px rgba(16, 185, 129, 0.3)' 
                      : 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (canSubmit()) {
                      e.currentTarget.style.background = remainingBudget >= 0 ? '#059669' : '#dc2626';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = remainingBudget >= 0 ? '0 6px 16px rgba(16, 185, 129, 0.4)' : '0 6px 16px rgba(239, 68, 68, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canSubmit()) {
                      e.currentTarget.style.background = remainingBudget >= 0 ? '#10b981' : '#ef4444';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = remainingBudget >= 0 ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none';
                    }
                  }}
                >
                  {saving ? 'Processing...' : 
                   isOverBudget ? 'Over Budget - Remove Players' :
                   'Purchase Scorecard'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
