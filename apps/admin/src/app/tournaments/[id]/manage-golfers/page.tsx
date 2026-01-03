'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Tournament {
  id: string;
  name: string;
  status: string;
  tour?: 'pga' | 'euro' | 'kft' | 'alt' | 'opp' | 'lpga' | 'other';
}

interface Golfer {
  id: string;
  name: string;
  country: string | null;
  dg_id: string | null;
  pga_tour_id: string | null;
}

interface TournamentGolfer extends Golfer {
  status: string;
}

export default function ManageGolfersPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [golfers, setGolfers] = useState<TournamentGolfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Ref to prevent duplicate rapid-fire requests
  const isProcessingRef = useRef(false);
  
  // Check if this is the clubhouse master tournament
  const clubhouseMasterTournamentId = process.env.NEXT_PUBLIC_CLUBHOUSE_MASTER_TOURNAMENT_ID || '00000000-0000-0000-0000-000000000001';
  const isClubhouseMaster = params.id === clubhouseMasterTournamentId;
  
  // Manual add form
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: '',
    country: '',
    dg_id: '',
    pga_tour_id: ''
  });

  // Rankings search
  const [showRankingsSearch, setShowRankingsSearch] = useState(false);
  const [rankingsSearch, setRankingsSearch] = useState('');
  const [rankings, setRankings] = useState<any[]>([]);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(new Set());
  const [browseMode, setBrowseMode] = useState(false);

  // CSV upload
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  async function fetchData() {
    try {
      setLoading(true);
      
      // Fetch tournament details
      const tournamentRes = await fetch(`/api/tournaments/${params.id}`);
      if (tournamentRes.ok) {
        const tournamentData = await tournamentRes.json();
        setTournament(tournamentData);
      }

      // Fetch golfers for this tournament
      await fetchGolfers();
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchGolfers() {
    try {
      const res = await fetch(`/api/tournaments/${params.id}/golfers`);
      if (res.ok) {
        const data = await res.json();
        setGolfers(data);
      }
    } catch (err) {
      console.error('Failed to fetch golfers:', err);
    }
  }

  async function handleCreateGroupFromGolfers() {
    if (golfers.length === 0) {
      setError('No golfers to create group from. Add some golfers first.');
      return;
    }

    if (!confirm(`Create a golfer group from these ${golfers.length} golfers and assign it to the tournament?`)) {
      return;
    }

    setCreatingGroup(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/tournaments/${params.id}/create-group-from-golfers`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create group');
      }

      setSuccess(`✅ ${data.message}`);
      
      // Notify create event page if this is clubhouse master tournament
      if (isClubhouseMaster) {
        window.localStorage.setItem('clubhouse_golfer_groups_updated', Date.now().toString());
        console.log('[Manage Golfers] Notified create page of new golfer group');
      }
    } catch (err: any) {
      setError(`❌ ${err.message}`);
    } finally {
      setCreatingGroup(false);
      setTimeout(() => {
        setError('');
        setSuccess('');
      }, 8000);
    }
  }

  async function handleSyncFromDataGolf() {
    if (!confirm('Sync golfers from DataGolf? This will fetch the current tournament field.')) {
      return;
    }

    setSyncing(true);
    setError('');
    setSuccess('');

    try {
      const tourParam = tournament?.tour || 'pga';
      console.log(`Syncing golfers from DataGolf for tour: ${tourParam}`);
      const res = await fetch(`/api/tournaments/${params.id}/sync-golfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tour: tourParam, replace: false }),
      });

      const data = await res.json();
      console.log('🔍 Sync API response:', data);

      if (!res.ok) {
        console.error('❌ API error:', data);
        throw new Error(data.error || data.message || 'Failed to sync golfers');
      }

      if (data.success) {
        const message = [
          `✅ Successfully synced ${data.golfersAdded} golfers!`,
          `📊 ${data.golfersCreated} new, ${data.golfersExisting} existing`,
          `👥 Golfer group: "${data.golferGroup?.name}"`,
          `🔗 Linked to ${data.competitionsLinked} competition(s)`,
          `✨ Team builder is now ready!`
        ].join('\n');
        
        setSuccess(message);
        await fetchGolfers();
      } else {
        console.error('❌ Sync failed:', data);
        throw new Error(data.error || 'Sync returned success: false');
      }
    } catch (err: any) {
      setError(`❌ ${err.message}`);
    } finally {
      setSyncing(false);
      setTimeout(() => {
        setError('');
        setSuccess('');
      }, 8000);
    }
  }

  async function searchRankings() {
    if (!browseMode && !rankingsSearch.trim()) {
      setError('Please enter a player name to search');
      return;
    }

    setLoadingRankings(true);
    setError('');

    try {
      const searchParam = browseMode ? '' : `search=${encodeURIComponent(rankingsSearch)}&`;
      const limitParam = browseMode ? 500 : 20;
      const res = await fetch(`/api/golfers/rankings?${searchParam}limit=${limitParam}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to search rankings');
      }

      setRankings(data.rankings || []);
      if (data.rankings.length === 0) {
        setError(`No players found matching "${rankingsSearch}"`);
      }
    } catch (err: any) {
      setError(`❌ ${err.message}`);
    } finally {
      setLoadingRankings(false);
    }
  }

  async function addFromRankings(ranking: any) {
    // Validate player has required data
    if (!ranking.name || ranking.name.trim() === '') {
      setError('❌ Cannot add player: missing name');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setAdding(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/tournaments/${params.id}/golfers/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ranking.name,
          country: ranking.country,
          dg_id: ranking.dgId.toString(),
          pga_tour_id: ''
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add golfer');
      }

      setSuccess(`✅ ${ranking.name} added successfully!`);
      await fetchGolfers();
      
      // Remove from search results
      setRankings(rankings.filter(r => r.dgId !== ranking.dgId));
    } catch (err: any) {
      setError(`❌ ${err.message}`);
    } finally {
      setAdding(false);
      setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
    }
  }

  async function addSelectedPlayers() {
    if (selectedPlayers.size === 0) {
      setError('Please select at least one player');
      return;
    }

    // Prevent duplicate calls
    if (isProcessingRef.current) {
      console.log('[addSelectedPlayers] Already processing, ignoring duplicate call');
      return;
    }

    isProcessingRef.current = true;
    setAdding(true);
    setError('');
    setSuccess('');

    console.log(`[addSelectedPlayers] Starting bulk add for ${selectedPlayers.size} selected players`);

    try {
      // Get set of already-added golfer DG IDs
      const golferDgIds = new Set(golfers.map(g => g.dg_id).filter(Boolean));
      
      // Filter selected players: must have valid data AND not already in tournament
      const playersToAdd = rankings.filter(r => 
        selectedPlayers.has(r.dgId) && 
        r.name && 
        r.name.trim() !== '' &&
        !golferDgIds.has(r.dgId?.toString())
      );
      
      const skippedDuplicates = Array.from(selectedPlayers).filter(dgId => {
        const player = rankings.find(r => r.dgId === dgId);
        return player && golferDgIds.has(player.dgId?.toString());
      }).length;
      
      const invalidData = Array.from(selectedPlayers).filter(dgId => {
        const player = rankings.find(r => r.dgId === dgId);
        return player && (!player.name || player.name.trim() === '');
      }).length;
      
      console.log(`[addSelectedPlayers] After validation: ${playersToAdd.length} valid players, ${skippedDuplicates} already in tournament, ${invalidData} with invalid data`);
      console.log('[addSelectedPlayers] Players to add:', playersToAdd.map(p => p.name).join(', '));
      
      if (playersToAdd.length === 0) {
        if (skippedDuplicates > 0 && invalidData === 0) {
          setError(`ℹ️ All ${skippedDuplicates} selected player(s) are already in this tournament`);
        } else if (invalidData > 0) {
          setError('❌ Selected players have invalid data (missing names)');
        } else {
          setError('❌ No valid players to add');
        }
        setAdding(false);
        isProcessingRef.current = false;
        setTimeout(() => setError(''), 5000);
        return;
      }
      
      if (skippedDuplicates > 0) {
        setSuccess(`ℹ️ Skipping ${skippedDuplicates} player(s) already in tournament, adding ${playersToAdd.length} new player(s)...`);
      }
      
      let addedCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (const player of playersToAdd) {
        try {
          const res = await fetch(`/api/tournaments/${params.id}/golfers/manual`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: player.name,
              country: player.country,
              dg_id: player.dgId.toString(),
              pga_tour_id: ''
            }),
          });

          const data = await res.json();

          if (res.ok) {
            addedCount++;
          } else {
            failedCount++;
            errors.push(`${player.name}: ${data.error || 'Unknown error'}`);
          }
        } catch (err: any) {
          failedCount++;
          errors.push(`${player.name}: ${err.message}`);
        }
      }

      if (errors.length > 0) {
        setError(`❌ Errors: ${errors.join(', ')}`);
      }
      if (addedCount > 0) {
        setSuccess(`✅ Added ${addedCount} player(s) successfully!`);
      }
      
      console.log(`[addSelectedPlayers] Complete: ${addedCount} added, ${failedCount} failed`);
      await fetchGolfers();
      
      // Clear selection and remove added players from list
      setSelectedPlayers(new Set());
      setRankings(rankings.filter(r => !selectedPlayers.has(r.dgId)));
    } catch (err: any) {
      console.error('[addSelectedPlayers] Error:', err);
      setError(`❌ ${err.message}`);
    } finally {
      setAdding(false);
      isProcessingRef.current = false;
      setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
    }
  }

  function togglePlayerSelection(dgId: number) {
    const newSelection = new Set(selectedPlayers);
    if (newSelection.has(dgId)) {
      newSelection.delete(dgId);
    } else {
      newSelection.add(dgId);
    }
    setSelectedPlayers(newSelection);
  }

  function toggleSelectAll() {
    if (selectedPlayers.size === rankings.length) {
      setSelectedPlayers(new Set());
    } else {
      setSelectedPlayers(new Set(rankings.map(r => r.dgId)));
    }
  }

  async function handleManualAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/tournaments/${params.id}/golfers/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualForm),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add golfer');
      }

      setSuccess(`✅ Golfer "${manualForm.name}" added successfully!`);
      setManualForm({ name: '', country: '', dg_id: '', pga_tour_id: '' });
      setShowManualForm(false);
      await fetchGolfers();
    } catch (err: any) {
      setError(`❌ ${err.message}`);
    } finally {
      setAdding(false);
      setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
    }
  }

  async function handleCsvUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!csvFile) {
      setError('Please select a CSV file');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('tournament_id', params.id);

      const res = await fetch('/api/tournaments/golfers/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload golfers');
      }

      setSuccess(`✅ Successfully uploaded! Added ${data.added} golfers, ${data.skipped} skipped`);
      setCsvFile(null);
      setShowCsvUpload(false);
      await fetchGolfers();
    } catch (err: any) {
      setError(`❌ ${err.message}`);
    } finally {
      setUploading(false);
      setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
    }
  }

  async function handleRemoveGolfer(golferId: string, golferName: string) {
    // Check if scorecards have been purchased
    try {
      const checkRes = await fetch(`/api/tournaments/${params.id}/golfers/check-usage?golfer_id=${golferId}`);
      if (checkRes.ok) {
        const usage = await checkRes.json();
        if (usage.hasEntries) {
          const proceed = confirm(
            `⚠️ WARNING: "${golferName}" is being used in ${usage.entryCount} scorecard(s)!\n\n` +
            `Removing this golfer may affect existing games and user entries.\n\n` +
            `Are you absolutely sure you want to proceed?`
          );
          if (!proceed) return;
        }
      }
    } catch (err) {
      console.error('Failed to check golfer usage:', err);
      // Continue with removal if check fails
    }

    if (!confirm(`Remove "${golferName}" from this tournament?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/tournaments/${params.id}/golfers?golfer_id=${golferId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSuccess(`✅ Removed ${golferName}`);
        await fetchGolfers();
      } else {
        setError('Failed to remove golfer');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
    }
  }

  function downloadCsvTemplate() {
    const template = 'name,country,dg_id,pga_tour_id\nScottie Scheffler,USA,12345,67890\nRory McIlroy,NIR,12346,67891\n';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'golfers-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading tournament data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <Link
          href={isClubhouseMaster ? '/clubhouse/events/create' : '/tournaments'}
          style={{
            color: '#60a5fa',
            textDecoration: 'none',
            fontSize: '14px',
            display: 'inline-block',
            marginBottom: '10px',
          }}
        >
          ← Back to {isClubhouseMaster ? 'Create Event' : 'Tournaments'}
        </Link>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 'bold' }}>
          Manage Golfers
        </h1>
        {isClubhouseMaster && (
          <div style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, rgba(14, 184, 166, 0.1), rgba(6, 182, 212, 0.1))',
            border: '1px solid rgba(14, 184, 166, 0.3)',
            borderRadius: '8px',
            marginBottom: '15px',
            color: '#0d9488',
            fontSize: '14px',
            fontWeight: 500,
          }}>
            🏌️ <strong>Clubhouse Master Tournament</strong> - Groups created here will be available for Clubhouse events
          </div>
        )}
        {tournament && (
          <p style={{ color: '#666', fontSize: '16px' }}>
            {tournament.name} • Status: <span style={{ 
              fontWeight: 'bold',
              color: tournament.status === 'live' ? '#10b981' : '#6b7280'
            }}>{tournament.status}</span>
          </p>
        )}
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        borderBottom: '2px solid #ddd',
        paddingBottom: '5px',
      }}>
        <Link
          href={`/tournaments/${params.id}`}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f0f0f0',
            border: '2px solid #ccc',
            borderRadius: '6px 6px 0 0',
            color: '#666',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          📋 Details
        </Link>
        <Link
          href={`/tournaments/${params.id}/manage-golfers`}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0070f3',
            border: '2px solid #0070f3',
            borderRadius: '6px 6px 0 0',
            color: 'white',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          ⛳ Manage Golfers
        </Link>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '6px',
          color: '#c00',
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          backgroundColor: '#efe',
          border: '1px solid #cfc',
          borderRadius: '6px',
          color: '#060',
        }}>
          {success}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '30px',
        flexWrap: 'wrap',
      }}>
        <button
          onClick={handleSyncFromDataGolf}
          disabled={syncing}
          style={{
            padding: '12px 24px',
            backgroundColor: syncing ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: syncing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '18px' }}>🔄</span>
          {syncing ? 'Syncing...' : 'Sync from DataGolf'}
        </button>

        <button
          onClick={handleCreateGroupFromGolfers}
          disabled={creatingGroup || golfers.length === 0}
          style={{
            padding: '12px 24px',
            backgroundColor: creatingGroup || golfers.length === 0 ? '#9ca3af' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: creatingGroup || golfers.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '18px' }}>📦</span>
          {creatingGroup ? 'Creating Group...' : `Create Group (${golfers.length})`}
        </button>

        <button
          onClick={() => {
            setShowRankingsSearch(!showRankingsSearch);
            if (!showRankingsSearch) {
              setShowManualForm(false);
              setShowCsvUpload(false);
              setBrowseMode(false);
              setRankingsSearch('');
              setRankings([]);
              setSelectedPlayers(new Set());
            }
          }}
          style={{
            padding: '12px 24px',
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '18px' }}>🔍</span>
          Browse & Search Players
        </button>

        <button
          onClick={() => {
            setShowManualForm(!showManualForm);
            if (!showManualForm) {
              setShowRankingsSearch(false);
              setShowCsvUpload(false);
            }
          }}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '18px' }}>➕</span>
          Add Golfer Manually
        </button>

        <button
          onClick={() => {
            setShowCsvUpload(!showCsvUpload);
            if (!showCsvUpload) {
              setShowRankingsSearch(false);
              setShowManualForm(false);
            }
          }}
          style={{
            padding: '12px 24px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '18px' }}>📤</span>
          Bulk Upload CSV
        </button>
      </div>

      {/* Rankings Search */}
      {showRankingsSearch && (
        <div style={{
          backgroundColor: '#f9fafb',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '30px',
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>
            Browse & Search Top 500 Ranked Players
          </h3>
          <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
              <strong>🏆 DataGolf Rankings:</strong> {browseMode ? 'Browse all 500 players or search by name' : 'Search from the world\'s top 500 players with current rankings and skill estimates'}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
            <button
              onClick={async () => {
                const newBrowseMode = !browseMode;
                setBrowseMode(newBrowseMode);
                if (newBrowseMode) {
                  setRankingsSearch('');
                  setLoadingRankings(true);
                  setError('');
                  try {
                    const res = await fetch(`/api/golfers/rankings?limit=500`);
                    const data = await res.json();
                    if (res.ok) {
                      setRankings(data.rankings || []);
                    } else {
                      setError(data.error || 'Failed to load rankings');
                    }
                  } catch (err: any) {
                    setError(`❌ ${err.message}`);
                  } finally {
                    setLoadingRankings(false);
                  }
                } else {
                  setRankings([]);
                }
              }}
              disabled={loadingRankings}
              style={{
                padding: '10px 20px',
                backgroundColor: loadingRankings ? '#9ca3af' : (browseMode ? '#10b981' : '#6b7280'),
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loadingRankings ? 'not-allowed' : 'pointer',
              }}
            >
              {loadingRankings ? 'Loading...' : (browseMode ? '✓ Browse All 500' : 'Browse All 500')}
            </button>
            
            {!browseMode && (
              <>
                <input
                  type="text"
                  value={rankingsSearch}
                  onChange={(e) => setRankingsSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchRankings()}
                  placeholder="Enter player name (e.g., Scottie Scheffler)"
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#111827',
                  }}
                />
                <button
                  onClick={searchRankings}
                  disabled={loadingRankings}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: loadingRankings ? '#9ca3af' : '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: loadingRankings ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loadingRankings ? 'Searching...' : 'Search'}
                </button>
              </>
            )}
            
            <button
              onClick={() => {
                setShowRankingsSearch(false);
                setBrowseMode(false);
                setRankingsSearch('');
                setRankings([]);
                setSelectedPlayers(new Set());
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>

          {rankings.length > 0 && (
            <>
              {(() => {
                // Filter out golfers already in tournament
                const golferDgIds = new Set(golfers.map(g => g.dg_id).filter(Boolean));
                const availableRankings = rankings.filter(r => !golferDgIds.has(r.dgId?.toString()));
                const alreadyAddedCount = rankings.length - availableRankings.length;
                
                return (
                  <>
                    {alreadyAddedCount > 0 && (
                      <div style={{ marginBottom: '15px', padding: '10px', background: '#fef3c7', borderRadius: '6px', fontSize: '13px', color: '#92400e' }}>
                        <strong>ℹ️</strong> {alreadyAddedCount} player(s) already added to this tournament (hidden from list)
                      </div>
                    )}
                    
                    {availableRankings.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', background: '#f9fafb', borderRadius: '6px' }}>
                        ✅ All players from this search are already in the tournament
                      </div>
                    ) : (
                      <>
              {browseMode && selectedPlayers.size > 0 && (
                <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#dbeafe', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#1e40af', fontWeight: 600 }}>
                    {selectedPlayers.size} player(s) selected
                  </span>
                  <button
                    onClick={addSelectedPlayers}
                    disabled={adding}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: adding ? '#9ca3af' : '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: adding ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {adding ? 'Adding...' : `Add Selected (${selectedPlayers.size})`}
                  </button>
                </div>
              )}
              
              <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f3f4f6', position: 'sticky', top: 0, zIndex: 10 }}>
                    <tr>
                      {browseMode && (
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                          <input
                            type="checkbox"
                            checked={selectedPlayers.size === availableRankings.length && availableRankings.length > 0}
                            onChange={toggleSelectAll}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                        </th>
                      )}
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#374151' }}>Rank</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#374151' }}>Player</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#374151' }}>Country</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#374151' }}>Tour</th>
                      {!browseMode && (
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '13px', color: '#374151' }}>Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {availableRankings.map((ranking) => (
                      <tr key={ranking.dgId} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: selectedPlayers.has(ranking.dgId) ? '#eff6ff' : 'white' }}>
                        {browseMode && (
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={selectedPlayers.has(ranking.dgId)}
                              onChange={() => togglePlayerSelection(ranking.dgId)}
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                          </td>
                        )}
                        <td style={{ padding: '12px', fontSize: '14px' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#059669' }}>#{ranking.dgRank}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>OWGR: {ranking.owgrRank}</div>
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', fontWeight: 500, color: '#111827' }}>{ranking.name}</td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>{ranking.country}</td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>{ranking.tour}</td>
                        {!browseMode && (
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              onClick={() => addFromRankings(ranking)}
                              disabled={adding}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: adding ? '#9ca3af' : '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: adding ? 'not-allowed' : 'pointer',
                              }}
                            >
                              Add
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                      </>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* Manual Add Form */}
      {showManualForm && (
        <div style={{
          backgroundColor: '#f9fafb',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '30px',
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold' }}>
            Add Golfer Manually
          </h3>
          <form onSubmit={handleManualAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '14px' }}>
                  Name <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  placeholder="e.g., Scottie Scheffler"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '14px' }}>
                  Country
                </label>
                <input
                  type="text"
                  value={manualForm.country}
                  onChange={(e) => setManualForm({ ...manualForm, country: e.target.value })}
                  placeholder="e.g., USA"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '14px' }}>
                  DataGolf ID
                </label>
                <input
                  type="text"
                  value={manualForm.dg_id}
                  onChange={(e) => setManualForm({ ...manualForm, dg_id: e.target.value })}
                  placeholder="Optional"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, fontSize: '14px' }}>
                  PGA Tour ID
                </label>
                <input
                  type="text"
                  value={manualForm.pga_tour_id}
                  onChange={(e) => setManualForm({ ...manualForm, pga_tour_id: e.target.value })}
                  placeholder="Optional"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={adding}
                style={{
                  padding: '10px 20px',
                  backgroundColor: adding ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: adding ? 'not-allowed' : 'pointer',
                }}
              >
                {adding ? 'Adding...' : 'Add Golfer'}
              </button>
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CSV Upload Form */}
      {showCsvUpload && (
        <div style={{
          backgroundColor: '#f9fafb',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '30px',
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 'bold' }}>
            Bulk Upload Golfers via CSV
          </h3>
          <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#dbeafe', borderRadius: '6px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e40af' }}>
              <strong>CSV Format:</strong> name, country, dg_id, pga_tour_id
            </p>
            <button
              onClick={downloadCsvTemplate}
              style={{
                padding: '6px 12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📥 Download Template
            </button>
          </div>
          <form onSubmit={handleCsvUpload}>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                style={{
                  padding: '10px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '6px',
                  width: '100%',
                  fontSize: '14px',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={uploading || !csvFile}
                style={{
                  padding: '10px 20px',
                  backgroundColor: uploading || !csvFile ? '#9ca3af' : '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: uploading || !csvFile ? 'not-allowed' : 'pointer',
                }}
              >
                {uploading ? 'Uploading...' : 'Upload & Add Golfers'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCsvUpload(false);
                  setCsvFile(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Golfers List */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
            Tournament Golfers ({golfers.length})
          </h2>
          {golfers.length > 0 && (
            <button
              onClick={async () => {
                if (!confirm(`Remove all ${golfers.length} golfers from this tournament?`)) {
                  return;
                }
                setError('');
                setSuccess('');
                try {
                  let removedCount = 0;
                  for (const golfer of golfers) {
                    const res = await fetch(`/api/tournaments/${params.id}/golfers?golfer_id=${golfer.id}`, {
                      method: 'DELETE',
                    });
                    if (res.ok) removedCount++;
                  }
                  setSuccess(`✅ Removed ${removedCount} golfer(s)`);
                  await fetchGolfers();
                } catch (err: any) {
                  setError(`❌ ${err.message}`);
                }
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🗑️ Clear All
            </button>
          )}
        </div>

        {golfers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            <p style={{ fontSize: '18px', marginBottom: '10px' }}>No golfers added yet</p>
            <p style={{ fontSize: '14px' }}>Use one of the buttons above to add golfers to this tournament</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', borderBottom: '1px solid #e5e7eb', color: '#111827' }}>
                    Name
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', borderBottom: '1px solid #e5e7eb', color: '#111827' }}>
                    Country
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', borderBottom: '1px solid #e5e7eb', color: '#111827' }}>
                    DataGolf ID
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', borderBottom: '1px solid #e5e7eb', color: '#111827' }}>
                    PGA Tour ID
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '1px solid #e5e7eb', color: '#111827' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {golfers.map((golfer) => (
                  <tr key={golfer.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#111827' }}>
                      {golfer.name}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                      {golfer.country || '-'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280', fontFamily: 'monospace' }}>
                      {golfer.dg_id || '-'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280', fontFamily: 'monospace' }}>
                      {golfer.pga_tour_id || '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleRemoveGolfer(golfer.id, golfer.name)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
