'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TIMEZONES, DEFAULT_TIMEZONE } from '@/lib/timezones';

interface Tournament {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  timezone: string;
  start_date: string;
  end_date: string;
  status: string;
  external_id: string | null;
  image_url: string | null;
}

interface CompetitionType {
  id: string;
  name: string;
  slug: string;
  is_template: boolean;
  default_entry_fee_pennies: number | null;
  default_entrants_cap: number | null;
  default_admin_fee_percent: number | null;
  default_reg_open_days_before: number | null;
}

interface TournamentCompetition {
  id: string;
  tournament_id: string;
  competition_type_id: string;
  entry_fee_pennies: number;
  entrants_cap: number;
  admin_fee_percent: number;
  golfer_group_id: string | null;
  reg_open_at: string | null;
  reg_close_at: string | null;
  start_at: string | null;
  end_at: string | null;
  status: string;
  competition_types: CompetitionType;
}

interface Golfer {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  image_url: string | null;
  external_id: string | null;
}

interface GolferGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  golfer_count?: number;
}

export default function EditTournamentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [competitions, setCompetitions] = useState<TournamentCompetition[]>([]);
  const [availableTypes, setAvailableTypes] = useState<CompetitionType[]>([]);
  const [golferGroups, setGolferGroups] = useState<GolferGroup[]>([]);
  const [allGolferGroups, setAllGolferGroups] = useState<GolferGroup[]>([]);
  const [showAddCompetition, setShowAddCompetition] = useState(false);
  const [editingCompetitionId, setEditingCompetitionId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    location: '',
    timezone: 'Europe/London',
    start_date: '',
    end_date: '',
    status: 'draft',
    external_id: '',
    image_url: '',
  });

  const [competitionFormData, setCompetitionFormData] = useState({
    competition_type_id: '',
    entry_fee_pounds: '0.00', // Changed to pounds for UI
    entrants_cap: '0',
    admin_fee_percent: '10.00', // Default value, will be loaded from settings
    golfer_group_id: '', // NEW - golfer group for this competition
    reg_open_at: '',
    reg_close_at: '',
    start_at: '',
    end_at: '',
    status: 'draft',
  });

  const [manualRegClose, setManualRegClose] = useState(false);
  const [showRegCloseWarning, setShowRegCloseWarning] = useState(false);

  // Auto-calculate reg_close_at when start_at changes
  useEffect(() => {
    if (competitionFormData.start_at && !manualRegClose) {
      const startDate = new Date(competitionFormData.start_at);
      const closeDate = new Date(startDate.getTime() - 15 * 60000); // 15 minutes before
      const closeString = closeDate.toISOString().slice(0, 16);
      setCompetitionFormData(prev => ({ ...prev, reg_close_at: closeString }));
    }
  }, [competitionFormData.start_at, manualRegClose]);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [tournamentRes, competitionsRes, typesRes, groupsRes, allGroupsRes] = await Promise.all([
        fetch(`/api/tournaments/${params.id}`),
        fetch(`/api/tournaments/${params.id}/competitions`),
        fetch('/api/competition-types'),
        fetch(`/api/tournaments/${params.id}/golfer-groups`),
        fetch('/api/golfer-groups'),
      ]);

      if (tournamentRes.ok) {
        const tournamentData = await tournamentRes.json();
        setTournament(tournamentData);
        setFormData({
          name: tournamentData.name,
          slug: tournamentData.slug,
          description: tournamentData.description || '',
          location: tournamentData.location || '',
          timezone: tournamentData.timezone,
          start_date: tournamentData.start_date ? tournamentData.start_date.slice(0, 16) : '',
          end_date: tournamentData.end_date ? tournamentData.end_date.slice(0, 16) : '',
          status: tournamentData.status,
          external_id: tournamentData.external_id || '',
          image_url: tournamentData.image_url || '',
        });
      }

      if (competitionsRes.ok) {
        const competitionsData = await competitionsRes.json();
        setCompetitions(competitionsData);
      }

      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setAvailableTypes(typesData);
      }

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGolferGroups(groupsData);
      }

      if (allGroupsRes.ok) {
        const allGroupsData = await allGroupsRes.json();
        setAllGolferGroups(allGroupsData);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await fetch(`/api/tournaments/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setTournament(data);
        setSuccess('Tournament updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update tournament');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const url = editingCompetitionId
        ? `/api/tournaments/${params.id}/competitions?competitionId=${editingCompetitionId}`
        : `/api/tournaments/${params.id}/competitions`;
      const method = editingCompetitionId ? 'PUT' : 'POST';

      // Convert pounds to pennies for API
      const dataToSend = {
        ...competitionFormData,
        entry_fee_pennies: Math.round(parseFloat(competitionFormData.entry_fee_pounds) * 100),
      };
      // Remove the pounds field as API expects pennies
      const { entry_fee_pounds, ...apiData } = dataToSend as any;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      if (res.ok) {
        await fetchData();
        setShowAddCompetition(false);
        setEditingCompetitionId(null);
        setManualRegClose(false);
        setCompetitionFormData({
          competition_type_id: '',
          entry_fee_pounds: '0.00',
          entrants_cap: '0',
          admin_fee_percent: '10.00',
          golfer_group_id: '',
          reg_open_at: '',
          reg_close_at: '',
          start_at: '',
          end_at: '',
          status: 'draft',
        });
        setSuccess(editingCompetitionId ? 'Competition updated' : 'Competition added');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save competition');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditCompetition = (comp: TournamentCompetition) => {
    setEditingCompetitionId(comp.id);
    setManualRegClose(false); // Reset manual flag when editing
    setCompetitionFormData({
      competition_type_id: comp.competition_type_id,
      entry_fee_pounds: (comp.entry_fee_pennies / 100).toFixed(2), // Convert pennies to pounds
      entrants_cap: comp.entrants_cap.toString(),
      admin_fee_percent: comp.admin_fee_percent.toString(),
      golfer_group_id: comp.golfer_group_id || '',
      reg_open_at: comp.reg_open_at ? comp.reg_open_at.slice(0, 16) : '',
      reg_close_at: comp.reg_close_at ? comp.reg_close_at.slice(0, 16) : '',
      start_at: comp.start_at ? comp.start_at.slice(0, 16) : '',
      end_at: comp.end_at ? comp.end_at.slice(0, 16) : '',
      status: comp.status,
    });
    setShowAddCompetition(true);
  };

  const handleDeleteCompetition = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from this tournament?`)) return;

    try {
      const res = await fetch(`/api/tournaments/${params.id}/competitions?competitionId=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchData();
        setSuccess('Competition removed');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        alert('Failed to delete');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const calculatePrizePool = (entrants: number, entryFeePennies: number, adminFeePercent: number) => {
    const gross = entrants * entryFeePennies;
    const adminFee = Math.round(gross * (adminFeePercent / 100));
    const netPrize = gross - adminFee;
    return { gross, adminFee, netPrize };
  };

  const formatPennies = (pennies: number) => {
    return `£${(pennies / 100).toFixed(2)}`;
  };

  const handleAddGolferGroup = async (groupId: string) => {
    try {
      const res = await fetch(`/api/tournaments/${params.id}/golfer-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId }),
      });

      if (res.ok) {
        await fetchData();
        setSuccess('Golfer group added to tournament');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add golfer group');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Network error');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleRemoveGolferGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Remove "${groupName}" group from this tournament?`)) return;

    try {
      const res = await fetch(`/api/tournaments/${params.id}/golfer-groups?group_id=${groupId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchData();
        setSuccess('Golfer group removed');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        alert('Failed to remove golfer group');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  if (!tournament) {
    return <div style={{ padding: '2rem' }}>Tournament not found</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/tournaments"
          style={{
            color: '#60a5fa',
            textDecoration: 'none',
            fontSize: '0.875rem',
            display: 'inline-block',
            marginBottom: '1rem',
          }}
        >
          ← Back to Tournaments
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{tournament.name}</h1>
      </div>

      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '6px',
          color: '#f87171',
          marginBottom: '1.5rem',
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '6px',
          color: '#10b981',
          marginBottom: '1.5rem',
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem' }}>Basic Information</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Tournament Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '0.625rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                color: '#fff',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Timezone *
              </label>
              <select
                required
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem' }}>Dates & Times</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Start Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                End Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
              />
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem' }}>Settings</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Status *
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
              >
                <option value="draft">Draft</option>
                <option value="upcoming">Upcoming</option>
                <option value="reg_open">Registration Open</option>
                <option value="reg_closed">Registration Closed</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                External ID
              </label>
              <input
                type="text"
                value={formData.external_id}
                onChange={(e) => setFormData({ ...formData, external_id: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
              Image URL
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              style={{
                width: '100%',
                padding: '0.625rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                color: '#fff',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.625rem 1.5rem',
              background: saving ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.9)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.9375rem',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Competition Types Section */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Competitions</h2>
          {!showAddCompetition && availableTypes.length > 0 && (
            <button
              onClick={() => {
                setShowAddCompetition(true);
                setManualRegClose(false);
                setShowRegCloseWarning(false);
                // Pre-populate competition dates from tournament
                if (tournament) {
                  setCompetitionFormData(prev => ({
                    ...prev,
                    start_at: tournament.start_date.slice(0, 16),
                    end_at: tournament.end_date.slice(0, 16),
                  }));
                }
              }}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '4px',
                color: '#10b981',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Add Competition
            </button>
          )}
        </div>

        {/* Show message if no competition types available */}
        {!showAddCompetition && availableTypes.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>
            No competition types exist yet. <Link href="/competition-types" style={{ color: '#60a5fa', textDecoration: 'underline' }}>Create competition types</Link> first, then add them to this tournament.
          </p>
        )}

        {showAddCompetition && (
          <form onSubmit={handleAddCompetition} style={{
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            padding: '1rem',
            marginBottom: '1rem',
          }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}>
              {editingCompetitionId ? 'Edit Competition' : 'Add Competition'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                  Competition Type *
                </label>
                <select
                  required
                  disabled={!!editingCompetitionId}
                  value={competitionFormData.competition_type_id}
                  onChange={(e) => {
                    const selectedTypeId = e.target.value;
                    const selectedType = availableTypes.find(t => t.id === selectedTypeId);
                    
                    // Auto-populate template values if available
                    if (selectedType && selectedType.is_template) {
                      const regOpenAt = selectedType.default_reg_open_days_before && tournament
                        ? new Date(new Date(tournament.start_date).getTime() - (selectedType.default_reg_open_days_before * 24 * 60 * 60 * 1000)).toISOString().slice(0, 16)
                        : competitionFormData.reg_open_at;
                      
                      setCompetitionFormData({
                        ...competitionFormData,
                        competition_type_id: selectedTypeId,
                        entry_fee_pounds: selectedType.default_entry_fee_pennies !== null
                          ? (selectedType.default_entry_fee_pennies / 100).toFixed(2)
                          : competitionFormData.entry_fee_pounds,
                        entrants_cap: selectedType.default_entrants_cap !== null
                          ? selectedType.default_entrants_cap.toString()
                          : competitionFormData.entrants_cap,
                        admin_fee_percent: selectedType.default_admin_fee_percent !== null
                          ? selectedType.default_admin_fee_percent.toString()
                          : competitionFormData.admin_fee_percent,
                        reg_open_at: regOpenAt,
                      });
                    } else {
                      setCompetitionFormData({ ...competitionFormData, competition_type_id: selectedTypeId });
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    color: '#fff',
                  }}
                >
                  <option value="">Select type...</option>
                  {availableTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}{type.is_template ? ' ⚡' : ''}
                    </option>
                  ))}
                </select>
                {competitionFormData.competition_type_id && availableTypes.find(t => t.id === competitionFormData.competition_type_id)?.is_template && (
                  <p style={{ fontSize: '0.75rem', color: 'rgba(16, 185, 129, 0.9)', marginTop: '0.25rem' }}>
                    ⚡ Template values auto-populated
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                  Entry Fee (£) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={competitionFormData.entry_fee_pounds}
                  onChange={(e) => setCompetitionFormData({ ...competitionFormData, entry_fee_pounds: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    color: '#fff',
                  }}
                  placeholder="e.g., 10.00"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                  Entrants Cap *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={competitionFormData.entrants_cap}
                  onChange={(e) => setCompetitionFormData({ ...competitionFormData, entrants_cap: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    color: '#fff',
                  }}
                  placeholder="0 for unlimited"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                  Admin Fee (%) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  value={competitionFormData.admin_fee_percent}
                  onChange={(e) => setCompetitionFormData({ ...competitionFormData, admin_fee_percent: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    color: '#fff',
                  }}
                  placeholder="e.g., 10.00"
                />
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                  Platform fee deducted from prize pool
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Golfer Group
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                  (Required for non-draft status)
                </span>
              </label>
              <select
                value={competitionFormData.golfer_group_id || ''}
                onChange={(e) => setCompetitionFormData({ ...competitionFormData, golfer_group_id: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
              >
                <option value="">No group selected</option>
                {golferGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name} {group.golfer_count ? `(${group.golfer_count} golfers)` : ''}
                  </option>
                ))}
              </select>
              {golferGroups.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem' }}>
                  ⚠️ Add golfer groups to this tournament first
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                  Status *
                </label>
                <select
                  required
                  value={competitionFormData.status}
                  onChange={(e) => setCompetitionFormData({ ...competitionFormData, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    color: '#fff',
                  }}
                >
                  <option value="draft">Draft</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="reg_open">Registration Open</option>
                  <option value="reg_closed">Registration Closed</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {competitionFormData.status !== 'draft' && !competitionFormData.golfer_group_id && (
                  <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
                    ⚠️ Competition needs a golfer group to be non-draft status
                  </p>
                )}
              </div>
            </div>

            {/* Prize Pool Calculator */}
            {competitionFormData.entry_fee_pounds && parseFloat(competitionFormData.entry_fee_pounds) > 0 && tournament && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                padding: '1rem',
                marginBottom: '1rem',
              }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#10b981' }}>
                  💰 Prize Pool Calculator
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  {[50, 100, 200].map((entrants) => {
                    const entryFeePennies = Math.round(parseFloat(competitionFormData.entry_fee_pounds) * 100);
                    const { gross, adminFee, netPrize } = calculatePrizePool(
                      entrants,
                      entryFeePennies,
                      parseFloat(competitionFormData.admin_fee_percent)
                    );
                    return (
                      <div key={entrants} style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '4px',
                        padding: '0.75rem',
                      }}>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.375rem' }}>
                          {entrants} Entrants
                        </div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#10b981', marginBottom: '0.25rem' }}>
                          {formatPennies(netPrize)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
                          Gross: {formatPennies(gross)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
                          Admin Fee: {formatPennies(adminFee)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.75rem', marginBottom: 0 }}>
                  Based on {competitionFormData.admin_fee_percent}% admin fee • Entry: £{parseFloat(competitionFormData.entry_fee_pounds).toFixed(2)}
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                  Registration Opens
                </label>
                <input
                  type="datetime-local"
                  value={competitionFormData.reg_open_at}
                  onChange={(e) => setCompetitionFormData({ ...competitionFormData, reg_open_at: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    color: '#fff',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                  Registration Closes
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                    (Auto: 15 mins before start)
                  </span>
                </label>
                <input
                  type="datetime-local"
                  value={competitionFormData.reg_close_at}
                  onFocus={() => {
                    if (!manualRegClose) {
                      setShowRegCloseWarning(true);
                    }
                  }}
                  onChange={(e) => {
                    setManualRegClose(true);
                    setShowRegCloseWarning(false);
                    setCompetitionFormData({ ...competitionFormData, reg_close_at: e.target.value });
                  }}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: manualRegClose ? 'rgba(245, 158, 11, 0.1)' : 'rgba(0,0,0,0.3)',
                    border: manualRegClose ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    color: '#fff',
                  }}
                />
                {showRegCloseWarning && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.625rem',
                    background: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: '#fbbf24',
                  }}>
                    ⚠️ This field is auto-generated to be 15 minutes before the competition start time. 
                    Only change this if the competition starts early or you need a different registration close time.
                  </div>
                )}
                <p style={{ fontSize: '0.75rem', color: manualRegClose ? '#fbbf24' : 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                  {manualRegClose ? '⚠️ Manual override active' : 'Auto-calculated from Competition Start time'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '0.5rem 1rem',
                  background: saving ? 'rgba(16, 185, 129, 0.5)' : 'rgba(16, 185, 129, 0.9)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                {saving ? 'Saving...' : editingCompetitionId ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddCompetition(false);
                  setEditingCompetitionId(null);
                  setManualRegClose(false);
                  setShowRegCloseWarning(false);
                  setCompetitionFormData({
                    competition_type_id: '',
                    entry_fee_pounds: '0.00',
                    entrants_cap: '0',
                    admin_fee_percent: '10.00',
                    golfer_group_id: '',
                    reg_open_at: '',
                    reg_close_at: '',
                    start_at: '',
                    end_at: '',
                    status: 'draft',
                  });
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(100, 100, 100, 0.5)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {competitions.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '2rem 0' }}>
            No competition types added yet.
          </p>
        ) : (
          <div>
            {competitions.map((comp) => (
              <div key={comp.id} style={{
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '1rem',
                marginBottom: '0.75rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      {comp.competition_types.name}
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                      <div>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Entry Fee:</span>{' '}
                        {formatPennies(comp.entry_fee_pennies)}
                      </div>
                      <div>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Cap:</span>{' '}
                        {comp.entrants_cap === 0 ? 'Unlimited' : comp.entrants_cap}
                      </div>
                      <div>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Admin Fee:</span>{' '}
                        {comp.admin_fee_percent}%
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                      <div>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Status:</span>{' '}
                        {comp.status.replace('_', ' ')}
                      </div>
                    </div>
                    {(comp.reg_open_at || comp.reg_close_at) && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)' }}>
                        <div>
                          <span style={{ color: 'rgba(255,255,255,0.4)' }}>Reg Opens:</span>{' '}
                          {comp.reg_open_at ? new Date(comp.reg_open_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                        </div>
                        <div>
                          <span style={{ color: 'rgba(255,255,255,0.4)' }}>Reg Closes:</span>{' '}
                          {comp.reg_close_at ? new Date(comp.reg_close_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                    <button
                      onClick={() => handleEditCompetition(comp)}
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        borderRadius: '4px',
                        color: '#60a5fa',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCompetition(comp.id, comp.competition_types.name)}
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '4px',
                        color: '#f87171',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Golfer Groups Section */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        marginTop: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
              Golfer Groups
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', margin: '0.25rem 0 0 0' }}>
              {golferGroups.length === 0 ? (
                <span style={{ color: '#f59e0b' }}>⚠️ Add golfer groups to use in competitions</span>
              ) : (
                `${golferGroups.length} group${golferGroups.length !== 1 ? 's' : ''} assigned`
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link
              href="/golfers/groups"
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(107, 114, 128, 0.2)',
                border: '1px solid rgba(107, 114, 128, 0.4)',
                borderRadius: '6px',
                color: '#9ca3af',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Manage All Groups
            </Link>
          </div>
        </div>

        {/* Add Group Dropdown */}
        {allGolferGroups.filter(g => !golferGroups.find(tg => tg.id === g.id)).length > 0 && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '6px',
            padding: '1rem',
            marginBottom: '1rem',
          }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
              Add Golfer Group:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
              {allGolferGroups
                .filter(g => !golferGroups.find(tg => tg.id === g.id))
                .map((group) => (
                  <button
                    key={group.id}
                    onClick={() => handleAddGolferGroup(group.id)}
                    style={{
                      padding: '0.75rem',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '4px',
                      color: '#fff',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: group.color,
                      }}
                    />
                    <span style={{ fontSize: '0.875rem' }}>{group.name}</span>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Groups List */}
        {golferGroups.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: 'rgba(255,255,255,0.6)',
          }}>
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No golfer groups added yet</p>
            <p style={{ fontSize: '0.875rem' }}>
              {allGolferGroups.length === 0 ? (
                <>Create groups in the <Link href="/golfers/groups" style={{ color: '#60a5fa' }}>Golfer Groups</Link> section first</>
              ) : (
                'Click a group above to add it to this tournament'
              )}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
            {golferGroups.map((group) => (
              <div
                key={group.id}
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: group.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    ⛳
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                      {group.name}
                    </div>
                    {group.golfer_count !== undefined && (
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                        {group.golfer_count} golfer{group.golfer_count !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveGolferGroup(group.id, group.name)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '4px',
                    color: '#f87171',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prize Pool Calculator */}
      {competitions.some(c => c.entry_fee_pennies > 0) && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem' }}>Prize Pool Examples</h2>
          
          {competitions.filter(c => c.entry_fee_pennies > 0).map((comp) => (
            <div key={comp.id} style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem', color: '#60a5fa' }}>
                {comp.competition_types.name} — {formatPennies(comp.entry_fee_pennies)} entry
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {[50, 100, 200].map((entrants) => {
                  const { gross, adminFee, netPrize } = calculatePrizePool(
                    entrants,
                    comp.entry_fee_pennies,
                    comp.admin_fee_percent
                  );
                  return (
                    <div key={entrants} style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '0.875rem',
                    }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'rgba(255,255,255,0.9)' }}>
                        {entrants} Entrants
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.25rem' }}>
                        Gross: {formatPennies(gross)}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'rgba(239, 68, 68, 0.8)', marginBottom: '0.25rem' }}>
                        Admin ({comp.admin_fee_percent}%): -{formatPennies(adminFee)}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'rgba(16, 185, 129, 0.9)', fontWeight: 600, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.25rem', marginTop: '0.25rem' }}>
                        Prize Pool: {formatPennies(netPrize)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', marginTop: '1rem' }}>
            * These are example calculations. Actual prize pools depend on real entrant numbers.
          </p>
        </div>
      )}
    </div>
  );
}
