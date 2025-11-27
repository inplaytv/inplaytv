'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

interface Golfer {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  external_id: string | null;
  image_url: string | null;
  world_rank: number | null;
}

interface GolferGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  created_at: string;
}

export default function GolferGroupDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [group, setGroup] = useState<GolferGroup | null>(null);
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [allGolfers, setAllGolfers] = useState<Golfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [showAddGolfers, setShowAddGolfers] = useState(false);
  const [selectedGolferIds, setSelectedGolferIds] = useState<string[]>([]);
  const [addingGolfers, setAddingGolfers] = useState(false);
  const [editingGolferId, setEditingGolferId] = useState<string | null>(null);
  const [golferEditData, setGolferEditData] = useState({
    first_name: '',
    last_name: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
  });
  const [showSalaryCalculator, setShowSalaryCalculator] = useState(false);
  const [salaryBudget, setSalaryBudget] = useState('60000');
  const [salaryPreview, setSalaryPreview] = useState<any>(null);
  const [calculatingSalaries, setCalculatingSalaries] = useState(false);
  const [selectedCompetitionForSalary, setSelectedCompetitionForSalary] = useState('');

  useEffect(() => {
    fetchData();
  }, [params.id]);

  async function fetchData() {
    try {
      const [groupRes, golfersRes, allGolfersRes] = await Promise.all([
        fetch(`/api/golfer-groups/${params.id}`),
        fetch(`/api/golfer-groups/${params.id}/members`),
        fetch('/api/golfers'),
      ]);

      if (!groupRes.ok) {
        throw new Error('Group not found');
      }

      const groupData = await groupRes.json();
      setGroup(groupData);
      setFormData({
        name: groupData.name,
        description: groupData.description || '',
        color: groupData.color,
      });

      if (golfersRes.ok) {
        const golfersData = await golfersRes.json();
        setGolfers(golfersData);
      }

      if (allGolfersRes.ok) {
        const allGolfersData = await allGolfersRes.json();
        setAllGolfers(allGolfersData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load group');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateGroup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/golfer-groups/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update group');
      }

      setSuccess('Group updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      setEditing(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  }

  async function handleRemoveGolfer(golferId: string, golferName: string) {
    if (!confirm(`Remove ${golferName} from this group?`)) return;

    try {
      const res = await fetch(`/api/golfer-groups/${params.id}/members?golfer_id=${golferId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to remove golfer');
      }

      setSuccess('Golfer removed from group');
      setTimeout(() => setSuccess(''), 3000);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  }

  async function handleDeleteGroup() {
    if (!confirm(`Delete "${group?.name}"? This will remove the group but keep the golfers.`)) return;

    try {
      const res = await fetch(`/api/golfer-groups/${params.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete group');
      }

      router.push('/golfers/groups');
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  }

  async function handleAddGolfers() {
    if (selectedGolferIds.length === 0) {
      setError('Please select at least one golfer');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setAddingGolfers(true);
    try {
      const res = await fetch(`/api/golfer-groups/${params.id}/add-members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ golfer_ids: selectedGolferIds }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add golfers');
      }

      setSuccess(data.message || `Added ${data.added} golfer(s) to the group`);
      setTimeout(() => setSuccess(''), 3000);
      setSelectedGolferIds([]);
      setShowAddGolfers(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setAddingGolfers(false);
    }
  }

  function toggleGolferSelection(golferId: string) {
    setSelectedGolferIds(prev =>
      prev.includes(golferId)
        ? prev.filter(id => id !== golferId)
        : [...prev, golferId]
    );
  }

  function startEditingGolfer(golfer: Golfer) {
    setEditingGolferId(golfer.id);
    setGolferEditData({
      first_name: golfer.first_name,
      last_name: golfer.last_name,
    });
  }

  function cancelEditingGolfer() {
    setEditingGolferId(null);
    setGolferEditData({ first_name: '', last_name: '' });
  }

  async function handleUpdateGolfer(golferId: string) {
    if (!golferEditData.first_name.trim() || !golferEditData.last_name.trim()) {
      setError('First name and last name are required');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const res = await fetch(`/api/golfers?id=${golferId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: golferEditData.first_name.trim(),
          last_name: golferEditData.last_name.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update golfer');
      }

      setSuccess('Golfer updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      setEditingGolferId(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  }

  async function handlePreviewSalaries() {
    if (!selectedCompetitionForSalary) {
      setError('Please select a competition');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setCalculatingSalaries(true);
    setSalaryPreview(null);
    setError('');

    try {
      const res = await fetch(`/api/golfer-groups/${params.id}/calculate-salaries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competition_id: selectedCompetitionForSalary,
          budget: parseInt(salaryBudget),
          apply: false, // Just preview
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to calculate salaries');
      }

      setSalaryPreview(data);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setCalculatingSalaries(false);
    }
  }

  async function handleApplySalaries() {
    if (!selectedCompetitionForSalary || !salaryPreview) return;

    if (!confirm(`Apply these calculated salaries to the competition? This will overwrite any existing salaries.`)) return;

    setCalculatingSalaries(true);
    setError('');

    try {
      const res = await fetch(`/api/golfer-groups/${params.id}/calculate-salaries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competition_id: selectedCompetitionForSalary,
          budget: parseInt(salaryBudget),
          apply: true, // Apply to database
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to apply salaries');
      }

      setSuccess(`✅ Successfully applied salaries to ${data.stats.total_golfers} golfers!`);
      setTimeout(() => setSuccess(''), 5000);
      setShowSalaryCalculator(false);
      setSalaryPreview(null);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setCalculatingSalaries(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        Loading...
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className={styles.errorContainer}>
        <div style={{
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#f87171',
          marginBottom: '1rem',
        }}>
          {error}
        </div>
        <Link
          href="/golfers/groups"
          style={{
            color: '#60a5fa',
            textDecoration: 'none',
          }}
        >
          ← Back to Groups
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          href="/golfers/groups"
          style={{
            color: '#60a5fa',
            textDecoration: 'none',
            fontSize: '0.875rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          ← Back to Groups
        </Link>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#f87171',
          marginBottom: '1rem',
          fontSize: '0.875rem',
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          color: '#10b981',
          marginBottom: '1rem',
          fontSize: '0.875rem',
        }}>
          {success}
        </div>
      )}

      {/* Group Info Section */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: group?.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
            >
              ⛳
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 700, color: '#fff' }}>
                {group?.name}
              </h1>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                {golfers.length} golfer{golfers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!editing && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '6px',
                    color: '#60a5fa',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Edit Group
                </button>
                <button
                  onClick={handleDeleteGroup}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '6px',
                    color: '#f87171',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Delete Group
                </button>
              </>
            )}
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleUpdateGroup}>
            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                  Group Name *
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
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
              <div>
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
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                  Color
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  style={{
                    width: '100px',
                    height: '40px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  style={{
                    padding: '0.625rem 1.25rem',
                    background: 'rgba(16, 185, 129, 0.9)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: group?.name || '',
                      description: group?.description || '',
                      color: group?.color || '#3b82f6',
                    });
                  }}
                  style={{
                    padding: '0.625rem 1.25rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        ) : (
          <>
            {group?.description && (
              <p style={{ margin: '0.5rem 0 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.9375rem' }}>
                {group.description}
              </p>
            )}
          </>
        )}
      </div>

      {/* Add Golfers Section */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showAddGolfers ? '1rem' : '0' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>
            Add Golfers to Group
          </h2>
          <button
            onClick={() => {
              setShowAddGolfers(!showAddGolfers);
              setSelectedGolferIds([]);
              setError('');
            }}
            style={{
              padding: '0.5rem 1rem',
              background: showAddGolfers ? 'rgba(255,255,255,0.05)' : 'rgba(59, 130, 246, 0.9)',
              border: showAddGolfers ? '1px solid rgba(255,255,255,0.2)' : 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.875rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {showAddGolfers ? 'Cancel' : '+ Add Golfers'}
          </button>
        </div>

        {showAddGolfers && (
          <>
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '0.5rem',
              background: 'rgba(0,0,0,0.2)',
              marginBottom: '1rem',
            }}>
              {allGolfers
                .filter(g => !golfers.some(existing => existing.id === g.id))
                .filter(g => {
                  // Filter out corrupted golfers (binary data from Excel files)
                  const name = g.full_name || '';
                  return !name.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/) && 
                         !name.includes('PK!') && 
                         !name.includes('xl/') &&
                         name.length < 100; // Reasonable name length
                })
                .map((golfer) => (
                  <label
                    key={golfer.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      background: selectedGolferIds.includes(golfer.id) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      borderRadius: '4px',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGolferIds.includes(golfer.id)}
                      onChange={() => toggleGolferSelection(golfer.id)}
                      style={{
                        marginRight: '0.75rem',
                        cursor: 'pointer',
                        width: '16px',
                        height: '16px',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9375rem' }}>
                        {golfer.full_name}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)' }}>
                        {golfer.world_rank ? `World Ranking #${golfer.world_rank}` : 'No Ranking'}
                      </div>
                    </div>
                  </label>
                ))}
              {allGolfers.filter(g => !golfers.some(existing => existing.id === g.id)).length === 0 && (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                  All golfers are already in this group
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={handleAddGolfers}
                disabled={addingGolfers || selectedGolferIds.length === 0}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: selectedGolferIds.length > 0 ? 'rgba(16, 185, 129, 0.9)' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.875rem',
                  cursor: selectedGolferIds.length > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: 600,
                  opacity: addingGolfers ? 0.6 : 1,
                }}
              >
                {addingGolfers ? 'Adding...' : `Add ${selectedGolferIds.length} Golfer${selectedGolferIds.length !== 1 ? 's' : ''}`}
              </button>
              <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)' }}>
                {selectedGolferIds.length} selected
              </span>
            </div>
          </>
        )}
      </div>

      {/* Golfers List */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }}>
        <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>
          Golfers ({golfers.length})
        </h2>

        {golfers.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            No golfers in this group yet
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
            {golfers
              .filter(g => {
                // Filter out corrupted golfers (binary data from Excel files)
                const name = g.full_name || '';
                return !name.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/) && 
                       !name.includes('PK!') && 
                       !name.includes('xl/') &&
                       name.length < 100; // Reasonable name length
              })
              .map((golfer) => (
              <div
                key={golfer.id}
                style={{
                  padding: '1rem',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                }}
              >
                {editingGolferId === golfer.id ? (
                  // Edit Mode
                  <div>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.25rem' }}>
                        First Name
                      </label>
                      <input
                        type="text"
                        value={golferEditData.first_name}
                        onChange={(e) => setGolferEditData({ ...golferEditData, first_name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '0.875rem',
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.25rem' }}>
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={golferEditData.last_name}
                        onChange={(e) => setGolferEditData({ ...golferEditData, last_name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '0.875rem',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleUpdateGolfer(golfer.id)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          background: 'rgba(16, 185, 129, 0.9)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditingGolfer}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '6px',
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#fff', marginBottom: '0.25rem' }}>
                        {golfer.full_name}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)' }}>
                        {golfer.world_rank ? (
                          <span>World Ranking #{golfer.world_rank}</span>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.4)' }}>No Ranking</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <button
                        onClick={() => startEditingGolfer(golfer)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          background: 'rgba(59, 130, 246, 0.2)',
                          border: '1px solid rgba(59, 130, 246, 0.4)',
                          borderRadius: '6px',
                          color: '#60a5fa',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveGolfer(golfer.id, golfer.full_name)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          borderRadius: '6px',
                          color: '#f87171',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
