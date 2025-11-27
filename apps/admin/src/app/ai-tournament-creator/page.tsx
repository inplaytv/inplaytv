'use client';

import { useState, useEffect } from 'react';
import RequireAdmin from '@/components/RequireAdmin';
import styles from './ai-tournament-creator.module.css';

interface TournamentSuggestion {
  id: string;
  name: string;
  tour: 'PGA' | 'LPGA' | 'European';
  startDate: string;
  endDate: string;
  location: string;
  venue: string;
  selected: boolean;
  created?: boolean;
  aiGenerated?: {
    slug: string;
    competitions: Array<{
      name: string;
      type: string;
      entryFee: number;
      entrantsCap: number;
      adminFeePercent: number;
      regOpenAt: string;
      regCloseAt: string;
    }>;
    suggestedGolferGroup: string;
    imageUrl: string;
  };
}

export default function AITournamentCreatorPage() {
  const [upcomingTournaments, setUpcomingTournaments] = useState<TournamentSuggestion[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<TournamentSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<TournamentSuggestion | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tourFilter, setTourFilter] = useState<'All' | 'PGA' | 'LPGA' | 'European'>('All');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Function to update competition values
  const updateCompetitionValue = (index: number, field: string, value: any) => {
    if (!selectedTournament?.aiGenerated) return;
    
    console.log(`✏️ Updating competition ${index} - ${field}: ${value}`);
    
    const updatedCompetitions = [...selectedTournament.aiGenerated.competitions];
    updatedCompetitions[index] = {
      ...updatedCompetitions[index],
      [field]: value,
    };
    
    setSelectedTournament({
      ...selectedTournament,
      aiGenerated: {
        ...selectedTournament.aiGenerated,
        competitions: updatedCompetitions,
      },
    });
  };

  useEffect(() => {
    fetchUpcomingTournaments();
  }, []);

  useEffect(() => {
    // Apply search and filters
    let filtered = upcomingTournaments;

    // Tour filter
    if (tourFilter !== 'All') {
      filtered = filtered.filter(t => t.tour === tourFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.location.toLowerCase().includes(query) ||
        t.venue.toLowerCase().includes(query) ||
        t.tour.toLowerCase().includes(query)
      );
    }

    setFilteredTournaments(filtered);
  }, [upcomingTournaments, searchQuery, tourFilter]);

  async function fetchUpcomingTournaments(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      // Add cache-busting timestamp for manual refresh
      const url = isRefresh 
        ? `/api/ai/upcoming-tournaments?refresh=${Date.now()}`
        : '/api/ai/upcoming-tournaments';
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        // Check which tournaments already exist in database
        const existingRes = await fetch('/api/tournaments');
        const existingData = await existingRes.json();
        
        // Get existing tournament names (normalized for comparison)
        const existingNames = new Set(
          (Array.isArray(existingData) ? existingData : existingData.tournaments || [])
            .map((t: any) => t.name.toLowerCase().trim())
        );
        
        console.log('📋 Existing tournaments in DB:', Array.from(existingNames));
        
        setUpcomingTournaments(data.tournaments.map((t: any) => {
          const isCreated = existingNames.has(t.name.toLowerCase().trim());
          if (isCreated) {
            console.log('✅ Tournament already created:', t.name);
          }
          return {
            ...t,
            selected: false,
            created: isCreated,
          };
        }));
      }
    } catch (error) {
      console.error('Failed to fetch upcoming tournaments:', error);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }

  async function generateAISuggestions(tournament: TournamentSuggestion) {
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament }),
      });

      const data = await res.json();
      
      if (data.success) {
        setSelectedTournament({
          ...tournament,
          aiGenerated: data.generation,
        });
        setShowPreview(true);
      } else {
        alert('Failed to generate AI suggestions: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      alert('Failed to generate AI suggestions');
    } finally {
      setGenerating(false);
    }
  }

  async function createTournament() {
    if (!selectedTournament?.aiGenerated) return;

    console.log('🚀 Creating tournament with competitions:', selectedTournament.aiGenerated.competitions);

    try {
      const res = await fetch('/api/ai/create-tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament: {
            name: selectedTournament.name,
            slug: selectedTournament.aiGenerated.slug,
            tour: selectedTournament.tour,
            startDate: selectedTournament.startDate,
            endDate: selectedTournament.endDate,
            location: selectedTournament.location,
            venue: selectedTournament.venue,
            imageUrl: selectedTournament.aiGenerated.imageUrl,
          },
          competitions: selectedTournament.aiGenerated.competitions,
          golferGroup: selectedTournament.aiGenerated.suggestedGolferGroup,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        console.log('✅ Tournament created successfully:', data);
        
        // Mark tournament as created
        setUpcomingTournaments(prev => prev.map(t => 
          t.id === selectedTournament.id ? { ...t, created: true } : t
        ));
        
        // Show success message with tournament details
        const message = `✅ Tournament created successfully!\n\n` +
          `📋 ${data.tournament.name}\n` +
          `🏆 ${data.tournament.competitionsCreated} competitions added\n` +
          `🏌️ ${data.tournament.golfersAdded || 0} golfers added\n\n` +
          `Redirecting to Tournaments page...`;
        
        alert(message);
        setShowPreview(false);
        setSelectedTournament(null);
        
        // Redirect to tournaments list to immediately see the created tournament
        window.location.href = '/tournaments';
      } else {
        throw new Error(data.error || 'Failed to create tournament');
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      alert('Failed to create tournament: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const notCreated = filteredTournaments.filter(t => !t.created);
    setSelectedIds(new Set(notCreated.map(t => t.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const getTourBadgeColor = (tour: string) => {
    switch (tour) {
      case 'PGA':
        return '#3b82f6';
      case 'LPGA':
        return '#ec4899';
      case 'European':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <RequireAdmin>
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading upcoming tournaments...</p>
          </div>
        </div>
      </RequireAdmin>
    );
  }

  return (
    <RequireAdmin>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>🤖 AI Tournament Creator</h1>
            <p className={styles.subtitle}>
              Search and select upcoming tournaments automatically
            </p>
          </div>
          <button 
            onClick={() => fetchUpcomingTournaments(true)} 
            className={styles.refreshBtn}
            disabled={refreshing}
          >
            <i className={`fas fa-sync-alt ${refreshing ? styles.spinning : ''}`}></i>
            {refreshing ? 'Refreshing...' : 'Refresh Tournaments'}
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search tournaments, locations, or venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className={styles.clearBtn}>
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>

          {/* Tour Filter Tabs */}
          <div className={styles.tourTabs}>
            {(['All', 'PGA', 'LPGA', 'European'] as const).map(tour => (
              <button
                key={tour}
                onClick={() => setTourFilter(tour)}
                className={`${styles.tourTab} ${tourFilter === tour ? styles.active : ''}`}
              >
                {tour === 'All' ? `All Tours (${upcomingTournaments.length})` : `${tour} (${upcomingTournaments.filter(t => t.tour === tour).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Batch Actions Bar */}
        {selectedIds.size > 0 && (
          <div className={styles.batchActionsBar}>
            <span className={styles.selectionCount}>
              <i className="fas fa-check-square"></i>
              {selectedIds.size} tournament{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <div className={styles.batchActions}>
              <button onClick={deselectAll} className={styles.batchBtn}>
                <i className="fas fa-times"></i>
                Clear Selection
              </button>
              <button 
                onClick={() => {
                  selectedIds.forEach(id => {
                    const tournament = upcomingTournaments.find(t => t.id === id);
                    if (tournament && !tournament.created) {
                      generateAISuggestions(tournament);
                    }
                  });
                }}
                className={styles.batchBtn}
                disabled={generating}
              >
                <i className="fas fa-magic"></i>
                Generate All Selected
              </button>
            </div>
          </div>
        )}

        {/* Results Info */}
        <div className={styles.resultsInfo}>
          <span>
            Showing {filteredTournaments.length} of {upcomingTournaments.length} tournaments
            {filteredTournaments.filter(t => t.created).length > 0 && (
              <span style={{ marginLeft: '1rem', color: '#10b981' }}>
                ({filteredTournaments.filter(t => t.created).length} already created)
              </span>
            )}
          </span>
          {filteredTournaments.length > 0 && !selectedIds.size && (
            <button onClick={selectAll} className={styles.selectAllBtn}>
              <i className="fas fa-check-double"></i>
              Select All Available
            </button>
          )}
        </div>

        {/* Tournament Grid */}
        {filteredTournaments.length === 0 ? (
          <div className={styles.noResults}>
            <i className="fas fa-search" style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '1rem' }}></i>
            <p>No tournaments found matching your search</p>
            <button onClick={() => { setSearchQuery(''); setTourFilter('All'); }} className={styles.resetBtn}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className={styles.tournamentGrid}>
            {filteredTournaments.map((tournament) => (
              <div key={tournament.id} className={`${styles.tournamentCard} ${selectedIds.has(tournament.id) ? styles.selected : ''}`}>
                {/* Selection Checkbox */}
                {!tournament.created && (
                  <div className={styles.selectionCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(tournament.id)}
                      onChange={() => toggleSelection(tournament.id)}
                      id={`select-${tournament.id}`}
                    />
                    <label htmlFor={`select-${tournament.id}`}></label>
                  </div>
                )}
              {/* Tour Badge */}
              <div
                className={styles.tourBadge}
                style={{ background: getTourBadgeColor(tournament.tour) }}
              >
                {tournament.tour} TOUR
              </div>

              {/* Created Badge */}
              {tournament.created && (
                <div className={styles.createdBadge}>
                  <i className="fas fa-check-circle"></i>
                  <span>Created</span>
                </div>
              )}

              {/* Tournament Info */}
              <div className={styles.cardContent}>
                <h3 className={styles.tournamentName}>{tournament.name}</h3>
                <div className={styles.tournamentDetails}>
                  <div className={styles.detail}>
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{tournament.location}</span>
                  </div>
                  <div className={styles.detail}>
                    <i className="fas fa-golf-ball"></i>
                    <span>{tournament.venue}</span>
                  </div>
                  <div className={styles.detail}>
                    <i className="fas fa-calendar"></i>
                    <span>
                      {new Date(tournament.startDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}{' '}
                      -{' '}
                      {new Date(tournament.endDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => generateAISuggestions(tournament)}
                className={styles.generateBtn}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Generating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-magic"></i>
                    Generate with AI
                  </>
                )}
              </button>
              </div>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && selectedTournament?.aiGenerated && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>AI Generated Tournament</h2>
                <button onClick={() => setShowPreview(false)} className={styles.closeBtn}>
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className={styles.modalBody}>
                {/* Tournament Overview */}
                <div className={styles.section}>
                  <h3>Tournament Details</h3>
                  <div className={styles.previewGrid}>
                    <div className={styles.previewItem}>
                      <label>Name:</label>
                      <span>{selectedTournament.name}</span>
                    </div>
                    <div className={styles.previewItem}>
                      <label>Slug:</label>
                      <span className={styles.slug}>{selectedTournament.aiGenerated.slug}</span>
                    </div>
                    <div className={styles.previewItem}>
                      <label>Location:</label>
                      <span>{selectedTournament.location}</span>
                    </div>
                    <div className={styles.previewItem}>
                      <label>Suggested Golfer Group:</label>
                      <span>{selectedTournament.aiGenerated.suggestedGolferGroup}</span>
                    </div>
                  </div>
                </div>

                {/* Competitions */}
                <div className={styles.section}>
                  <h3>Auto-Generated Competitions ({selectedTournament.aiGenerated.competitions.length})</h3>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>
                    You can edit the values below before creating the tournament
                  </p>
                  <div className={styles.competitionsList}>
                    {selectedTournament.aiGenerated.competitions.map((comp, index) => (
                      <div key={index} className={styles.competitionCard}>
                        <div className={styles.compHeader}>
                          <h4>{comp.name}</h4>
                          <span className={styles.compType}>{comp.type}</span>
                        </div>
                        <div className={styles.compDetails}>
                          <div className={styles.compStat}>
                            <label>Entry Fee (£):</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={comp.entryFee}
                              onChange={(e) => updateCompetitionValue(index, 'entryFee', parseFloat(e.target.value) || 0)}
                              className={styles.editInput}
                            />
                          </div>
                          <div className={styles.compStat}>
                            <label>Max Entries:</label>
                            <input
                              type="number"
                              min="1"
                              value={comp.entrantsCap}
                              onChange={(e) => updateCompetitionValue(index, 'entrantsCap', parseInt(e.target.value) || 0)}
                              className={styles.editInput}
                            />
                          </div>
                          <div className={styles.compStat}>
                            <label>Admin Fee (%):</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={comp.adminFeePercent}
                              onChange={(e) => updateCompetitionValue(index, 'adminFeePercent', parseFloat(e.target.value) || 0)}
                              className={styles.editInput}
                            />
                          </div>
                          <div className={styles.compStat}>
                            <label>Reg Opens:</label>
                            <span>{new Date(comp.regOpenAt).toLocaleString('en-GB')}</span>
                          </div>
                          <div className={styles.compStat}>
                            <label>Reg Closes:</label>
                            <span>{new Date(comp.regCloseAt).toLocaleString('en-GB')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tournament Image Preview */}
                {selectedTournament.aiGenerated.imageUrl && (
                  <div className={styles.section}>
                    <h3>Tournament Image</h3>
                    <img
                      src={selectedTournament.aiGenerated.imageUrl}
                      alt={selectedTournament.name}
                      className={styles.previewImage}
                    />
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button onClick={() => setShowPreview(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button onClick={createTournament} className={styles.createBtn}>
                  <i className="fas fa-check"></i>
                  Create Tournament & Competitions
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireAdmin>
  );
}
