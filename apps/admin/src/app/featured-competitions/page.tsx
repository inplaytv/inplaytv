'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Tournament {
  id: string;
  name: string;
  slug: string;
  start_date: string;
  end_date: string;
  status: string;
  location: string;
}

interface CompetitionType {
  id: string;
  name: string;
  slug: string;
}

interface Competition {
  id: string;
  tournament_id: string;
  entry_fee_pennies: number;
  entrants_cap: number;
  status: string;
  is_featured: boolean;
  featured_order: number | null;
  featured_message: string | null;
  competition_types: CompetitionType;
  tournaments: Tournament;
}

export default function FeaturedCompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCompetitions();
  }, []);

  async function fetchCompetitions() {
    try {
      const res = await fetch('/api/featured-competitions');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCompetitions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFeatured(competitionId: string, currentStatus: boolean, order: number | null) {
    try {
      const res = await fetch('/api/featured-competitions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competition_id: competitionId,
          is_featured: !currentStatus,
          featured_order: !currentStatus ? (order || getNextOrder()) : null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update');
      
      setSuccess('Featured status updated');
      setTimeout(() => setSuccess(''), 3000);
      await fetchCompetitions();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  }

  async function updateOrder(competitionId: string, newOrder: number) {
    try {
      const res = await fetch('/api/featured-competitions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competition_id: competitionId,
          featured_order: newOrder,
        }),
      });

      if (!res.ok) throw new Error('Failed to update');
      await fetchCompetitions();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  }

  async function updateMessage(competitionId: string, message: string) {
    try {
      const res = await fetch('/api/featured-competitions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competition_id: competitionId,
          featured_message: message || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update');
      
      setSuccess('Message updated');
      setTimeout(() => setSuccess(''), 3000);
      await fetchCompetitions();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  }

  function getNextOrder(): number {
    const featuredComps = competitions.filter(c => c.is_featured);
    if (featuredComps.length === 0) return 1;
    const maxOrder = Math.max(...featuredComps.map(c => c.featured_order || 0));
    return maxOrder + 1;
  }

  const featuredCompetitions = competitions
    .filter(c => c.is_featured)
    .sort((a, b) => (a.featured_order || 999) - (b.featured_order || 999));

  const availableCompetitions = competitions.filter(c => !c.is_featured && c.status !== 'completed');

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <Link
          href="/tournaments"
          style={{
            color: '#60a5fa',
            textDecoration: 'none',
            fontSize: '14px',
            display: 'inline-block',
            marginBottom: '10px',
          }}
        >
          ← Back to Tournaments
        </Link>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
          Featured Competitions
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>
          Manage which competitions appear as featured on the golf app homepage
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          padding: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#ef4444',
          marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '12px',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '8px',
          color: '#22c55e',
          marginBottom: '20px',
        }}>
          {success}
        </div>
      )}

      {/* Featured Competitions */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#fff', marginBottom: '16px' }}>
          Currently Featured ({featuredCompetitions.length})
        </h2>
        
        {featuredCompetitions.length === 0 ? (
          <div style={{
            padding: '40px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '2px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#9ca3af',
          }}>
            No featured competitions selected. Select from available competitions below.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {featuredCompetitions.map((comp) => (
              <div
                key={comp.id}
                style={{
                  background: 'rgba(102, 126, 234, 0.1)',
                  border: '1px solid rgba(102, 126, 234, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                  {/* Order Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button
                      onClick={() => updateOrder(comp.id, Math.max(1, (comp.featured_order || 1) - 1))}
                      disabled={comp.featured_order === 1}
                      style={{
                        padding: '4px 8px',
                        background: comp.featured_order === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(102, 126, 234, 0.2)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '4px',
                        color: '#fff',
                        cursor: comp.featured_order === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      ↑
                    </button>
                    <div style={{
                      padding: '4px 8px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      textAlign: 'center',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}>
                      #{comp.featured_order}
                    </div>
                    <button
                      onClick={() => updateOrder(comp.id, (comp.featured_order || 1) + 1)}
                      style={{
                        padding: '4px 8px',
                        background: 'rgba(102, 126, 234, 0.2)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '4px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      ↓
                    </button>
                  </div>

                  {/* Competition Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0 }}>
                        {comp.tournaments.name}
                      </h3>
                      <span style={{
                        padding: '4px 8px',
                        background: 'rgba(102, 126, 234, 0.2)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#818cf8',
                        fontWeight: '600',
                      }}>
                        {comp.competition_types.name}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '14px', color: '#9ca3af' }}>
                      <span>Entry: £{(comp.entry_fee_pennies / 100).toFixed(2)}</span>
                      <span>•</span>
                      <span>Cap: {comp.entrants_cap.toLocaleString()}</span>
                      <span>•</span>
                      <span>{comp.tournaments.location}</span>
                    </div>

                    {/* Featured Message Input */}
                    <div style={{ marginTop: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>
                        Featured Message (optional)
                      </label>
                      <input
                        type="text"
                        defaultValue={comp.featured_message || ''}
                        placeholder="e.g., Only 50 spots left!"
                        onBlur={(e) => updateMessage(comp.id, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => toggleFeatured(comp.id, true, comp.featured_order)}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Competitions */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#fff', marginBottom: '16px' }}>
          Available Competitions
        </h2>
        
        {availableCompetitions.length === 0 ? (
          <div style={{
            padding: '40px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#9ca3af',
          }}>
            No available competitions to feature
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {availableCompetitions.map((comp) => (
              <div
                key={comp.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: 0 }}>
                      {comp.tournaments.name}
                    </h3>
                    <span style={{
                      padding: '2px 6px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#9ca3af',
                    }}>
                      {comp.competition_types.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#9ca3af' }}>
                    <span>£{(comp.entry_fee_pennies / 100).toFixed(2)}</span>
                    <span>•</span>
                    <span>{comp.entrants_cap.toLocaleString()} spots</span>
                    <span>•</span>
                    <span>{comp.status}</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleFeatured(comp.id, false, null)}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '8px',
                    color: '#22c55e',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  + Feature
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
