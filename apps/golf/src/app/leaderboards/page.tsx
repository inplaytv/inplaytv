'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import styles from './leaderboards.module.css';
import {
  calculateHolePoints,
  calculateGolferScore,
  calculatePlacementBonus,
  getScoreName,
  getScoreClass,
  formatPoints,
  type GolferPerformance,
  type RoundScore,
  type ScoringBreakdown
} from '@/lib/fantasy-scoring';

export const dynamic = 'force-dynamic';

interface Tournament {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  prizePool: number;
  status: 'upcoming' | 'in-play' | 'completed';
}

interface FantasyEntry {
  userId: string;
  username: string;
  totalPoints: number;
  round?: number;
  position?: number;
  score?: number;
  birdies?: number;
}

interface Scorecard {
  id: string;
  tournamentId: string;
  tournamentName: string;
  submittedAt: string;
  totalSalary: number;
  players: Array<{
    id: string;
    name: string;
    golferName?: string;
    salary: number;
    points: number;
    rank?: string;
  }>;
  captain?: {
    id: string;
    name: string;
  };
}

export default function LeaderboardsPage() {
  const router = useRouter();
  const [viewToggle, setViewToggle] = useState<'inplay' | 'tournament' | 'livestats'>('inplay');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('');
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [tournamentLeaderboard, setTournamentLeaderboard] = useState<any>(null);
  const [competitionLiveScores, setCompetitionLiveScores] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tournamentLoading, setTournamentLoading] = useState(false);
  const [openScorecards, setOpenScorecards] = useState<Set<string>>(new Set());
  const [showPopupViewer, setShowPopupViewer] = useState(false);
  const [popupScorecard, setPopupScorecard] = useState<Scorecard | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [popupMode, setPopupMode] = useState<'fantasy' | 'tournament'>('fantasy');
  const [dataSource, setDataSource] = useState<'auto' | 'simple' | 'mock'>('auto');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<number>(1); // Track which round to display
  const [showTeeTimes, setShowTeeTimes] = useState(false);
  const [teeTimes, setTeeTimes] = useState<any>(null);
  const [teeTimesLoading, setTeeTimesLoading] = useState(false);

  // Load competitions on mount
  useEffect(() => {
    loadCompetitions();
  }, []);

  // Load leaderboard when competition changes
  useEffect(() => {
    if (selectedCompetition) {
      loadLeaderboard(selectedCompetition);
    }
  }, [selectedCompetition]);

  // Load tournament leaderboard when tournament changes and set up auto-refresh
  useEffect(() => {
    if (!selectedTournament) {
      // Clear tournament leaderboard when no tournament selected
      setTournamentLeaderboard(null);
      return;
    }
    
    // Clear existing data immediately to prevent showing stale data
    setTournamentLeaderboard(null);
    
    loadTournamentLeaderboard(selectedTournament);
    
    // Set up auto-refresh every 3 minutes (180,000 ms) to match DataGolf update frequency
    // Only refresh if we have live data, not database fallback
    const refreshInterval = setInterval(() => {
      if (tournamentLeaderboard?.source === 'datagolf-live' && 
          tournamentLeaderboard?.leaderboard?.length > 0) {
        console.log('🔄 Auto-refreshing live tournament data...');
        loadTournamentLeaderboard(selectedTournament);
      } else {
        console.log('⏸️ Skipping auto-refresh (tournament ended or showing database data)');
      }
    }, 180000); // 3 minutes
    
    // Cleanup interval on unmount or when tournament changes
    return () => {
      console.log('🧹 Cleaning up tournament auto-refresh interval');
      clearInterval(refreshInterval);
    };
  }, [selectedTournament]); // Only re-run when selectedTournament changes, not when tournamentLeaderboard updates

  async function loadTournamentLeaderboard(tournamentId: string) {
    try {
      setTournamentLoading(true);
      
      // Find tournament to get slug and check if it should be displayed
      const tournament = tournaments.find((t: any) => t.id === tournamentId);
      
      if (!tournament) {
        console.error('Tournament not found in tournaments list');
        setTournamentLeaderboard(null);
        return;
      }
      
      // Check if tournament ended more than 4 days ago
      if (tournament.end_date) {
        const endDate = new Date(tournament.end_date);
        const fourDaysAgo = new Date();
        fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
        
        if (endDate < fourDaysAgo) {
          console.log('⏰ Tournament ended more than 4 days ago, not loading leaderboard');
          setTournamentLeaderboard({
            tournament: tournament,
            leaderboard: [],
            source: 'archived',
            message: 'This tournament has ended and leaderboard data is no longer available.'
          });
          return;
        }
      }
      
      const tournamentSlug = tournament.slug || tournamentId;
      
      // Check tournament status
      const tournamentStatus = tournament.status;
      const isUpcoming = tournamentStatus === 'upcoming' || tournamentStatus === 'registration_open' || tournamentStatus === 'registration_closed';
      
      // For live/completed tournaments, try to get live scores from DataGolf
      if (!isUpcoming) {
        console.log('🔴 LIVE: Fetching real-time scores from DataGolf...');
        const liveResponse = await fetch(`/api/tournaments/${encodeURIComponent(tournamentSlug)}/live-scores`);
        
        if (liveResponse.ok) {
          const liveData = await liveResponse.json();
          console.log('✅ DataGolf response:', {
            golfers: liveData.leaderboard?.length || 0,
            message: liveData.message
          });
          
          // If DataGolf has live data, use it
          if (liveData.leaderboard && liveData.leaderboard.length > 0) {
            setTournamentLeaderboard({
              tournament: liveData.tournament,
              leaderboard: liveData.leaderboard,
              source: 'datagolf-live',
              lastUpdated: liveData.lastUpdated,
              message: liveData.message
            });
            console.log('✅ Using real-time DataGolf scores');
            return;
          }
        }
      }
      
      // Load from database - either for upcoming (show field) or completed (show results)
      console.log(`📊 Loading ${isUpcoming ? 'tournament field' : 'tournament results'} from database`);
      const response = await fetch(`/api/tournaments/${encodeURIComponent(tournamentId)}/leaderboard`);
      if (!response.ok) {
        console.error('❌ Failed to fetch tournament leaderboard, status:', response.status);
        throw new Error('Failed to fetch tournament leaderboard');
      }
      const data = await response.json();
      console.log('✅ Database leaderboard loaded for tournament:', data.tournament?.name);
      console.log('✅ Golfer count:', data.leaderboard?.length);
      console.log('✅ First golfer:', data.leaderboard?.[0]?.name);
      
      // If tournament is upcoming and no golfers assigned yet, show message
      if (isUpcoming && (!data.leaderboard || data.leaderboard.length === 0)) {
        setTournamentLeaderboard({
          tournament: data.tournament,
          leaderboard: [],
          source: 'upcoming-empty',
          message: `${tournament.name} field will be announced soon`
        });
      } else {
        // Show the data with appropriate source
        setTournamentLeaderboard({
          ...data,
          source: isUpcoming ? 'upcoming-field' : 'database'
        });
      }
    } catch (error) {
      console.error('❌ Error loading tournament leaderboard:', error);
      setTournamentLeaderboard(null);
    } finally {
      setTournamentLoading(false);
    }
  }

  async function loadCompetitions() {
    try {
      setLoading(true);
      // Add context parameter to only fetch live or recently completed tournaments
      // Add cache buster to force fresh data
      const cacheBuster = new Date().getTime();
      const response = await fetch(`/api/tournaments?context=leaderboard&_=${cacheBuster}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch tournaments');
      
      const data = await response.json();
      // API returns { tournaments: [...] }, not just an array
      const tournaments = data.tournaments || [];
      // Extract all competitions from all tournaments
      const allCompetitions: any[] = [];
      tournaments.forEach((tournament: any) => {
        if (tournament.competitions && tournament.competitions.length > 0) {
          tournament.competitions.forEach((comp: any) => {
            allCompetitions.push({
              ...comp,
              tournamentName: tournament.name,
              tournamentSlug: tournament.slug,
              tournamentLocation: tournament.location,
              tournamentStartDate: tournament.start_date,
              tournamentEndDate: tournament.end_date
            });
          });
        }
      });

      console.log('🎯 Total competitions found:', allCompetitions.length);
      setCompetitions(allCompetitions);
      
      // Clear old tournament leaderboard data to prevent showing stale data
      setTournamentLeaderboard(null);
      
      // Store tournaments for Tournament tab dropdown
      console.log('🏆 Setting tournaments array:', tournaments.length, 'tournaments');
      console.log('🏆 Tournament details:', tournaments.map((t: any) => ({ id: t.id, name: t.name })));
      setTournaments(tournaments);
      
      // Auto-select first valid competition and tournament
      if (allCompetitions.length > 0) {
        setSelectedCompetition(allCompetitions[0].id);
      }
      
      // Don't auto-select tournament - let user choose
      // User should select from dropdown to avoid showing empty state
    } catch (error) {
      console.error('❌ Error loading competitions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadLeaderboard(competitionId: string) {
    try {
      setLoading(true);
      const url = `/api/competitions/${competitionId}/leaderboard`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('❌ Leaderboard fetch failed:', response.status, response.statusText);
        throw new Error('Failed to fetch leaderboard');
      }
      
      const data = await response.json();
      
      // CRITICAL FIX: Always update leaderboard data, but preserve competition metadata
      // This prevents showing old entries when switching to a competition with no entries
      // while still allowing popup to access tournament information
      if (data.entries && data.entries.length > 0) {
        setLeaderboardData(data);
      } else {
        // Clear entries but keep competition metadata for popup functionality
        setLeaderboardData({
          competition: data.competition,
          entries: []
        });
      }
      
      // ALWAYS load tournament leaderboard from DATABASE for fantasy points
      // (Database IDs match the picks, DataGolf uses different dg_id)
      const tournamentId = data.competition?.tournament?.id;
      const tournamentSlug = data.competition?.tournament?.slug;
      const tournamentStatus = data.competition?.tournament?.status;
      const tournamentStarted = tournamentStatus === 'live' || tournamentStatus === 'completed';
      
      if (tournamentId && tournamentStarted) {
        const tournamentResponse = await fetch(`/api/tournaments/${encodeURIComponent(tournamentId)}/leaderboard`);
        if (tournamentResponse.ok) {
          const tournamentData = await tournamentResponse.json();
          
          // Load live scores and merge with database data
          if (tournamentSlug) {
            const liveResponse = await fetch(`/api/tournaments/${encodeURIComponent(tournamentSlug)}/live-scores`);
            if (liveResponse.ok) {
              const liveData = await liveResponse.json();
              
              // Merge live scores into tournament leaderboard for InPlay fantasy points
              if (liveData.leaderboard && liveData.leaderboard.length > 0) {
                setTournamentLeaderboard({
                  ...liveData,
                  source: 'datagolf-live'
                });
                setCompetitionLiveScores(liveData);
              } else {
                // Fallback to database if no live data
                setTournamentLeaderboard({
                  ...tournamentData,
                  source: 'database'
                });
              }
            } else {
              // Fallback to database if live scores fail
              setTournamentLeaderboard({
                ...tournamentData,
                source: 'database'
              });
            }
          } else {
            // No slug, use database
            setTournamentLeaderboard({
              ...tournamentData,
              source: 'database'
            });
          }
        } else {
          console.error('❌ Failed to load tournament leaderboard');
        }
      } else if (!tournamentStarted) {
        setTournamentLeaderboard(null);
        setCompetitionLiveScores(null);
      }
    } catch (error) {
      console.error('❌ Error loading leaderboard:', error);
      // Don't clear existing data on error
      if (!leaderboardData) {
        setLeaderboardData(null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadTeeTimes(tournamentSlug: string) {
    try {
      setTeeTimesLoading(true);
      console.log('⏰ Loading tee times for tournament:', tournamentSlug);
      
      const response = await fetch(`/api/tournaments/${encodeURIComponent(tournamentSlug)}/tee-times`);
      
      if (!response.ok) {
        console.error('❌ Tee times fetch failed:', response.status, response.statusText);
        throw new Error('Failed to fetch tee times');
      }
      
      const data = await response.json();
      console.log('✅ Tee times loaded:', data);
      
      setTeeTimes(data);
      setShowTeeTimes(true);
    } catch (error) {
      console.error('❌ Error loading tee times:', error);
      alert('Failed to load tee times. Please try again.');
    } finally {
      setTeeTimesLoading(false);
    }
  }

  // All data now comes from the API
  
  // Simple scorecard structure for popup
  const mockScorecard: Scorecard = {
    id: '1',
    tournamentId: '',
    tournamentName: '',
    submittedAt: '',
    totalSalary: 0,
    players: [],
    captain: undefined
  };

  // Calculate fantasy points for an entry based on hole-by-hole tournament scores
  const calculateEntryFantasyPoints = (entry: any): number => {
    if (!tournamentLeaderboard?.leaderboard || !entry.picks) {
      return 0;
    }

    // Check if tournament has started - don't show points for future tournaments
    const tournament = leaderboardData?.competition?.tournament;
    if (tournament?.status === 'upcoming' || tournament?.status === 'registration_open' || tournament?.status === 'registration_closed') {
      return 0;
    }

    let totalPoints = 0;
    
    // Calculate points for each golfer
    entry.picks.forEach((pick: any, pickIndex: number) => {
      // Handle both API formats: {golfer_id, golfers} OR {golferId, name}
      const golferId = pick.golfer_id || pick.golferId;
      const golferName = pick.golfers 
        ? `${pick.golfers.first_name} ${pick.golfers.last_name}` 
        : pick.name || '';
      
      // Try to match by ID first, then by name
      let golfer = tournamentLeaderboard.leaderboard.find((g: any) => {
        return g.id === golferId || g.id === String(golferId);
      });
      
      if (!golfer && golferName) {
        golfer = tournamentLeaderboard.leaderboard.find((g: any) => 
          g.name && g.name.toLowerCase() === golferName.toLowerCase()
        );
      }
      
      if (golfer) {
        // Build performance data for scoring system
        const rounds: RoundScore[] = [];
        const liveScoring = golfer.liveScoring;
        
        if (liveScoring && Array.isArray(liveScoring)) {
          // Use real hole-by-hole data
          liveScoring.forEach((round: any, roundIndex: number) => {
            if (round.holes && Array.isArray(round.holes)) {
              rounds.push({
                round: roundIndex + 1,
                holes: round.holes.map((h: any) => ({
                  hole: h.hole || 0,
                  par: h.par || 4,
                  score: h.score || h.par || 4
                }))
              });
            }
          });
        }
        
        // Don't calculate points if no real data available
        if (rounds.length === 0) {
          return; // Skip this golfer - no points until tournament starts
        }
        
        // Determine if this is the captain
        const isCaptain = pick.is_captain || (entry.captainGolferId && entry.captainGolferId === golferId);
        
        // Get final position
        const placement = typeof golfer.position === 'string' 
          ? parseInt(golfer.position.replace(/[^0-9]/g, '')) 
          : golfer.position;
        const finalPosition = isNaN(placement) ? undefined : placement;
        
        // Build performance object
        const performance: GolferPerformance = {
          rounds,
          finalPosition,
          madeCut: true, // Assume made cut if they have data
          isCaptain
        };
        
        // Calculate score using centralized scoring system
        const scoring = calculateGolferScore(performance);
        totalPoints += scoring.finalTotal;
      }
    });
    
    return Math.round(totalPoints);
  };

  const toggleScorecard = (entryId: string) => {
    const newOpen = new Set(openScorecards);
    if (newOpen.has(entryId)) {
      newOpen.delete(entryId);
    } else {
      newOpen.clear();
      newOpen.add(entryId);
    }
    setOpenScorecards(newOpen);
  };

  // Open fantasy competition popup with user's picks
  const openFantasyPopup = async (entry: any) => {
    try {
      // Fetch the picks with golfer details
      const response = await fetch(`/api/entries/${entry.entryId}/picks-with-golfers`);
      if (!response.ok) {
        throw new Error('Failed to fetch entry picks');
      }
      
      const { picks } = await response.json();
      const tournamentId = leaderboardData?.competition?.tournament?.id;
      
      const scorecard: Scorecard = {
        id: entry.entryId,
        tournamentId: tournamentId || '',
        tournamentName: leaderboardData?.competition?.tournament?.name || 'Tournament',
        submittedAt: entry.createdAt || '',
        totalSalary: entry.totalSalary || 0,
        players: (picks || []).map((pick: any) => {
          const golfer = pick.golfers;
          const fullName = golfer ? `${golfer.first_name} ${golfer.last_name}` : 'Unknown';
          return {
            id: pick.golfer_id,
            name: fullName,
            golferName: fullName,
            salary: pick.salary || 0,
            points: 0,
            rank: `#${pick.slot_position || '?'}`
          };
        }),
        captain: entry.captainGolferId ? {
          id: entry.captainGolferId,
          name: (picks || []).find((p: any) => p.golfer_id === entry.captainGolferId)?.golfers 
            ? `${(picks || []).find((p: any) => p.golfer_id === entry.captainGolferId)?.golfers.first_name} ${(picks || []).find((p: any) => p.golfer_id === entry.captainGolferId)?.golfers.last_name}`
            : 'Captain'
        } : undefined
      };
      
      // Set all popup state FIRST to avoid race conditions
      setPopupMode('fantasy');
      setPopupScorecard(scorecard);
      setSelectedEntry(entry);
      setSelectedPlayer(scorecard.players[0]?.id || null);
      setShowPopupViewer(true);
      
      // Only load tournament leaderboard if tournament has started (live or completed)
      const tournament = leaderboardData?.competition?.tournament;
      const tournamentStarted = tournament?.status === 'live' || tournament?.status === 'completed';
      
      if (tournamentId && tournamentStarted && (!tournamentLeaderboard || tournamentLeaderboard.tournament?.id !== tournamentId)) {
        const tournamentResponse = await fetch(`/api/tournaments/${encodeURIComponent(tournamentId)}/leaderboard`);
        if (tournamentResponse.ok) {
          const data = await tournamentResponse.json();
          setTournamentLeaderboard(data);
        }
      } else if (!tournamentStarted) {
        setTournamentLeaderboard(null);
        setCompetitionLiveScores(null);
      }
    } catch (error) {
      console.error('❌ Error loading entry picks:', error);
      alert('Failed to load entry picks. Please try again.');
    }
  };

  // Open tournament popup with all golfers
  const openTournamentPopup = async (golfer: any) => {
    if (!tournamentLeaderboard || !tournamentLeaderboard.leaderboard) {
      return;
    }
    
    // Only fetch live scores if tournament is actually in play (not upcoming)
    const tournament = tournaments.find((t: any) => t.id === selectedTournament);
    const tournamentStatus = tournament?.status || '';
    const isLiveTournament = tournamentStatus === 'live' || tournamentStatus === 'in-play';
    
    // Clear any previous live scores data for upcoming tournaments
    if (!isLiveTournament) {
      setCompetitionLiveScores(null);
      console.log('⏸️ Tournament not live - skipping live-scores fetch');
    } else {
      // Only fetch live scores for tournaments that are actually in play
      const tournamentSlug = tournament?.slug || selectedTournament;
      if (tournamentSlug) {
        try {
          const liveResponse = await fetch(`/api/tournaments/${encodeURIComponent(tournamentSlug)}/live-scores`);
          if (liveResponse.ok) {
            const liveData = await liveResponse.json();
            console.log('✅ Loaded live scores for tournament popup:', {
              golfers: liveData.leaderboard?.length || 0,
              source: liveData.source
            });
            // Store as competitionLiveScores so popup can access all 4 rounds
            setCompetitionLiveScores(liveData);
          }
        } catch (error) {
          console.error('❌ Failed to load live scores for tournament popup:', error);
        }
      }
    }
    
    const allTournamentPlayers = tournamentLeaderboard.leaderboard.map((g: any) => ({
      id: g.id,
      name: g.name,
      golferName: g.name, // Add golferName field for popup to use
      golferId: g.id, // Add golferId for matching
      salary: 0,
      points: Math.abs(g.score) * 10,
      rank: `#${typeof g.position === 'string' ? g.position : tournamentLeaderboard.leaderboard.indexOf(g) + 1}`
    }));
    
    const scorecard: Scorecard = {
      id: 'tournament-view',
      tournamentId: tournamentLeaderboard.tournament?.id || '',
      tournamentName: tournamentLeaderboard.tournament?.name || 'Tournament',
      submittedAt: new Date().toISOString(),
      totalSalary: 0,
      players: allTournamentPlayers
    };
    
    console.log('🏌️ Scorecard players:', scorecard.players);
    
    setPopupMode('tournament');
    setPopupScorecard(scorecard);
    setSelectedPlayer(golfer.id);
    setShowPopupViewer(true);
  };

  const closePopup = () => {
    setShowPopupViewer(false);
    setPopupScorecard(null);
    setSelectedPlayer(null);
    setSelectedEntry(null);
  };

  const getPositionIcon = (position: number) => {
    if (position <= 3) return '🏆';
    if (position <= 10) return '💰';
    return '📊';
  };

  const getStatusEmoji = (status: string) => {
    if (status === 'in-play') return '🔴 Live';
    if (status === 'completed') return '✅ Completed';
    return '📅 Upcoming';
  };

  // Determine actual tournament status based on dates and database status
  const getTournamentStatus = (tournament: any) => {
    if (!tournament) return { status: 'upcoming', display: '📅 Upcoming', color: '#9ca3af' };
    
    // If tournament has explicit status field from database, use it
    if (tournament.status) {
      if (tournament.status === 'live' || tournament.status === 'in_progress') {
        return { status: 'in-progress', display: '🔴 Live', color: '#ef4444' };
      }
      if (tournament.status === 'completed') {
        return { status: 'completed', display: '✅ Completed', color: '#10b981' };
      }
      if (tournament.status === 'registration_open' || tournament.status === 'reg_open') {
        return { status: 'reg_open', display: '📝 Registration Open', color: '#667eea' };
      }
    }
    
    const now = new Date();
    const startDate = tournament.startDate ? new Date(tournament.startDate) : null;
    const endDate = tournament.endDate ? new Date(tournament.endDate) : null;
    const regCloseDate = tournament.reg_close_at ? new Date(tournament.reg_close_at) : null;
    
    // Get all round tee times
    const round1TeeTime = tournament.round1_tee_time ? new Date(tournament.round1_tee_time) : null;
    const round2TeeTime = tournament.round2_tee_time ? new Date(tournament.round2_tee_time) : null;
    const round3TeeTime = tournament.round3_tee_time ? new Date(tournament.round3_tee_time) : null;
    const round4TeeTime = tournament.round4_tee_time ? new Date(tournament.round4_tee_time) : null;
    
    // Find the first tee time that has started
    const firstTeeTime = round1TeeTime || startDate;
    const lastTeeTime = round4TeeTime || round3TeeTime || round2TeeTime || round1TeeTime;
    
    // Tournament end date should include the full day (set to end of day)
    const endDateEndOfDay = endDate ? new Date(endDate) : null;
    if (endDateEndOfDay) {
      endDateEndOfDay.setHours(23, 59, 59, 999);
    }
    
    // Check if tournament is actually in progress based on tee times
    if (firstTeeTime && now >= firstTeeTime) {
      // Tournament has started - check if it's completed
      // Add ~6 hours to last tee time for round completion (typical round duration)
      const estimatedEndTime = lastTeeTime ? new Date(lastTeeTime.getTime() + (6 * 60 * 60 * 1000)) : endDateEndOfDay;
      
      if (estimatedEndTime && now <= estimatedEndTime) {
        // Determine which round is in progress
        let currentRound = 1;
        if (round4TeeTime && now >= round4TeeTime) currentRound = 4;
        else if (round3TeeTime && now >= round3TeeTime) currentRound = 3;
        else if (round2TeeTime && now >= round2TeeTime) currentRound = 2;
        
        return { 
          status: 'in-progress', 
          display: `🔴 Live - Round ${currentRound}`, 
          color: '#ef4444' 
        };
      }
      
      // Tournament has finished all rounds
      return { status: 'completed', display: '✅ Completed', color: '#10b981' };
    }
    
    // Check if registration is still open
    if (regCloseDate && now < regCloseDate) {
      return { status: 'reg_open', display: '📝 Registration Open', color: '#667eea' };
    }
    
    // Registration closed but not started yet
    if (firstTeeTime && now < firstTeeTime) {
      return { status: 'reg_closed', display: '⏳ Starting Soon', color: '#f59e0b' };
    }
    
    return { status: 'upcoming', display: '📅 Upcoming', color: '#9ca3af' };
  };

  return (
    <RequireAuth>
      <main style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '20px',
        minHeight: '100vh'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(350px, 100%), 1fr))',
          gap: '20px',
          alignItems: 'start'
        }}
        className="leaderboard-grid">  
          {/* Container 1: Multi-View Leaderboard */}
          <div style={{
            background: 'rgba(15, 23, 4, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            isolation: 'isolate'
          }}>
            {/* Header with Toggle Buttons */}
            <div style={{
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              {/* Competition Dropdown */}
              {viewToggle === 'inplay' && (
                <select
                  value={selectedCompetition}
                  onChange={(e) => setSelectedCompetition(e.target.value)}
                  style={{
                    background: '#fff',
                    color: '#667eea',
                    border: '1px solid #4b5563',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '14px',
                    flex: 1,
                    cursor: 'pointer',
                    fontWeight: 600,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  disabled={loading || competitions.length === 0}
                >
                  {loading ? (
                    <option value="">Loading...</option>
                  ) : competitions.length === 0 ? (
                    <option value="">No competitions available</option>
                  ) : (
                    <>
                      <option value="">🏌️ Select Competition</option>
                      {competitions.map((comp) => (
                        <option key={comp.id} value={comp.id}>
                          {comp.tournamentName} - {comp.competition_types?.name || 'Competition'}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              )}

              {/* Live Stats Toggle Button */}
              <button
                onClick={() => setViewToggle('livestats')}
                style={{
                  background: viewToggle === 'livestats' 
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                    : 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                Live Stats
              </button>
            </div>

            {/* Content Views */}
            <div>
              {/* View 1: InPlay Leaderboard */}
              {viewToggle === 'inplay' && (
                <>
                  {!selectedCompetition || !leaderboardData || leaderboardData.entries.length === 0 ? (
                    <div style={{
                      background: 'rgba(255,255,255,0.02)',
                      padding: '40px 20px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '32px', marginBottom: '12px' }}>
                        {loading ? '⏳' : !selectedCompetition ? '🏌️' : '📊'}
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#f59e0b', marginBottom: '8px' }}>
                        {loading ? 'Loading...' : !selectedCompetition ? 'Select a Competition' : 'No Entries Yet'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                        {loading ? 'Fetching leaderboard data...' : !selectedCompetition ? 'Choose a competition to view the leaderboard' : 'Be the first to submit an entry for this competition'}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Entry Count Header */}
                      <div style={{
                        background: 'rgba(102, 126, 234, 0.1)',
                        border: '1px solid rgba(102, 126, 234, 0.3)',
                        borderRadius: '6px',
                        padding: '12px 16px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ fontSize: '14px', color: '#e5e7eb', fontWeight: 600 }}>
                          {competitions.find(c => c.id === selectedCompetition)?.tournamentName} - {competitions.find(c => c.id === selectedCompetition)?.competition_types?.name}
                        </div>
                        <div style={{
                          background: 'rgba(102, 126, 234, 0.2)',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#a5b4fc'
                        }}>
                          👥 {leaderboardData.entries.length} {leaderboardData.entries.length === 1 ? 'Entry' : 'Entries'}
                        </div>
                      </div>

                      {/* Column Headers */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr minmax(100px, 120px)',
                        gap: '12px',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        marginBottom: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#9ca3af',
                        textTransform: 'uppercase'
                      }}>
                        <div>Pos</div>
                        <div>User</div>
                        <div style={{ textAlign: 'center' }}>Fantasy Points</div>
                      </div>

                      {/* Fantasy Entries - Real Data */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[...leaderboardData.entries]
                          .sort((a, b) => calculateEntryFantasyPoints(b) - calculateEntryFantasyPoints(a))
                          .map((entry: any, index: number) => {
                          const position = index + 1;
                          const isTop3 = position <= 3;

                          return (
                            <div
                              key={entry.entryId}
                              onClick={() => openFantasyPopup(entry)}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '40px 1fr minmax(100px, 120px)',
                                gap: '12px',
                                background: isTop3 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${isTop3 ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255,255,255,0.08)'}`,
                                borderRadius: '8px',
                                padding: '16px',
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                alignItems: 'center'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = isTop3 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255,255,255,0.06)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = isTop3 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255,255,255,0.03)';
                              }}
                            >
                              {/* Position Badge */}
                              <div style={{
                                width: '32px',
                                height: '32px',
                                background: isTop3 ? '#667eea' : '#374151',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: 700,
                                color: 'white'
                              }}>
                                {position}
                              </div>

                              {/* User Info */}
                              <div>
                                <div style={{ fontSize: '16px', fontWeight: 600, color: '#e5e7eb', marginBottom: '4px' }}>
                                  {entry.username}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#9ca3af' }}>
                                  <span>Entry: {entry.entryName || 'Unnamed'}</span>
                                  <span>{entry.picks?.length || 0} Golfers</span>
                                  <span>💰 £{(entry.totalSalary / 100).toFixed(0)}</span>
                                </div>
                              </div>

                              {/* Fantasy Points */}
                              <div style={{ textAlign: 'center' }}>
                                {(() => {
                                  const points = calculateEntryFantasyPoints(entry);
                                  const hasData = tournamentLeaderboard?.leaderboard && entry.picks?.length > 0;
                                  return (
                                    <>
                                      <div style={{ fontSize: '18px', fontWeight: 700, color: hasData ? '#e5e7eb' : '#9ca3af' }}>
                                        {points}
                                      </div>
                                      <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                                        {hasData ? 'Fantasy Pts' : 'Calculating...'}
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* View 2: Live Stats */}
              {viewToggle === 'livestats' && (
                <>
                  {/* Back Button */}
                  <button
                    onClick={() => setViewToggle('inplay')}
                    style={{
                      background: 'rgba(102, 126, 234, 0.15)',
                      border: '1px solid rgba(102, 126, 234, 0.3)',
                      borderRadius: '6px',
                      padding: '10px 16px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#a5b4fc',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    ← Back to Leaderboard
                  </button>

                  {/* Tournament Info Card */}
                  {leaderboardData?.competition?.tournament && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '16px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      marginBottom: '16px'
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                        {leaderboardData.competition.tournament.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {leaderboardData.competition.tournament.location && (
                          <div>📍 {leaderboardData.competition.tournament.location}</div>
                        )}
                        <div>💰 Entry Fee: ${(leaderboardData.competition.entryFeePennies / 100).toFixed(2)}</div>
                        <div>⏰ Status: {getStatusEmoji(leaderboardData.competition.status)}</div>
                      </div>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    {[
                      { label: 'Total Players', value: '156', color: '#667eea', bg: 'rgba(102, 126, 234, 0.1)' },
                      { label: 'Entries Submitted', value: '234', color: '#e5e7eb', bg: 'rgba(255, 255, 255, 0.05)' },
                      { label: 'In Progress', value: '89', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
                      { label: 'Completed', value: '67', color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)' }
                    ].map((stat) => (
                      <div key={stat.label} style={{
                        background: stat.bg,
                        padding: '12px',
                        borderRadius: '6px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: stat.color }}>
                          {stat.value}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Live Leaderboard Widget */}
                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>
                      Live Leaderboard widget will be rendered here
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Second Container: Tournament Leaderboard */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            isolation: 'isolate',
            minHeight: '400px'
          }}>
            {/* Header */}
            <div style={{
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 700, 
                color: '#fbbf24',
                marginBottom: '8px'
              }}>
                🏆 Tournament Leaderboard
              </h2>
            </div>

            {/* Tournament Selector */}
            <div style={{ marginBottom: '20px' }}>
              <select
                value={selectedTournament}
                onChange={(e) => setSelectedTournament(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#e5e7eb',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                <option value="" style={{ background: '#1f2937', color: '#e5e7eb' }}>Select a tournament...</option>
                {tournaments.map((tournament) => (
                  <option key={tournament.id} value={tournament.id} style={{ background: '#1f2937', color: '#e5e7eb' }}>
                    {tournament.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tournament Status Display */}
            {selectedTournament && tournamentLeaderboard?.tournament && (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#e5e7eb' }}>
                    {tournamentLeaderboard.tournament.name}
                  </div>
                  {tournamentLeaderboard.tournament.startDate && tournamentLeaderboard.tournament.endDate && (
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {new Date(tournamentLeaderboard.tournament.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(tournamentLeaderboard.tournament.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🏌️</span>
                    <span>{tournamentLeaderboard.leaderboard?.length || 0} golfers</span>
                  </div>
                </div>
                <div style={{
                  background: (() => {
                    const statusInfo = getTournamentStatus(tournamentLeaderboard.tournament);
                    return `${statusInfo.color}20`;
                  })(),
                  border: `1px solid ${(() => {
                    const statusInfo = getTournamentStatus(tournamentLeaderboard.tournament);
                    return `${statusInfo.color}60`;
                  })()}`,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: (() => {
                    const statusInfo = getTournamentStatus(tournamentLeaderboard.tournament);
                    return statusInfo.color;
                  })()
                }}>
                  {getTournamentStatus(tournamentLeaderboard.tournament).display}
                </div>
              </div>
            )}

            {/* Live Data Status - Show last update time and refresh button */}
            {selectedTournament && tournamentLeaderboard && (
              <div style={{
                background: tournamentLeaderboard.source === 'datagolf-live' 
                  ? 'rgba(34, 197, 94, 0.1)' 
                  : 'rgba(59, 130, 246, 0.1)',
                border: `1px solid ${tournamentLeaderboard.source === 'datagolf-live' 
                  ? 'rgba(34, 197, 94, 0.3)' 
                  : 'rgba(59, 130, 246, 0.3)'}`,
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: tournamentLeaderboard.source === 'datagolf-live' ? '#22c55e' : '#3b82f6',
                    animation: tournamentLeaderboard.source === 'datagolf-live' ? 'pulse 2s infinite' : 'none'
                  }}></span>
                  <span style={{ color: '#e5e7eb', fontWeight: 500 }}>
                    {tournamentLeaderboard.source === 'datagolf-live' ? '🔴 LIVE' : '📊 Database'} Data
                  </span>
                  {tournamentLeaderboard.lastUpdated && (
                    <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                      • Updated {new Date(tournamentLeaderboard.lastUpdated).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      const tournament = tournaments.find((t: any) => t.id === selectedTournament);
                      if (tournament?.slug) {
                        loadTeeTimes(tournament.slug);
                      }
                    }}
                    disabled={teeTimesLoading}
                    style={{
                      background: 'rgba(102, 126, 234, 0.2)',
                      border: '1px solid rgba(102, 126, 234, 0.4)',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      color: '#a5b4fc',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: teeTimesLoading ? 'not-allowed' : 'pointer',
                      opacity: teeTimesLoading ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    ⏰ {teeTimesLoading ? 'Loading...' : 'TEE TIMES'}
                  </button>
                  <button
                    onClick={() => loadTournamentLeaderboard(selectedTournament)}
                    disabled={tournamentLoading}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      color: '#e5e7eb',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: tournamentLoading ? 'not-allowed' : 'pointer',
                      opacity: tournamentLoading ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span style={{ transform: tournamentLoading ? 'rotate(360deg)' : 'none', transition: 'transform 1s linear', display: 'inline-block' }}>🔄</span>
                    {tournamentLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>
            )}

            {/* Column Headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 80px 80px 80px 80px',
              gap: '16px',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              marginBottom: '12px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#9ca3af',
              textTransform: 'uppercase'
            }}>
              <div>Pos</div>
              <div>Golfer</div>
              <div style={{ textAlign: 'center' }}>Score</div>
              <div style={{ textAlign: 'center' }}>Today</div>
              <div style={{ textAlign: 'center' }}>Round</div>
              <div style={{ textAlign: 'center' }}>Thru</div>
            </div>

            {/* PGA Leaderboard Entries */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tournamentLoading && <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading leaderboard...</div>}
              {!tournamentLoading && tournamentLeaderboard && tournamentLeaderboard.leaderboard && tournamentLeaderboard.leaderboard.length > 0 ? (
                tournamentLeaderboard.leaderboard.map((golfer: any, index: number) => {
                  const position = typeof golfer.position === 'string' ? golfer.position : (index + 1);
                  const isTop3 = index < 3;
                  
                  // Use tournament's current round from DataGolf API
                  const tournamentCurrentRound = tournamentLeaderboard.currentRound || 4;
                  
                  // Determine current round for this golfer
                  let currentRound: string | number = tournamentCurrentRound;
                  
                  // Check how many rounds the golfer has actually completed
                  const roundsCompleted = golfer.rounds?.length || 0;
                  
                  // If golfer thru shows they finished the round but we don't have all scores yet
                  if (golfer.thru === 'F' || golfer.thru === '18' || golfer.thru === 18) {
                    // They finished a round - show the round they just completed
                    currentRound = roundsCompleted;
                  } else if (golfer.thru === 'CUT') {
                    currentRound = 'CUT';
                  } else if (typeof golfer.thru === 'number' && golfer.thru > 0) {
                    // They're currently playing - show which round based on rounds completed
                    currentRound = roundsCompleted + 1;
                  } else {
                    // Default to tournament round, but cap at rounds completed + 1
                    currentRound = Math.min(tournamentCurrentRound, roundsCompleted + 1);
                  }
                  
                  // If all 4 rounds are completed, show F
                  if (roundsCompleted >= 4) {
                    currentRound = 'F';
                  }

                  return (
                    <div key={golfer.id}>
                      <div
                        onClick={() => openTournamentPopup(golfer)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1fr 80px 80px 80px 80px',
                        gap: '16px',
                        background: isTop3 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isTop3 ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '8px',
                        padding: '16px',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isTop3 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255,255,255,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isTop3 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255,255,255,0.03)';
                      }}
                    >
                      {/* Position Badge */}
                      <div style={{
                        width: '32px',
                        height: '32px',
                        background: isTop3 ? '#667eea' : '#374151',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'white'
                      }}>
                        {position}
                      </div>

                      {/* Golfer Info */}
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: '#e5e7eb', marginBottom: '4px' }}>
                          {golfer.name}
                        </div>
                      </div>

                      {/* Total Score */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                          fontSize: '18px', 
                          fontWeight: 700, 
                          color: golfer.score < 0 ? '#667eea' : golfer.score > 0 ? '#f59e0b' : '#9ca3af'
                        }}>
                          {golfer.score > 0 ? '+' : ''}{golfer.score}
                        </div>
                      </div>

                      {/* Today's Score */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: 600, 
                          color: golfer.today < 0 ? '#667eea' : golfer.today > 0 ? '#f59e0b' : '#9ca3af'
                        }}>
                          {golfer.today > 0 ? '+' : ''}{golfer.today}
                        </div>
                      </div>

                      {/* Current Round */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                          fontSize: '13px', 
                          fontWeight: 700, 
                          color: currentRound === 'F' ? '#10b981' : currentRound === 'CUT' ? '#ef4444' : '#667eea',
                          background: currentRound === 'F' ? 'rgba(16, 185, 129, 0.1)' : currentRound === 'CUT' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(102, 126, 234, 0.1)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          {currentRound === 'F' ? 'F' : currentRound === 'CUT' ? 'CUT' : `R${currentRound}`}
                        </div>
                      </div>

                      {/* Thru */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af' }}>
                          {golfer.thru}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
              ) : !tournamentLoading && tournamentLeaderboard?.source === 'upcoming-empty' ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: '#e5e7eb' }}>Field Not Yet Announced</div>
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                    {tournamentLeaderboard.message}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Tournament golfers will appear here once they are added in the admin panel
                  </div>
                </div>
              ) : !tournamentLoading && tournamentLeaderboard?.source === 'upcoming' ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: '#e5e7eb' }}>Tournament Not Started</div>
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                    {tournamentLeaderboard.message}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Leaderboard will be available when the tournament begins
                  </div>
                </div>
              ) : !tournamentLoading && tournamentLeaderboard?.source === 'archived' ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: '#e5e7eb' }}>Tournament Archived</div>
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                    {tournamentLeaderboard.message || 'This tournament has ended and leaderboard data is no longer available.'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Leaderboards are available for 4 days after tournament completion
                  </div>
                </div>
              ) : !tournamentLoading && (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏌️</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No Tournament Data</div>
                  <div style={{ fontSize: '14px' }}>Please select a tournament from the dropdown above</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Popup Scorecard Viewer */}
        {showPopupViewer && popupScorecard ? (
          <>
            {/* Backdrop */}
            <div 
              onClick={closePopup}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.7)',
                zIndex: 999
              }}
            />

            {/* Modal */}
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '95%',
              maxWidth: '1200px',
              maxHeight: '85vh',
              background: '#1f2937',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Popup Header */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15))',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>
                    {popupScorecard.tournamentName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                    Submitted: {new Date(popupScorecard.submittedAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={closePopup}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>

              {/* Content */}
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Player List Sidebar */}
                <div style={{
                  width: '200px',
                  borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '8px',
                  background: 'rgba(0,0,0,0.2)',
                  overflowY: 'auto'
                }}>
                  {(!popupScorecard.players || popupScorecard.players.length === 0) ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>
                      No players found
                    </div>
                  ) : (
                    popupScorecard.players.map((player) => {
                      const isSelected = selectedPlayer === player.id;
                      const isCaptain = popupScorecard.captain?.id === player.id;

                      return (
                        <div
                          key={player.id}
                        onClick={() => setSelectedPlayer(player.id)}
                        style={{
                          padding: '8px',
                          background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${isSelected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginBottom: '4px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.border = '1px solid rgba(255,255,255,0.2)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)';
                          }
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#e5e7eb', marginBottom: '2px' }}>
                          {player.name}
                        </div>
                        {isCaptain && (
                          <div style={{ color: '#fbbf24', fontSize: '8px', marginBottom: '2px' }}>
                            ⭐ CAPTAIN
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                            {player.rank}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#10b981' }}>
                            {player.points} pts
                          </span>
                          {isSelected && (
                            <span style={{ color: '#667eea', fontSize: '12px' }}>→</span>
                          )}
                        </div>
                      </div>
                    );
                  }))}
                </div>

                {/* Scorecard Content */}
                <div style={{
                  flex: 1,
                  padding: '20px',
                  overflowY: 'auto'
                }}>
                  {!popupScorecard.players || popupScorecard.players.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No Players Selected</div>
                      <div style={{ fontSize: '14px' }}>This entry doesn't have any players yet.</div>
                    </div>
                  ) : !selectedPlayer ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>👈</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Select a Player</div>
                      <div style={{ fontSize: '14px' }}>Click on a player from the sidebar to view their scorecard</div>
                    </div>
                  ) : (() => {
                    console.log('🎯 Finding player:', { selectedPlayer, allPlayers: popupScorecard.players.map(p => ({ id: p.id, name: p.name })) });
                    const player = popupScorecard.players.find(p => p.id === selectedPlayer);
                    
                    if (!player) {
                      console.log('❌ Player not found!', { selectedPlayer, availablePlayers: popupScorecard.players });
                      return (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
                          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Player not found</div>
                          <div style={{ fontSize: '12px' }}>ID: {selectedPlayer}</div>
                        </div>
                      );
                    }
                    
                    console.log('✅ Found player:', player);
                    const isCaptain = popupScorecard.captain?.id === selectedPlayer;
                    
                    // Get real golfer data - use live scores for scorecards, fallback to tournament leaderboard
                    const liveLeaderboard = competitionLiveScores?.leaderboard || tournamentLeaderboard?.leaderboard;
                    console.log('🔍 Searching for player data:', { 
                      hasLiveScores: !!competitionLiveScores, 
                      hasTournamentData: !!tournamentLeaderboard,
                      leaderboardSize: liveLeaderboard?.length,
                      searchingFor: { id: selectedPlayer, name: player.golferName },
                      sampleLeaderboardGolfer: liveLeaderboard?.[0]
                    });
                    
                    let realGolferData = liveLeaderboard?.find((g: any) => g.id === selectedPlayer);
                    
                    if (!realGolferData && player.golferName) {
                      // Try exact name match (case insensitive)
                      realGolferData = liveLeaderboard?.find((g: any) => 
                        g.name && player.golferName && g.name.toLowerCase() === player.golferName.toLowerCase()
                      );
                      
                      if (realGolferData) {
                        console.log(`✅ Matched by exact name: ${player.golferName} -> ${realGolferData.name}`);
                      }
                      // REMOVED: Fuzzy matching was causing false matches (e.g., "Burns, Sam" matched "Valimaki, Sami")
                      // Only use exact ID or exact name match to prevent showing wrong golfer's data
                    }
                    
                    if (!realGolferData) {
                      console.log('⚠️ No tournament data found for this player');
                    }
                    
                    // Use real rounds data from tournament leaderboard
                    const hasRealData = realGolferData && realGolferData.rounds && realGolferData.rounds.length > 0;

                    return (
                      <div>
                        {/* Player Header */}
                        <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ color: '#e5e7eb', fontSize: '18px', fontWeight: 700 }}>
                              {player?.name}
                            </span>
                            {isCaptain && (
                              <span style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 600 }}>⭐ CAPTAIN</span>
                            )}
                            {hasRealData && (
                              <span style={{ 
                                background: 'rgba(16, 185, 129, 0.15)', 
                                color: '#10b981', 
                                fontSize: '10px', 
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '4px'
                              }}>
                                LIVE DATA
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '24px', fontSize: '13px', flexWrap: 'wrap' }}>
                            <div>
                              <span style={{ color: '#9ca3af' }}>Score: </span>
                              <span style={{ color: (hasRealData ? realGolferData.score : 0) <= 0 ? '#667eea' : '#f59e0b', fontWeight: 600 }}>
                                {hasRealData ? (realGolferData.score > 0 ? `+${realGolferData.score}` : realGolferData.score === 0 ? 'E' : realGolferData.score) : 'N/A'}
                              </span>
                            </div>
                            {hasRealData && realGolferData.today && (
                              <div>
                                <span style={{ color: '#9ca3af' }}>Today: </span>
                                <span style={{ color: realGolferData.today > 0 ? '#f59e0b' : '#667eea', fontWeight: 600 }}>
                                  {realGolferData.today > 0 ? '+' : ''}{realGolferData.today}
                                </span>
                              </div>
                            )}
                            {hasRealData && realGolferData.thru && (
                              <div>
                                <span style={{ color: '#9ca3af' }}>Thru: </span>
                                <span style={{ color: '#e5e7eb', fontWeight: 600 }}>{realGolferData.thru}</span>
                              </div>
                            )}
                            {hasRealData && realGolferData.position && (
                              <div>
                                <span style={{ color: '#9ca3af' }}>Position: </span>
                                <span style={{ color: '#fbbf24', fontWeight: 600 }}>{realGolferData.position}</span>
                              </div>
                            )}
                            <div>
                              <span style={{ color: '#9ca3af' }}>Fantasy Points: </span>
                              <span style={{ color: '#667eea', fontWeight: 700 }}>{hasRealData ? Math.abs(realGolferData.score) * 10 : 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Round Selector Buttons */}
                        {hasRealData && realGolferData.rounds && realGolferData.rounds.length > 0 && (
                          <div style={{ 
                            marginBottom: '20px', 
                            paddingBottom: '16px', 
                            borderBottom: '1px solid rgba(255,255,255,0.1)'
                          }}>
                            <div style={{ 
                              fontSize: '11px', 
                              fontWeight: 600, 
                              color: '#9ca3af', 
                              marginBottom: '12px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}>
                              Select Round to View Details
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {realGolferData.rounds.map((round: number, idx: number) => {
                                const roundNum = idx + 1;
                                const isSelected = selectedRound === roundNum;
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => setSelectedRound(roundNum)}
                                    style={{
                                      background: isSelected ? 'rgba(102, 126, 234, 0.25)' : 'rgba(255,255,255,0.05)',
                                      border: `1px solid ${isSelected ? 'rgba(102, 126, 234, 0.5)' : 'rgba(255,255,255,0.1)'}`,
                                      borderRadius: '8px',
                                      padding: '10px 20px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      gap: '4px',
                                      minWidth: '80px'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isSelected) {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isSelected) {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                      }
                                    }}
                                  >
                                    <span style={{ 
                                      fontSize: '10px', 
                                      fontWeight: 600, 
                                      color: isSelected ? '#667eea' : '#9ca3af',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.05em'
                                    }}>
                                      Round {roundNum}
                                    </span>
                                    <span style={{ 
                                      fontSize: '18px', 
                                      fontWeight: 700, 
                                      color: isSelected ? '#e5e7eb' : '#9ca3af'
                                    }}>
                                      {round}
                                    </span>
                                  </button>
                                );
                              })}
                              {/* All Rounds Summary Button */}
                              <button
                                onClick={() => setSelectedRound(0)}
                                style={{
                                  background: selectedRound === 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                  border: `1px solid ${selectedRound === 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                                  borderRadius: '8px',
                                  padding: '10px 20px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '4px',
                                  minWidth: '80px'
                                }}
                                onMouseEnter={(e) => {
                                  if (selectedRound !== 0) {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (selectedRound !== 0) {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                  }
                                }}
                              >
                                <span style={{ 
                                  fontSize: '10px', 
                                  fontWeight: 600, 
                                  color: selectedRound === 0 ? '#10b981' : '#9ca3af',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em'
                                }}>
                                  All Rounds
                                </span>
                                <span style={{ 
                                  fontSize: '18px', 
                                  fontWeight: 700, 
                                  color: selectedRound === 0 ? '#e5e7eb' : '#9ca3af'
                                }}>
                                  {realGolferData.rounds.reduce((sum: number, r: number) => sum + r, 0)}
                                </span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Scorecard and Fantasy Points Side by Side */}
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                          {/* Hole-by-Hole Scorecard */}
                          {hasRealData && selectedRound > 0 && (
                            <div style={{ 
                              background: 'rgba(255,255,255,0.03)', 
                              borderRadius: '8px',
                              border: '1px solid rgba(255,255,255,0.08)',
                              padding: '16px',
                              flex: '1'
                            }}>
                              <div style={{ 
                                fontSize: '11px', 
                                fontWeight: 600, 
                                color: '#9ca3af', 
                                marginBottom: '12px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}>
                                Round {selectedRound} Scorecard
                              </div>

                              {/* Round Summary Stats */}
                              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ 
                                  background: 'rgba(255,255,255,0.05)', 
                                  borderRadius: '6px',
                                  padding: '10px 16px',
                                  flex: 1,
                                  textAlign: 'center'
                                }}>
                                  <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                                    Round Score
                                  </div>
                                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#e5e7eb' }}>
                                    {realGolferData.rounds[selectedRound - 1]}
                                  </div>
                                </div>
                                
                                <div style={{ 
                                  background: 'rgba(255,255,255,0.05)', 
                                  borderRadius: '6px',
                                  padding: '10px 16px',
                                  flex: 1,
                                  textAlign: 'center'
                                }}>
                                  <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                                    Course Par
                                  </div>
                                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#9ca3af' }}>
                                    72
                                  </div>
                                </div>

                                <div style={{ 
                                  background: 'rgba(102, 126, 234, 0.15)', 
                                  borderRadius: '6px',
                                  padding: '10px 16px',
                                  flex: 1,
                                  textAlign: 'center',
                                  border: '1px solid rgba(102, 126, 234, 0.3)'
                                }}>
                                  <div style={{ fontSize: '9px', color: '#667eea', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                                    Score to Par
                                  </div>
                                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#667eea' }}>
                                    {(() => {
                                      const roundScore = realGolferData.rounds[selectedRound - 1];
                                      const toPar = roundScore - 72;
                                      return toPar > 0 ? `+${toPar}` : toPar === 0 ? 'E' : toPar;
                                    })()}
                                  </div>
                                </div>

                                <div style={{ 
                                  background: 'rgba(16, 185, 129, 0.15)', 
                                  borderRadius: '6px',
                                  padding: '10px 16px',
                                  flex: 1,
                                  textAlign: 'center',
                                  border: '1px solid rgba(16, 185, 129, 0.3)'
                                }}>
                                  <div style={{ fontSize: '9px', color: '#10b981', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                                    Fantasy Points
                                  </div>
                                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>
                                    {(() => {
                                      // Calculate real fantasy points using actual round score
                                      const roundScore = realGolferData.rounds[selectedRound - 1];
                                      const toPar = roundScore - 72;
                                      
                                      // Estimate points based on score to par
                                      // Assuming average mix of birdies/pars/bogeys
                                      let estimatedPoints = 0;
                                      if (toPar < 0) {
                                        // Under par - mostly birdies and pars
                                        const birdies = Math.abs(toPar);
                                        const pars = 18 - birdies;
                                        estimatedPoints = (birdies * 3) + (pars * 1);
                                      } else if (toPar === 0) {
                                        // Even par - all pars
                                        estimatedPoints = 18 * 1;
                                      } else {
                                        // Over par - mix of pars and bogeys
                                        const bogeys = toPar;
                                        const pars = 18 - bogeys;
                                        estimatedPoints = (pars * 1) + (bogeys * -1);
                                      }
                                      
                                      return estimatedPoints;
                                    })()}
                                  </div>
                                </div>
                              </div>
                            
                            {/* Scorecard Table */}
                            <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                              <div style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 600, marginBottom: '4px' }}>ℹ️ Hole-by-Hole Data Not Available</div>
                              <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                                DataGolf API only provides round totals for completed tournaments. Individual hole scores are not available.
                                Fantasy points are estimated based on the round score.
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(18, 1fr)', gap: '0' }}>
                              {/* Row Labels */}
                              <div style={{ display: 'contents' }}>
                                <div style={{ 
                                  padding: '6px 8px', 
                                  fontSize: '9px', 
                                  fontWeight: 600, 
                                  color: '#9ca3af',
                                  textTransform: 'uppercase',
                                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}>HOLE</div>
                                {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].map(hole => (
                                  <div key={`hole-${hole}`} style={{ 
                                    padding: '6px 4px', 
                                    fontSize: '10px', 
                                    fontWeight: 600,
                                    color: '#e5e7eb',
                                    textAlign: 'center',
                                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                                    borderLeft: hole === 10 ? '1px solid rgba(255,255,255,0.2)' : 'none'
                                  }}>{hole}</div>
                                ))}
                              </div>

                              {/* PAR Row */}
                              <div style={{ display: 'contents' }}>
                                <div style={{ 
                                  padding: '6px 8px', 
                                  fontSize: '9px', 
                                  fontWeight: 600, 
                                  color: '#9ca3af',
                                  textTransform: 'uppercase',
                                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}>PAR</div>
                                {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].map(hole => (
                                  <div key={`par-${hole}`} style={{ 
                                    padding: '6px 4px', 
                                    fontSize: '10px',
                                    color: '#9ca3af',
                                    textAlign: 'center',
                                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                                    borderLeft: hole === 10 ? '1px solid rgba(255,255,255,0.2)' : 'none'
                                  }}>4</div>
                                ))}
                              </div>

                              {/* SCORE Row */}
                              <div style={{ display: 'contents' }}>
                                <div style={{ 
                                  padding: '6px 8px', 
                                  fontSize: '9px', 
                                  fontWeight: 600, 
                                  color: '#9ca3af',
                                  textTransform: 'uppercase',
                                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}>SCORE</div>
                                {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].map(hole => {
                                  // Show message that hole-by-hole data is not available from DataGolf API
                                  // We have round totals but not individual hole scores
                                  return (
                                    <div key={`score-${hole}`} style={{ 
                                      padding: '6px 4px', 
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      color: '#9ca3af',
                                      textAlign: 'center',
                                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                                      borderLeft: hole === 10 ? '1px solid rgba(255,255,255,0.2)' : 'none'
                                    }}>-</div>
                                  );
                                })}
                              </div>

                              {/* STATUS Row */}
                              <div style={{ display: 'contents' }}>
                                <div style={{ 
                                  padding: '6px 8px', 
                                  fontSize: '9px', 
                                  fontWeight: 600, 
                                  color: '#9ca3af',
                                  textTransform: 'uppercase',
                                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}>STATUS</div>
                                {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].map(hole => {
                                  // Get live scoring data if available
                                  const liveRound = realGolferData?.liveScoring?.[selectedRound - 1];
                                  const holeData = liveRound?.holes?.find((h: any) => h.hole === hole);
                                  const par = holeData?.par || 4;
                                  let score = holeData?.score || null;
                                  
                                  // Only show data if we have actual hole scores from API
                                  const toPar = score !== null ? score - par : null;
                                  
                                  let bgColor = 'rgba(255,255,255,0.05)';
                                  let statusText = '-';
                                  
                                  if (toPar !== null) {
                                    if (toPar <= -2) {
                                      bgColor = 'rgba(251, 191, 36, 0.2)';
                                      statusText = toPar === -2 ? 'E' : 'A';
                                    } else if (toPar === -1) {
                                      bgColor = 'rgba(59, 130, 246, 0.15)';
                                      statusText = 'B';
                                    } else if (toPar === 0) {
                                      bgColor = 'rgba(16, 185, 129, 0.15)';
                                      statusText = 'P';
                                    } else if (toPar === 1) {
                                      bgColor = 'rgba(239, 68, 68, 0.15)';
                                      statusText = 'Bo';
                                    } else if (toPar >= 2) {
                                      bgColor = 'rgba(239, 68, 68, 0.2)';
                                      statusText = 'D+';
                                    }
                                  }
                                  
                                  return (
                                    <div key={`status-${hole}`} style={{ 
                                      padding: '6px 4px', 
                                      fontSize: '9px',
                                      fontWeight: 600,
                                      background: bgColor,
                                      color: '#e5e7eb',
                                      textAlign: 'center',
                                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                                      borderLeft: hole === 10 ? '1px solid rgba(255,255,255,0.2)' : 'none'
                                    }}>{statusText}</div>
                                  );
                                })}
                              </div>

                              {/* FANTASY Row */}
                              <div style={{ display: 'contents' }}>
                                <div style={{ 
                                  padding: '6px 8px', 
                                  fontSize: '9px', 
                                  fontWeight: 600, 
                                  color: '#9ca3af',
                                  textTransform: 'uppercase',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}>FANTASY</div>
                                {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].map(hole => {
                                  // Hole-by-hole data not available from DataGolf for completed tournaments
                                  // Only round totals are provided
                                  return (
                                    <div key={`fantasy-${hole}`} style={{ 
                                      padding: '6px 4px', 
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      color: '#6b7280',
                                      textAlign: 'center',
                                      borderLeft: hole === 10 ? '1px solid rgba(255,255,255,0.2)' : 'none'
                                    }}>-</div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Score Legend */}
                            <div style={{ 
                              marginTop: '16px',
                              padding: '12px',
                              background: 'rgba(255,255,255,0.02)',
                              borderRadius: '6px',
                              border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                              <div style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' }}>
                                Score Legend
                              </div>
                              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ 
                                    width: '24px', 
                                    height: '24px', 
                                    background: 'rgba(251, 191, 36, 0.2)', 
                                    border: '1px solid rgba(251, 191, 36, 0.5)',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: '#fbbf24'
                                  }}>E</div>
                                  <span style={{ fontSize: '11px', color: '#e5e7eb' }}>Eagle -2</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ 
                                    width: '24px', 
                                    height: '24px', 
                                    background: 'rgba(59, 130, 246, 0.15)', 
                                    border: '1px solid rgba(59, 130, 246, 0.4)',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: '#3b82f6'
                                  }}>B</div>
                                  <span style={{ fontSize: '11px', color: '#e5e7eb' }}>Birdie -1</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ 
                                    width: '24px', 
                                    height: '24px', 
                                    background: 'rgba(16, 185, 129, 0.15)', 
                                    border: '1px solid rgba(16, 185, 129, 0.4)',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: '#10b981'
                                  }}>P</div>
                                  <span style={{ fontSize: '11px', color: '#e5e7eb' }}>Par Ev</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ 
                                    width: '24px', 
                                    height: '24px', 
                                    background: 'rgba(239, 68, 68, 0.15)', 
                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    color: '#ef4444'
                                  }}>Bo</div>
                                  <span style={{ fontSize: '11px', color: '#e5e7eb' }}>Bogey +1</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          )}

                          {/* Fantasy Points Container - moved to align with scorecard */}
                          {hasRealData && selectedRound > 0 && (
                            <div style={{ flex: '0 0 30%' }}>
                              <div style={{ 
                                background: 'rgba(255,255,255,0.03)', 
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                padding: '16px',
                                maxHeight: '800px',
                                overflowY: 'auto'
                              }}>
                                {/* Tournament Total Fantasy Points */}
                                {hasRealData && realGolferData.rounds && realGolferData.rounds.length > 0 && (
                                  <div style={{ 
                                    marginBottom: '20px',
                                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15))',
                                    border: '1px solid rgba(102, 126, 234, 0.3)',
                                    borderRadius: '8px',
                                    padding: '16px'
                                  }}>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase' }}>
                                      Tournament Total
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div>
                                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#667eea' }}>
                                          {(() => {
                                            // Calculate total fantasy points from all rounds
                                            let totalPoints = 0;
                                            realGolferData.rounds.forEach((roundScore: number) => {
                                              const toPar = roundScore - 72;
                                              if (toPar < 0) {
                                                const birdies = Math.abs(toPar);
                                                const pars = 18 - birdies;
                                                totalPoints += (birdies * 3) + (pars * 1);
                                              } else if (toPar === 0) {
                                                totalPoints += 18 * 1;
                                              } else {
                                                const bogeys = toPar;
                                                const pars = 18 - bogeys;
                                                totalPoints += (pars * 1) + (bogeys * -1);
                                              }
                                            });
                                            
                                            // Add placement bonus
                                            if (realGolferData.position) {
                                              const pos = parseInt(realGolferData.position);
                                              if (!isNaN(pos)) {
                                                totalPoints += calculatePlacementBonus(pos);
                                              }
                                            }
                                            
                                            return totalPoints;
                                          })()}
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                                          Estimated Fantasy Points
                                          {isCaptain && <span style={{ color: '#fbbf24', marginLeft: '4px' }}>⭐ (2x if Captain)</span>}
                                        </div>
                                      </div>
                                    </div>
                                    <div style={{ marginTop: '12px', fontSize: '10px', color: '#9ca3af', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                      Based on {realGolferData.rounds.length} completed rounds
                                      {realGolferData.position && ` • Finished ${realGolferData.position}`}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Hole-by-Hole Fantasy Scoring Points */}
                                <div style={{ fontSize: '11px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                                  Scoring Rules Reference
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                  <div style={{ 
                                    background: 'rgba(16, 185, 129, 0.08)', 
                                    padding: '12px', 
                                    borderRadius: '6px',
                                    border: '1px solid rgba(16, 185, 129, 0.25)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#e5e7eb' }}>Par</div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>+1</div>
                                  </div>
                                  <div style={{ 
                                    background: 'rgba(16, 185, 129, 0.08)', 
                                    padding: '12px', 
                                    borderRadius: '6px',
                                    border: '1px solid rgba(16, 185, 129, 0.25)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#e5e7eb' }}>Birdie</div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>+3</div>
                                  </div>
                                  <div style={{ 
                                    background: 'rgba(16, 185, 129, 0.1)', 
                                    padding: '12px', 
                                    borderRadius: '6px',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#e5e7eb' }}>Eagle</div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>+6</div>
                                  </div>
                                  <div style={{ 
                                    background: 'rgba(251, 191, 36, 0.08)', 
                                    padding: '12px', 
                                    borderRadius: '6px',
                                    border: '1px solid rgba(251, 191, 36, 0.25)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#e5e7eb' }}>Albatross</div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fbbf24' }}>+10</div>
                                  </div>
                                  <div style={{ 
                                    background: 'rgba(239, 68, 68, 0.08)', 
                                    padding: '12px', 
                                    borderRadius: '6px',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#e5e7eb' }}>Bogey</div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>-1</div>
                                  </div>
                                  <div style={{ 
                                    background: 'rgba(239, 68, 68, 0.1)', 
                                    padding: '12px', 
                                    borderRadius: '6px',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#e5e7eb' }}>Double+</div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>-3</div>
                                  </div>
                                </div>

                                {/* Round Achievements */}
                                <div style={{ 
                                  borderTop: '1px solid rgba(255,255,255,0.1)', 
                                  paddingTop: '16px',
                                  marginTop: '16px'
                                }}>
                                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#e5e7eb', marginBottom: '12px' }}>
                                    Round Achievements (2x for Captain)
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '8px',
                                      padding: '8px',
                                      background: 'rgba(139, 92, 246, 0.08)',
                                      borderRadius: '4px',
                                      border: '1px solid rgba(139, 92, 246, 0.25)'
                                    }}>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#e5e7eb' }}>Bogey Free Round</div>
                                        <div style={{ fontSize: '9px', color: '#9ca3af' }}>Complete 18 holes without a bogey</div>
                                      </div>
                                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#8b5cf6' }}>+5 points</div>
                                    </div>
                                    <div style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '8px',
                                      padding: '8px',
                                      background: 'rgba(139, 92, 246, 0.08)',
                                      borderRadius: '4px',
                                      border: '1px solid rgba(139, 92, 246, 0.25)'
                                    }}>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#e5e7eb' }}>3 Consecutive Birdies</div>
                                        <div style={{ fontSize: '9px', color: '#9ca3af' }}>ONCE PER ROUND only</div>
                                      </div>
                                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#8b5cf6' }}>+5 points</div>
                                    </div>
                                    <div style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '8px',
                                      padding: '8px',
                                      background: 'rgba(139, 92, 246, 0.08)',
                                      borderRadius: '4px',
                                      border: '1px solid rgba(139, 92, 246, 0.25)'
                                    }}>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#e5e7eb' }}>Under 70 Strokes</div>
                                        <div style={{ fontSize: '9px', color: '#9ca3af' }}>Finish round in under 70 strokes</div>
                                      </div>
                                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#8b5cf6' }}>+3 points</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Tournament Placement Bonus */}
                                <div style={{ 
                                  borderTop: '1px solid rgba(255,255,255,0.1)', 
                                  paddingTop: '16px',
                                  marginTop: '16px'
                                }}>
                                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#e5e7eb', marginBottom: '12px' }}>
                                    Tournament Placement (NOT Doubled)
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af' }}>
                                      <span>1st Place</span>
                                      <span style={{ color: '#fbbf24', fontWeight: 600 }}>+25 pts</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af' }}>
                                      <span>2nd Place</span>
                                      <span style={{ color: '#fbbf24', fontWeight: 600 }}>+15 pts</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af' }}>
                                      <span>3rd Place</span>
                                      <span style={{ color: '#fbbf24', fontWeight: 600 }}>+10 pts</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af' }}>
                                      <span>4th Place</span>
                                      <span style={{ color: '#10b981', fontWeight: 600 }}>+7 pts</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af' }}>
                                      <span>5th Place</span>
                                      <span style={{ color: '#10b981', fontWeight: 600 }}>+5 pts</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af' }}>
                                      <span>6th-10th Place</span>
                                      <span style={{ color: '#10b981', fontWeight: 600 }}>+3 pts</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af' }}>
                                      <span>11th-20th Place</span>
                                      <span style={{ color: '#10b981', fontWeight: 600 }}>+2 pts</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Round Summary */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                          {/* Round Details */}
                          <div style={{ flex: '1' }}>
                            {/* Display based on selectedRound */}
                            {hasRealData ? (
                              <>
                                {selectedRound > 0 && realGolferData.rounds && realGolferData.rounds[selectedRound - 1] ? (
                                  // Single Round View - Stats removed
                                  null
                                ) : selectedRound === 0 ? (
                                  // Tournament Summary View
                                  <div style={{ 
                                    background: 'rgba(255,255,255,0.03)', 
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    padding: '20px'
                                  }}>
                                    {/* Tournament Overview */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                                      <div style={{ 
                                        background: 'rgba(102, 126, 234, 0.15)', 
                                        borderRadius: '6px',
                                        padding: '16px',
                                        textAlign: 'center',
                                        border: '1px solid rgba(102, 126, 234, 0.3)'
                                      }}>
                                        <div style={{ fontSize: '10px', color: '#667eea', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                                          Tournament Score
                                        </div>
                                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#667eea' }}>
                                          {realGolferData.score > 0 ? `+${realGolferData.score}` : realGolferData.score === 0 ? 'E' : realGolferData.score}
                                        </div>
                                      </div>

                                      <div style={{ 
                                        background: 'rgba(255,255,255,0.05)', 
                                        borderRadius: '6px',
                                        padding: '16px',
                                        textAlign: 'center'
                                      }}>
                                        <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                                          Position
                                        </div>
                                        <div style={{ fontSize: '32px', fontWeight: 700, color: '#e5e7eb' }}>
                                          {realGolferData.position}
                                        </div>
                                      </div>
                                    </div>

                                    {/* All Rounds Breakdown */}
                                    <div style={{ 
                                      background: 'rgba(255,255,255,0.03)', 
                                      borderRadius: '6px',
                                      padding: '16px',
                                      border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#e5e7eb', marginBottom: '12px' }}>
                                        Round-by-Round Scores
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {realGolferData.rounds && realGolferData.rounds.map((score: number, index: number) => (
                                          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Round {index + 1}</span>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#e5e7eb' }}>{score}</span>
                                              <span style={{ 
                                                fontSize: '11px', 
                                                fontWeight: 600, 
                                                color: '#667eea',
                                                background: 'rgba(102, 126, 234, 0.15)',
                                                padding: '2px 6px',
                                                borderRadius: '4px'
                                              }}>
                                                {(() => {
                                                  const toPar = score - 72;
                                                  return toPar > 0 ? `+${toPar}` : toPar === 0 ? 'E' : toPar;
                                                })()}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Tournament Stats */}
                                    <div style={{ 
                                      background: 'rgba(255,255,255,0.03)', 
                                      borderRadius: '6px',
                                      padding: '16px',
                                      border: '1px solid rgba(255,255,255,0.05)',
                                      marginTop: '16px'
                                    }}>
                                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#e5e7eb', marginBottom: '12px' }}>
                                        Tournament Statistics
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>Rounds Played</span>
                                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#e5e7eb' }}>
                                            {realGolferData.rounds ? realGolferData.rounds.length : 0}
                                          </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>Best Round</span>
                                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#667eea' }}>
                                            {realGolferData.rounds ? Math.min(...realGolferData.rounds) : '-'}
                                          </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>Average Score</span>
                                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#e5e7eb' }}>
                                            {realGolferData.rounds ? (realGolferData.rounds.reduce((a: number, b: number) => a + b, 0) / realGolferData.rounds.length).toFixed(1) : '-'}
                                          </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>Total Fantasy Points (Est.)</span>
                                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#667eea' }}>
                                            {Math.abs(realGolferData.score) * 10}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : null}
                              </>
                            ) : (
                              // No real data available
                              <div style={{ 
                                background: 'rgba(255,255,255,0.03)', 
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                padding: '40px',
                                textAlign: 'center'
                              }}>
                                <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>
                                  No round data available
                                </div>
                                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                  Round details will appear here when available
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </>
        ) : null}

        {/* Tee Times Modal */}
        {showTeeTimes && teeTimes && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}
            onClick={() => setShowTeeTimes(false)}
          >
            <div
              style={{
                background: '#1f2937',
                borderRadius: '12px',
                maxWidth: '900px',
                width: '100%',
                maxHeight: '85vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{
                padding: '24px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#e5e7eb', marginBottom: '4px' }}>
                    ⏰ Tee Times
                  </h2>
                  <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                    {teeTimes.tournament?.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowTeeTimes(false)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#e5e7eb',
                    fontSize: '20px',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>

              {/* Content */}
              <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '24px'
              }}>
                {teeTimes.field && teeTimes.field.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Field List with tee times */}
                    <div style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '16px'
                    }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#e5e7eb', marginBottom: '16px' }}>
                        {teeTimes.eventInfo?.event_name || 'Tournament Field'} ({teeTimes.field.length} players)
                      </h3>
                      {teeTimes.field.some((p: any) => p.tee_time) ? (
                        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '12px' }}>
                          Sorted by tee time
                        </p>
                      ) : (
                        <p style={{ fontSize: '13px', color: '#fbbf24', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          ⏳ Tee times not announced yet - showing tournament field
                        </p>
                      )}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
                        gap: '8px'
                      }}>
                        {teeTimes.field
                          .sort((a: any, b: any) => {
                            // Sort by tee time if available
                            if (a.tee_time && b.tee_time) {
                              return a.tee_time.localeCompare(b.tee_time);
                            }
                            return (a.player_name || '').localeCompare(b.player_name || '');
                          })
                          .map((player: any, idx: number) => (
                          <div key={idx} style={{
                            fontSize: '13px',
                            color: '#e5e7eb',
                            padding: '8px 12px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '4px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span>{player.player_name || player.name}</span>
                            {player.tee_time && (
                              <span style={{ 
                                fontSize: '12px', 
                                color: '#667eea',
                                fontWeight: 600,
                                background: 'rgba(102, 126, 234, 0.2)',
                                padding: '2px 8px',
                                borderRadius: '4px'
                              }}>
                                {player.tee_time}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#9ca3af'
                  }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏰</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                      No Tee Times Available
                    </div>
                    <div style={{ fontSize: '13px' }}>
                      Tee times will be available closer to the tournament start
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </RequireAuth>
  );
}
