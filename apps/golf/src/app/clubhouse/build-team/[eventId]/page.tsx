'use client';

import { use, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import { createClient } from '@/lib/supabaseClient';
import styles from './build-team.module.css';

interface Golfer {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  world_ranking: number | null;
  image_url: string | null;
  salary_pennies?: number; // Salary in pennies for team builder budget system
}

interface LineupSlot {
  slotNumber: number;
  golfer: Golfer | null;
  isCaptain: boolean;
}

interface Competition {
  id: string;
  event_id: string;
  event_name: string;
  name?: string;
  entry_credits: number;
  max_entries: number;
  opens_at: string | null;
  closes_at: string | null;
}

interface ExistingEntry {
  id: string;
  status: string;
  clubhouse_entry_picks: Array<{
    golfer_id: string;
    pick_order: number;
    is_captain: boolean;
  }>;
}

export default function BuildTeamPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const editEntryId = searchParams.get('entryId');
  const isEditMode = !!editEntryId;
  const supabase = createClient();
  
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
  
  const [totalBudget] = useState(6000000); // £60,000 salary cap in pennies (DraftKings standard)
  const [searchQuery, setSearchQuery] = useState('');
  const [salaryFilter, setSalaryFilter] = useState<'all' | 'premium' | 'mid' | 'value'>('all');
  const [sortBy, setSortBy] = useState<'salary' | 'ranking' | 'points' | 'name'>('salary');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [entryName, setEntryName] = useState('');
  const [existingEntryId, setExistingEntryId] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);

  // Load competition details and golfers
  useEffect(() => {
    // Clear lineup when loading new data (important for edit mode)
    setLineup([
      { slotNumber: 1, golfer: null, isCaptain: false },
      { slotNumber: 2, golfer: null, isCaptain: false },
      { slotNumber: 3, golfer: null, isCaptain: false },
      { slotNumber: 4, golfer: null, isCaptain: false },
      { slotNumber: 5, golfer: null, isCaptain: false },
      { slotNumber: 6, golfer: null, isCaptain: false },
    ]);
    fetchCompetitionData();
  }, [eventId, editEntryId]);

  // Warn user before leaving if they have selected golfers
  useEffect(() => {
    const hasSelection = lineup.some(slot => slot.golfer !== null);
    
    if (hasSelection) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        const warningMessage = 'Navigating away will cancel your selections. Are you sure you want to leave?';
        e.returnValue = warningMessage; // Required for Chrome
        return warningMessage;
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [lineup]);

  async function fetchCompetitionData() {
    try {
      setLoading(true);
      setError('');

      // EDIT MODE: Get competition_id from entry
      let actualCompetitionId = eventId;
      if (isEditMode && editEntryId) {
        const { data: entryData, error: entryCheckError } = await supabase
          .from('clubhouse_entries')
          .select('competition_id')
          .eq('id', editEntryId)
          .single();
        
        if (entryCheckError || !entryData) {
          throw new Error('Failed to load entry details');
        }

        actualCompetitionId = entryData.competition_id;
      }

      // Fetch competition from clubhouse_competitions table
      const { data: competition, error: compError } = await supabase
        .from('clubhouse_competitions')
        .select(`
          id,
          event_id,
          name,
          description,
          entry_credits,
          max_entries,
          opens_at,
          closes_at,
          starts_at,
          assigned_golfer_group_id,
          clubhouse_events:event_id (id, name, slug)
        `)
        .eq('id', eventId)
        .single();
      
      if (compError) {
        console.error('❌ Competition fetch error:', compError);
        throw new Error(`Failed to load competition: ${compError.message || 'Unknown error'}`);
      }
      
      if (!competition) {
        throw new Error('Competition not found');
      }
      
      // Extract event data (Supabase returns single object for many-to-one relation)
      const eventData = Array.isArray(competition.clubhouse_events) 
        ? competition.clubhouse_events[0] 
        : competition.clubhouse_events;
      
      // Map to Competition interface
      const mappedCompetition: Competition = {
        id: competition.id,
        event_id: competition.event_id,
        event_name: eventData?.name || 'Unknown Event',
        entry_credits: competition.entry_credits || 0,
        max_entries: competition.max_entries || 100,
        opens_at: competition.opens_at,
        closes_at: competition.closes_at,
      };
      
      // Check if registration deadline has passed
      if (mappedCompetition.closes_at && !isEditMode) {
        const now = new Date();
        const closesAt = new Date(mappedCompetition.closes_at);
        if (now >= closesAt) {
          setError('Registration is closed - the deadline for this competition has passed.');
          setLoading(false);
          setTimeout(() => router.push('/clubhouse/events'), 3000);
          return;
        }
      }

      // Check user's credit balance (skip in edit mode - already paid)
      if (!isEditMode) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        
        const { data: walletData, error: walletError } = await supabase
          .from('clubhouse_wallets')
          .select('balance_credits')
          .eq('user_id', user.id)
          .single();
        
        if (walletError) {
          console.error('❌ Wallet error:', walletError);
          if (walletError.code === 'PGRST116') {
            // Wallet doesn't exist for this user
            setError(`No wallet found for your account. Please contact an admin to set up your wallet.`);
            setLoading(false);
            return;
          }
        }
        
        const userCredits = walletData?.balance_credits || 0;
        setUserBalance(userCredits);

        // Check if user has enough credits
        if (userCredits < mappedCompetition.entry_credits) {
          setError(`Insufficient credits. You need ${mappedCompetition.entry_credits} credits but have ${userCredits} credits. Please contact an admin to add credits to your account.`);
          setLoading(false);
          return;
        }
      }
      
      // Set competition data
      setCompetition(mappedCompetition);

      // Fetch golfers assigned to this competition via golfer group
      // We already have assigned_golfer_group_id from the competition query above
      let golfers: Golfer[] = [];
      
      if (competition.assigned_golfer_group_id) {
        // Fetch golfers from the assigned group
        const { data: groupGolfers, error: golfersError } = await supabase
          .from('golfer_group_members')
          .select(`
            golfer:golfers(
              id,
              full_name,
              first_name,
              last_name,
              world_ranking,
              image_url,
              salary_pennies
            )
          `)
          .eq('group_id', competition.assigned_golfer_group_id);
        
        if (golfersError) {
          throw new Error('Failed to load golfers: ' + golfersError.message);
        }

        golfers = (groupGolfers || [])
          .map((item: any) => {
            const g = item.golfer;
            if (!g) return null;
            // Map salary_pennies to salary for consistency with InPlay system
            return {
              ...g,
              salary_pennies: g.salary_pennies || 0
            };
          })
          .filter((g: any) => g !== null)
          .sort((a: any, b: any) => {
            if (a.world_ranking === null) return 1;
            if (b.world_ranking === null) return -1;
            return a.world_ranking - b.world_ranking;
          });
      } else {
        // No golfer group assigned - fetch all golfers (fallback)
        const { data: allGolfers, error: golfersError } = await supabase
          .from('golfers')
          .select('id, full_name, first_name, last_name, world_ranking, image_url, salary_pennies')
          .order('world_ranking', { ascending: true, nullsFirst: false });
        
        if (golfersError) {
          throw new Error('Failed to load golfers: ' + golfersError.message);
        }

        golfers = allGolfers || [];
      }

      setAvailableGolfers(golfers);

      // EDIT MODE: Load existing entry
      if (isEditMode && editEntryId) {
        const { data: existingEntry, error: entryError } = await supabase
          .from('clubhouse_entries')
          .select(`
            id,
            status,
            clubhouse_entry_picks(
              golfer_id,
              pick_order,
              is_captain
            )
          `)
          .eq('id', editEntryId)
          .single();

        if (entryError) {
          console.error('❌ Failed to load entry:', entryError);
          throw new Error('Failed to load entry: ' + entryError.message);
        }
        if (existingEntry) {
          setError(''); // Clear any previous errors
          loadExistingEntry(existingEntry, golfers || []);
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
    // Clubhouse entries don't have custom names
    
    // Create fresh lineup slots
    const newLineup: LineupSlot[] = [
      { slotNumber: 1, golfer: null, isCaptain: false },
      { slotNumber: 2, golfer: null, isCaptain: false },
      { slotNumber: 3, golfer: null, isCaptain: false },
      { slotNumber: 4, golfer: null, isCaptain: false },
      { slotNumber: 5, golfer: null, isCaptain: false },
      { slotNumber: 6, golfer: null, isCaptain: false },
    ];
    
    // Populate with saved picks using pick_order
    entry.clubhouse_entry_picks.forEach(pick => {
      const golfer = golfers.find(g => g.id === pick.golfer_id);
      if (golfer) {
        const slot = newLineup.find(s => s.slotNumber === pick.pick_order);
        if (slot) {
          slot.golfer = golfer;
          slot.isCaptain = pick.is_captain; // Use is_captain from the pick itself
        }
      } else {
        console.warn(`⚠️ Golfer not found: ${pick.golfer_id}`);
      }
    });
    
    setLineup(newLineup);
  }

  // Calculate budget stats (with null checks)
  const usedBudget = lineup.reduce((sum, slot) => sum + (slot.golfer?.salary_pennies || 0), 0);
  const remainingBudget = competition ? (totalBudget - usedBudget) : 0;
  const budgetPercentage = competition ? ((usedBudget / totalBudget) * 100) : 0;
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
      .filter(g => !selectedIds.includes(g.id) && (g.salary_pennies || 0) >= 1400000 && (g.salary_pennies || 0) <= remainingBudget)
      .sort((a, b) => (b.salary_pennies || 0) - (a.salary_pennies || 0)) // Highest salary first
      .slice(0, count);
  };

  const getMidTierPlayers = (count: number = 3) => {
    const selectedIds = lineup.filter(slot => slot.golfer).map(slot => slot.golfer!.id);
    return availableGolfers
      .filter(g => !selectedIds.includes(g.id) && (g.salary_pennies || 0) >= 900000 && (g.salary_pennies || 0) < 1400000 && (g.salary_pennies || 0) <= remainingBudget)
      .sort((a, b) => (b.salary_pennies || 0) - (a.salary_pennies || 0))
      .slice(0, count);
  };

  const getValuePickPlayers = (count: number = 3) => {
    const selectedIds = lineup.filter(slot => slot.golfer).map(slot => slot.golfer!.id);
    return availableGolfers
      .filter(g => !selectedIds.includes(g.id) && (g.salary_pennies || 0) < 900000 && (g.salary_pennies || 0) <= remainingBudget)
      .sort((a, b) => (b.salary_pennies || 0) - (a.salary_pennies || 0))
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
      if (salaryFilter === 'premium' && (golfer.salary_pennies || 0) < 1400000) return false;
      if (salaryFilter === 'mid' && ((golfer.salary_pennies || 0) < 900000 || (golfer.salary_pennies || 0) >= 1400000)) return false;
      if (salaryFilter === 'value' && (golfer.salary_pennies || 0) >= 900000) return false;

      // Affordability filter - Don't filter if no players selected yet
      if (playersSelected > 0 && (golfer.salary_pennies || 0) > remainingBudget) return false;

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'salary':
          return (b.salary_pennies || 0) - (a.salary_pennies || 0);
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

    if ((golfer.salary_pennies || 0) > remainingBudget) {
      alert(`Not enough budget! This golfer costs £${(golfer.salary_pennies || 0).toLocaleString()}`);
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

  // Clear all golfers from lineup
  const clearAllGolfers = () => {
    if (confirm('Clear all players from your lineup?')) {
      setLineup([
        { slotNumber: 1, golfer: null, isCaptain: false },
        { slotNumber: 2, golfer: null, isCaptain: false },
        { slotNumber: 3, golfer: null, isCaptain: false },
        { slotNumber: 4, golfer: null, isCaptain: false },
        { slotNumber: 5, golfer: null, isCaptain: false },
        { slotNumber: 6, golfer: null, isCaptain: false },
      ]);
    }
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
          salary_at_selection: slot.golfer!.salary_pennies || 0,
        }));

      const payload = {
        entry_name: entryName || null,
        total_salary: usedBudget,
        captain_golfer_id: captain?.golfer?.id || null,
        status: 'draft',
        picks,
      };

      // Note: For now, clubhouse doesn't support draft saving - entries are only created on final submission
      // This functionality can be added later if needed
      alert('Draft saving not yet implemented for clubhouse. Please complete your team and submit.');
      
    } catch (err: any) {
      console.error('Save draft error:', err);
      setError(err.message || 'Failed to save draft');
      alert(err.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  // Submit lineup - Navigate to confirmation page OR directly update if editing
  const submitLineup = async () => {
    if (playersSelected < 6) {
      alert('Please complete your lineup by selecting 6 golfers.');
      return;
    }
    if (!captain) {
      alert('Please select a captain to earn 2x points!');
      return;
    }

    if (!isEditMode && userBalance !== null && competition && userBalance < competition.entry_credits) {
      alert('Insufficient credits. Please contact an admin to add credits to your account.');
      return;
    }

    if (!competition) {
      alert('Competition data not loaded');
      return;
    }

    try {
      setSaving(true);
      setError('');

      // Prepare golfer IDs for submission
      const golferIds = lineup
        .filter(slot => slot.golfer !== null)
        .map(slot => slot.golfer!.id);

      // Get captain
      const captain = lineup.find(slot => slot.isCaptain);
      if (!captain || !captain.golfer) {
        throw new Error('No captain selected');
      }

      // EDIT MODE: Update existing entry
      if (isEditMode && editEntryId) {
        // Delete old picks and verify deletion
        const { error: deleteError, count: deleteCount } = await supabase
          .from('clubhouse_entry_picks')
          .delete({ count: 'exact' })
          .eq('entry_id', editEntryId);

        if (deleteError) {
          throw new Error('Failed to delete old picks: ' + deleteError.message);
        }

        // Wait a moment to ensure database consistency
        await new Promise(resolve => setTimeout(resolve, 100));

        // Insert new picks
        const newPicks = lineup
          .filter(slot => slot.golfer !== null)
          .map(slot => ({
            entry_id: editEntryId,
            golfer_id: slot.golfer!.id,
            pick_order: slot.slotNumber,
            is_captain: slot.isCaptain
          }));

        const { error: insertError } = await supabase
          .from('clubhouse_entry_picks')
          .insert(newPicks);

        if (insertError) {
          console.error('Insert error details:', insertError);
          throw new Error('Failed to insert new picks: ' + insertError.message);
        }

        // Clear lineup to prevent beforeunload warning
        setLineup([
          { slotNumber: 1, golfer: null, isCaptain: false },
          { slotNumber: 2, golfer: null, isCaptain: false },
          { slotNumber: 3, golfer: null, isCaptain: false },
          { slotNumber: 4, golfer: null, isCaptain: false },
          { slotNumber: 5, golfer: null, isCaptain: false },
          { slotNumber: 6, golfer: null, isCaptain: false },
        ]);

        // Success - redirect with updated flag
        router.push(`/clubhouse/my-entries?updated=${editEntryId}`);
        return;
      }

      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // CREATE MODE: Use create_clubhouse_entry RPC function
      console.log('🚀 Calling create_clubhouse_entry with:', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_competition_id: competition.id,
        p_golfer_ids: golferIds,
        p_captain_id: captain.golfer!.id,
        p_credits: competition.entry_credits
      });
      
      const { data, error } = await supabase.rpc('create_clubhouse_entry', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_competition_id: competition.id,
        p_golfer_ids: golferIds,
        p_captain_id: captain.golfer!.id,
        p_credits: competition.entry_credits
      });

      if (error) {
        throw new Error(error.message || 'Failed to create entry');
      }

      // Clear lineup to prevent beforeunload warning
      setLineup([
        { slotNumber: 1, golfer: null, isCaptain: false },
        { slotNumber: 2, golfer: null, isCaptain: false },
        { slotNumber: 3, golfer: null, isCaptain: false },
        { slotNumber: 4, golfer: null, isCaptain: false },
        { slotNumber: 5, golfer: null, isCaptain: false },
        { slotNumber: 6, golfer: null, isCaptain: false },
      ]);

      // Redirect to confirmation page with competition details
      const confirmationUrl = `/clubhouse/entry-confirmed?name=${encodeURIComponent(competition.event_name || 'Competition')}&credits=${competition.entry_credits}`;
      router.push(confirmationUrl);
    } catch (err: any) {
      console.error('Submit error:', err);
      setError(err.message || 'Failed to submit entry');
      alert(err.message || 'Failed to submit entry');
    } finally {
      setSaving(false);
    }
  };

  // Format currency (amount in pennies, display in pounds - no decimals)
  const formatCurrency = (amount: number) => {
    const pounds = Math.floor(amount / 100);
    return `£${pounds.toLocaleString('en-GB')}`;
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
        <div className={styles.wrap}>
          <div className={styles.error}>
            <i className="fas fa-exclamation-triangle"></i>
            <p>{error}</p>
            <button onClick={() => router.push('/clubhouse/events')} className={styles.backBtn}>
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
        {/* Back Button */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '12px',
          gap: '20px'
        }}>
          <button 
            onClick={() => router.push('/clubhouse/events')}
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
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            }}
          >
            <span>←</span>
            <span>Back To Events</span>
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
              {/* Header */}
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

              {/* Remaining Budget */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 700,
                  color: isOverBudget ? '#ef4444' : '#10b981',
                  marginBottom: '8px'
                }}>
                  {formatCurrency(remainingBudget)}
                </div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: isOverBudget ? '#ef4444' : '#10b981',
                  marginBottom: '12px'
                }}>
                  {playersSelected === 6 ? 'Team Complete' :
                   isOverBudget ? 'Over Budget!' : 
                   'Budget Available'}
                </div>

                {/* Progress Bar */}
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
                      background: playersSelected === 6 ? '#10b981' : '#3b82f6',
                      transition: 'width 0.3s ease'
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
                      color: 'rgba(255,255,255,0.7)'
                    }}>
                      {playersSelected}/6
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: 'rgba(255,255,255,0.5)'
                    }}>
                      Players
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Overview */}
              <div style={{
                padding: '16px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: '#fbbf24',
                  marginBottom: '12px'
                }}>
                  TEAM OVERVIEW
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Players</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: playersSelected === 6 ? '#10b981' : '#3b82f6' }}>
                      {playersSelected}/6
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Captain</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: captain ? '#fbbf24' : 'rgba(255,255,255,0.4)' }}>
                      {captain ? '⭐ Set' : 'Not Set'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Entry Fee</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#667eea' }}>
                      {competition?.entry_credits}c
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Available Golfers */}
          <div style={{ marginTop: '-30px' }}>
            {/* Event Info Header */}
            <div style={{
              marginBottom: '12px',
              padding: '12px 18px',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(251, 191, 36, 0.04) 100%)',
              border: '1px solid rgba(251, 191, 36, 0.25)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#fbbf24' }}>
                {competition?.event_name}
                {competition?.name && (
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(251, 191, 36, 0.7)', marginLeft: '8px' }}>
                    • {competition.name}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#10b981' }}>
                Entry: {competition?.entry_credits}c
              </div>
            </div>

            {/* Golfers Card */}
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
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#10b981'
                  }}>
                    👥 {filteredGolfers.length}
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#10b981', margin: 0 }}>
                    Available Golfers
                  </h2>
                </div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                  Click to add to your team
                </p>
              </div>

              {/* Golfers List */}
              <div style={{
                display: 'grid',
                gap: '8px',
                maxHeight: '600px',
                overflowY: 'auto'
              }}>
                {filteredGolfers.map(golfer => {
                  const isSelected = lineup.some(slot => slot.golfer?.id === golfer.id);
                  const canAfford = (golfer.salary_pennies || 0) <= remainingBudget;
                  const isFull = playersSelected >= 6;
                  
                  return (
                    <div
                      key={golfer.id}
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
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected && canAfford && !isFull) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                          e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <img 
                          src={golfer.image_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop'}
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
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>
                            {golfer.full_name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                            Rank: {golfer.world_ranking || 'N/A'}
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fbbf24' }}>
                          {formatCurrency(golfer.salary_pennies || 0)}
                        </div>
                        {isSelected && (
                          <div style={{
                            padding: '4px 8px',
                            background: 'rgba(16, 185, 129, 0.2)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#10b981'
                          }}>
                            ✓ Selected
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 3: Lineup */}
          <div style={{ marginTop: '-30px' }}>
            <div style={{ height: '37px', marginBottom: '12px' }}></div>
            
            <div style={{
              position: 'sticky',
              top: '90px',
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.18)',
              borderRadius: '16px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{
                marginBottom: '16px',
                paddingBottom: '16px',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#fbbf24' }}>
                    🏌️ Your Lineup
                  </div>
                  {playersSelected > 0 && (
                    <button
                      onClick={clearAllGolfers}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        color: '#ef4444',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                      }}
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                  {playersSelected}/6 players selected
                </div>
              </div>

              {/* Lineup Slots */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {lineup.map(slot => (
                  <div key={slot.slotNumber} style={{
                    padding: slot.golfer ? '12px' : '16px',
                    background: slot.golfer ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${slot.isCaptain ? '#fbbf24' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                  }}>
                    {slot.golfer ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                              {slot.golfer.full_name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                              {slot.golfer.world_ranking && `Rank #${slot.golfer.world_ranking}`}
                            </div>
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#fbbf24' }}>
                            {formatCurrency(slot.golfer.salary_pennies || 0)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {!slot.isCaptain && (
                            <button
                              onClick={() => setCaptain(slot.slotNumber)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '10px',
                                borderRadius: '4px',
                                background: 'rgba(251, 191, 36, 0.2)',
                                border: '1px solid rgba(251, 191, 36, 0.3)',
                                color: '#fbbf24',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Set Captain
                            </button>
                          )}
                          {slot.isCaptain && (
                            <span style={{
                              padding: '4px 8px',
                              fontSize: '10px',
                              borderRadius: '4px',
                              background: 'rgba(251, 191, 36, 0.3)',
                              border: '1px solid rgba(251, 191, 36, 0.5)',
                              color: '#fbbf24',
                              fontWeight: 600
                            }}>
                              ⭐ Captain
                            </span>
                          )}
                          <button
                            onClick={() => removeGolfer(slot.slotNumber)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '10px',
                              borderRadius: '4px',
                              background: '#ef4444',
                              border: 'none',
                              color: 'white',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                        Empty Slot {slot.slotNumber}/6
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Captain Warning */}
              {playersSelected === 6 && !captain && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid rgba(251, 191, 36, 0.3)',
                  background: 'rgba(251, 191, 36, 0.15)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#fbbf24'
                }}>
                  ⚠️ Select a Captain
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={submitLineup}
                disabled={!canSubmit() || saving}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  background: canSubmit() ? '#10b981' : '#6b7280',
                  border: 'none',
                  color: 'white',
                  cursor: canSubmit() && !saving ? 'pointer' : 'not-allowed',
                  opacity: canSubmit() && !saving ? 1 : 0.6,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (canSubmit() && !saving) {
                    e.currentTarget.style.background = '#059669';
                  }
                }}
                onMouseLeave={(e) => {
                  if (canSubmit() && !saving) {
                    e.currentTarget.style.background = '#10b981';
                  }
                }}
              >
                {saving ? 'Processing...' : 'Submit Entry'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
