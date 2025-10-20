'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Golfer {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  world_ranking: number | null;
  points_won: number | null;
  external_id: string | null;
  image_url: string | null;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
  });

  useEffect(() => {
    fetchData();
  }, [params.id]);

  async function fetchData() {
    try {
      const [groupRes, golfersRes] = await Promise.all([
        fetch(`/api/golfer-groups/${params.id}`),
        fetch(`/api/golfer-groups/${params.id}/members`),
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

  if (loading) {
    return (
      <div style={{ padding: '2rem', color: '#fff' }}>
        Loading...
      </div>
    );
  }

  if (error && !group) {
    return (
      <div style={{ padding: '2rem' }}>
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
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {golfers.map((golfer) => (
              <div
                key={golfer.id}
                style={{
                  padding: '1rem',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#fff', marginBottom: '0.25rem' }}>
                    {golfer.full_name}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)' }}>
                    {golfer.world_ranking && (
                      <span>Rank: {golfer.world_ranking}</span>
                    )}
                    {golfer.points_won && (
                      <span style={{ marginLeft: golfer.world_ranking ? '0.75rem' : 0 }}>
                        Points: {golfer.points_won}
                      </span>
                    )}
                    {golfer.external_id && (
                      <span style={{ marginLeft: golfer.world_ranking || golfer.points_won ? '0.75rem' : 0 }}>
                        OWGR: {golfer.external_id}
                      </span>
                    )}
                    {!golfer.world_ranking && !golfer.external_id && !golfer.points_won && (
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>No ranking data</span>
                    )}
                  </div>
                </div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
