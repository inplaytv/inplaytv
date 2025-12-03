'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PlayerListItem {
  id: string;
  name: string;
  country: string | null;
  photoUrl: string | null;
  form: {
    status: 'hot' | 'cold' | 'neutral';
    sgTotalL5: number | null;
    sgTotalL20: number | null;
    momentum: number;
  };
  stats: {
    totalRounds: number;
    lastRoundDate: string | null;
  };
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('form');
  const [formFilter, setFormFilter] = useState<string>('');

  useEffect(() => {
    loadPlayers();
  }, [sortBy, formFilter]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        sortBy,
        limit: '100',
        ...(formFilter && { form: formFilter }),
      });

      const response = await fetch(`/api/golfdata/players?${params}`);
      const data = await response.json();
      
      if (data.players) {
        setPlayers(data.players);
      }
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFormIcon = (status: string) => {
    switch (status) {
      case 'hot':
        return '🔥';
      case 'cold':
        return '❄️';
      default:
        return '➡️';
    }
  };

  const getFormColor = (status: string) => {
    switch (status) {
      case 'hot':
        return '#22c55e';
      case 'cold':
        return '#3b82f6';
      default:
        return 'rgba(255,255,255,0.5)';
    }
  };

  const getSGColor = (value: number | null) => {
    if (value === null) return 'rgba(255,255,255,0.5)';
    if (value > 0.5) return '#22c55e';
    if (value < -0.5) return '#ef4444';
    return 'rgba(255,255,255,0.7)';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1a', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '0.5rem',
            }}
          >
            📊 Player Performance Analytics
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>
            Explore historical strokes gained data and performance trends
          </p>
        </div>

        {/* Filters */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '200px 200px 300px',
              gap: '1rem',
              alignItems: 'end',
            }}
          >
            {/* Sort By */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: '0.5rem',
                }}
              >
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#1a1f2e',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                <option value="form" style={{ background: '#1a1f2e', color: '#fff' }}>Recent Form (L5)</option>
                <option value="momentum" style={{ background: '#1a1f2e', color: '#fff' }}>Momentum</option>
                <option value="name" style={{ background: '#1a1f2e', color: '#fff' }}>Name (A-Z)</option>
                <option value="rounds" style={{ background: '#1a1f2e', color: '#fff' }}>Total Rounds</option>
              </select>
            </div>

            {/* Form Filter */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: '0.5rem',
                }}
              >
                Form Status
              </label>
              <select
                value={formFilter}
                onChange={(e) => setFormFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#1a1f2e',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                <option value="" style={{ background: '#1a1f2e', color: '#fff' }}>All Players</option>
                <option value="hot" style={{ background: '#1a1f2e', color: '#fff' }}>🔥 Hot Form</option>
                <option value="neutral" style={{ background: '#1a1f2e', color: '#fff' }}>➡️ Neutral</option>
                <option value="cold" style={{ background: '#1a1f2e', color: '#fff' }}>❄️ Cold Form</option>
              </select>
            </div>

            {/* Search - moved to far right */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: '0.5rem',
                }}
              >
                Search Players
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name..."
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.95rem',
                  }}
                />
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  Showing {filteredPlayers.length} players
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            color: '#fff',
            textAlign: 'left'
          }}>
            Select A Player For SG-Breakdown
          </h2>
        </div>

        {/* Players Grid */}
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            Loading players...
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            No players found. Try adjusting your filters.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {filteredPlayers.map((player) => (
              <Link
                key={player.id}
                href={`/golfdata/players/${player.id}`}
                style={{
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'rgba(26, 31, 46, 0.4)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '16px',
                    padding: '1.75rem',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.6)';
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 12px 48px rgba(59, 130, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.background = 'rgba(26, 31, 46, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.border = '1px solid rgba(255,255,255,0.15)';
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.background = 'rgba(26, 31, 46, 0.4)';
                  }}
                >
                  {/* Golf Background Pattern */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '150px',
                      height: '150px',
                      background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                      opacity: 0.5,
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-20px',
                      left: '-20px',
                      width: '100px',
                      height: '100px',
                      background: 'radial-gradient(circle at center, rgba(34, 197, 94, 0.1) 0%, transparent 70%)',
                      opacity: 0.6,
                      pointerEvents: 'none',
                    }}
                  />
                  
                  {/* Decorative golf ball dimple pattern */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-30px',
                      right: '20px',
                      fontSize: '120px',
                      opacity: 0.03,
                      pointerEvents: 'none',
                      transform: 'rotate(15deg)',
                    }}
                  >
                    ⛳
                  </div>

                  {/* Player Header */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.75rem',
                        fontWeight: 'bold',
                        color: '#fff',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      {player.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: '700', 
                        color: '#fff', 
                        marginBottom: '0.25rem',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}>
                        {player.name}
                      </h3>
                      {player.country && (
                        <p style={{ 
                          fontSize: '0.875rem', 
                          color: 'rgba(255,255,255,0.6)',
                          fontWeight: '500'
                        }}>
                          {player.country}
                        </p>
                      )}
                    </div>
                    <div 
                      style={{ 
                        fontSize: '2.5rem',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                      }}
                    >
                      {getFormIcon(player.form.status)}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '6px',
                        padding: '0.5rem',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <p style={{ 
                        fontSize: '0.55rem', 
                        color: 'rgba(255,255,255,0.5)', 
                        marginBottom: '0.125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: '600'
                      }}>
                        SG Total (L5)
                      </p>
                      <p
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: '700',
                          color: getSGColor(player.form.sgTotalL5),
                          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        }}
                      >
                        {player.form.sgTotalL5 !== null
                          ? (player.form.sgTotalL5 > 0 ? '+' : '') + player.form.sgTotalL5.toFixed(2)
                          : 'N/A'}
                      </p>
                    </div>
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '6px',
                        padding: '0.5rem',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <p style={{ 
                        fontSize: '0.55rem', 
                        color: 'rgba(255,255,255,0.5)', 
                        marginBottom: '0.125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: '600'
                      }}>
                        Momentum
                      </p>
                      <p
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: '700',
                          color: getSGColor(player.form.momentum),
                          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        }}
                      >
                        {player.form.momentum > 0 ? '+' : ''}
                        {player.form.momentum.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div
                    style={{
                      position: 'relative',
                      marginTop: '1.25rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.75rem',
                      color: 'rgba(255,255,255,0.6)',
                      fontWeight: '600',
                    }}
                  >
                    <span 
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {player.stats.totalRounds} rounds
                    </span>
                    <span style={{ 
                      color: getFormColor(player.form.status),
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: '700',
                      textShadow: `0 0 10px ${getFormColor(player.form.status)}40`
                    }}>
                      {player.form.status} FORM
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
