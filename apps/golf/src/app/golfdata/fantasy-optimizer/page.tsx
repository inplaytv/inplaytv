'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Golfer {
  id: string;
  name: string;
  country: string;
  image_url: string;
}

interface Player {
  golfer: Golfer;
  golfer_id: string;
  salary: number;
  projected_points: number;
  points_per_dollar: number;
  value_rating: number;
  projected_ownership: number;
  win_probability: number;
  course_fit_score: number;
  form_score: number;
  position_in_lineup?: number;
}

interface Lineup {
  players: Player[];
  total_salary: number;
  remaining_salary: number;
  projected_points: number;
  average_ownership: number;
  strategy: string;
}

interface Tournament {
  id: string;
  name: string;
  course_name: string;
  start_date: string;
}

export default function FantasyOptimizerPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [platform, setPlatform] = useState('draftkings');
  const [budget, setBudget] = useState(50000);
  const [lineups, setLineups] = useState<any>({});
  const [selectedStrategy, setSelectedStrategy] = useState<string>('optimal');
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const response = await fetch('/api/golfdata/fantasy-optimizer');
      const data = await response.json();
      setTournaments(data.tournaments || []);
      if (data.tournaments && data.tournaments.length > 0) {
        selectTournament(data.tournaments[0]);
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectTournament = async (tournament: Tournament) => {
    setSelectedTournament(tournament);
    await generateLineups(tournament.id, platform, budget);
  };

  const generateLineups = async (tournamentId: string, plat: string, budg: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/golfdata/fantasy-optimizer?tournamentId=${tournamentId}&platform=${plat}&budget=${budg}`
      );
      const data = await response.json();
      setLineups(data.lineups || {});
    } catch (error) {
      console.error('Error generating lineups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformChange = (newPlatform: string) => {
    setPlatform(newPlatform);
    // Update budget defaults
    const budgets: any = {
      draftkings: 50000,
      fanduel: 60000,
      yahoo: 200
    };
    setBudget(budgets[newPlatform] || 50000);
    
    if (selectedTournament) {
      generateLineups(selectedTournament.id, newPlatform, budgets[newPlatform]);
    }
  };

  const formatSalary = (salary: number) => {
    if (platform === 'yahoo') return `$${salary}`;
    return `$${(salary / 1000).toFixed(1)}K`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getValueColor = (rating: number) => {
    if (rating >= 8) return '#22c55e';
    if (rating >= 6) return '#3b82f6';
    if (rating >= 4) return '#fbbf24';
    return '#ef4444';
  };

  const currentLineup: Lineup | null = lineups[selectedStrategy] || null;

  if (loading && !selectedTournament) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 100%)',
        padding: '2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ color: '#fff', fontSize: '1.25rem' }}>Loading optimizer...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/golfdata" style={{ color: '#3b82f6', marginBottom: '1rem', display: 'inline-block' }}>
            ← Back to Golf Data
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#fff',
              margin: 0,
            }}>
              🎮 Fantasy Golf Optimizer
            </h1>
            <button
              onClick={() => setShowGuide(true)}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }}
            >
              📖 Optimizer Guide
            </button>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>
            Optimal DFS lineups based on course fit, form, value, and projections
          </p>
        </div>

        {/* Configuration Panel */}
        <div style={{
          background: 'rgba(26, 31, 46, 0.4)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1.5rem' }}>
            {/* Tournament Selector */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                Tournament
              </label>
              <select
                value={selectedTournament?.id || ''}
                onChange={(e) => {
                  const tournament = tournaments.find(t => t.id === e.target.value);
                  if (tournament) selectTournament(tournament);
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                {tournaments.map(tournament => (
                  <option key={tournament.id} value={tournament.id} style={{ background: '#1a1f2e' }}>
                    {tournament.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Platform Selector */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => handlePlatformChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                <option value="draftkings" style={{ background: '#1a1f2e' }}>DraftKings</option>
                <option value="fanduel" style={{ background: '#1a1f2e' }}>FanDuel</option>
                <option value="yahoo" style={{ background: '#1a1f2e' }}>Yahoo</option>
              </select>
            </div>

            {/* Budget Display */}
            <div>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                Salary Cap
              </label>
              <div style={{
                padding: '0.75rem',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                color: '#3b82f6',
                fontSize: '1.125rem',
                fontWeight: '700',
                textAlign: 'center'
              }}>
                {formatSalary(budget)}
              </div>
            </div>
          </div>
        </div>

        {/* Strategy Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'optimal', label: '⚡ Optimal', desc: 'Best projected points' },
            { id: 'value', label: '💎 Value', desc: 'Best bang for buck' },
            { id: 'contrarian', label: '🎲 Contrarian', desc: 'Low ownership' },
            { id: 'safe', label: '🛡️ Safe', desc: 'High floor plays' }
          ].map(strategy => (
            <button
              key={strategy.id}
              onClick={() => setSelectedStrategy(strategy.id)}
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '1rem',
                background: selectedStrategy === strategy.id
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                  : 'rgba(26, 31, 46, 0.4)',
                backdropFilter: 'blur(12px)',
                border: selectedStrategy === strategy.id
                  ? '2px solid #3b82f6'
                  : '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                if (selectedStrategy !== strategy.id) {
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedStrategy !== strategy.id) {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                }
              }}
            >
              <div style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                {strategy.label}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                {strategy.desc}
              </div>
            </button>
          ))}
        </div>

        {/* Lineup Summary */}
        {currentLineup && (
          <div style={{
            background: 'rgba(26, 31, 46, 0.4)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
                  Total Salary
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
                  {formatSalary(currentLineup.total_salary)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
                  Remaining
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>
                  {formatSalary(currentLineup.remaining_salary)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
                  Projected Points
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fbbf24' }}>
                  {currentLineup.projected_points.toFixed(1)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
                  Avg Ownership
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#a855f7' }}>
                  {currentLineup.average_ownership.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lineup Players */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '3rem' }}>
            Generating lineup...
          </div>
        ) : currentLineup ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {currentLineup.players.map((player, index) => (
              <Link
                key={player.golfer_id}
                href={`/golfdata/players/${player.golfer.id}`}
                style={{
                  background: 'rgba(26, 31, 46, 0.4)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textDecoration: 'none',
                  display: 'grid',
                  gridTemplateColumns: 'auto 2fr 1fr 1fr',
                  gap: '1.5rem',
                  alignItems: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Position */}
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#3b82f6'
                }}>
                  {index + 1}
                </div>

                {/* Player Info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#fff', margin: 0 }}>
                      {player.golfer.name}
                    </h3>
                    <span style={{ fontSize: '1rem' }}>{player.golfer.country}</span>
                    <div style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      background: `${getValueColor(player.value_rating)}20`,
                      border: `1px solid ${getValueColor(player.value_rating)}`,
                      color: getValueColor(player.value_rating),
                      fontSize: '0.7rem',
                      fontWeight: '600'
                    }}>
                      VALUE: {player.value_rating.toFixed(1)}/10
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Course Fit: </span>
                      <span style={{ color: '#3b82f6', fontWeight: '600' }}>{player.course_fit_score.toFixed(0)}%</span>
                    </div>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Form: </span>
                      <span style={{ color: '#22c55e', fontWeight: '600' }}>{player.form_score.toFixed(0)}%</span>
                    </div>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Win Prob: </span>
                      <span style={{ color: '#fbbf24', fontWeight: '600' }}>{player.win_probability.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Salary */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>
                    Salary
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff' }}>
                    {formatSalary(player.salary)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                    Own: {player.projected_ownership.toFixed(1)}%
                  </div>
                </div>

                {/* Projected Points */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>
                    Projected
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>
                    {player.projected_points.toFixed(1)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                    {player.points_per_dollar.toFixed(2)} pt/$K
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {/* Optimizer Guide Modal */}
      {showGuide && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '2rem',
            overflow: 'auto'
          }}
          onClick={() => setShowGuide(false)}
        >
          <div 
            style={{
              background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%)',
              borderRadius: '16px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              border: '2px solid rgba(59, 130, 246, 0.3)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              position: 'sticky',
              top: 0,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              padding: '1.5rem 2rem',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 10
            }}>
              <h2 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>
                🎮 Fantasy Golf Optimizer Guide
              </h2>
              <button
                onClick={() => setShowGuide(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  color: '#fff',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '2rem', color: '#fff' }}>
              <div style={{ marginBottom: '2rem' }}>
                <p style={{ fontSize: '1.125rem', lineHeight: '1.75', color: 'rgba(255,255,255,0.9)' }}>
                  The <strong>Fantasy Golf Optimizer</strong> generates optimal DFS lineups by combining course fit, form, value, and projections.
                  <em style={{ color: '#3b82f6' }}> Choose your strategy and let the algorithm build winning lineups within your salary cap.</em>
                </p>
              </div>

              <h3 style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2rem' }}>
                🎯 Optimization Strategies
              </h3>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '1.25rem', 
                  borderRadius: '12px',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderLeft: '4px solid #3b82f6'
                }}>
                  <h4 style={{ color: '#3b82f6', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                    ⚡ Optimal (Balanced)
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.925rem' }}>
                    Maximizes projected points. Best overall lineup based on predictions, course fit, and form. Great for cash games.
                  </p>
                </div>
                <div style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '1.25rem', 
                  borderRadius: '12px',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderLeft: '4px solid #22c55e'
                }}>
                  <h4 style={{ color: '#22c55e', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                    💎 Value
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.925rem' }}>
                    Best points per dollar. Targets underpriced players with high upside. Leaves salary room for flexibility.
                  </p>
                </div>
                <div style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '1.25rem', 
                  borderRadius: '12px',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderLeft: '4px solid #a855f7'
                }}>
                  <h4 style={{ color: '#a855f7', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                    🎲 Contrarian
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.925rem' }}>
                    Low ownership + high upside. Fades chalk picks for differentiation. Best for GPP tournaments.
                  </p>
                </div>
                <div style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '1.25rem', 
                  borderRadius: '12px',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  borderLeft: '4px solid #fbbf24'
                }}>
                  <h4 style={{ color: '#fbbf24', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                    🛡️ Safe
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.925rem' }}>
                    High floor plays. Prioritizes course fit + recent form for consistent scoring. Lower variance for cash games.
                  </p>
                </div>
              </div>

              <h3 style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2rem' }}>
                📊 Understanding Value Rating
              </h3>
              <div style={{ marginBottom: '2rem' }}>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.75', color: 'rgba(255,255,255,0.9)', marginBottom: '1rem' }}>
                  Value Rating (1-10) combines points per dollar with ownership projections:
                </p>
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  padding: '1.5rem', 
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <strong style={{ color: '#22c55e' }}>9-10:</strong> Elite value - high upside, low ownership
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <strong style={{ color: '#3b82f6' }}>7-8:</strong> Good value - solid points per dollar
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <strong style={{ color: '#fbbf24' }}>5-6:</strong> Fair value - priced correctly
                  </div>
                  <div>
                    <strong style={{ color: '#ef4444' }}>{'<5:'}</strong> Poor value - overpriced or too chalky
                  </div>
                </div>
              </div>

              <h3 style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2rem' }}>
                💡 Pro Tips
              </h3>
              <div style={{ 
                background: 'rgba(255,255,255,0.05)', 
                padding: '1.5rem', 
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                marginBottom: '1rem'
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#22c55e' }}>✓ Mix Strategies:</strong> Use Optimal for cash games, Contrarian for GPPs
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#3b82f6' }}>✓ Check Course Fit:</strong> Click players to see detailed SG breakdown
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#fbbf24' }}>✓ Monitor Ownership:</strong> High ownership = lower GPP upside
                </div>
                <div>
                  <strong style={{ color: '#a855f7' }}>✓ Leave Salary:</strong> Save $1-2K for late swap flexibility
                </div>
              </div>

              <div style={{ 
                background: 'rgba(34, 197, 94, 0.1)', 
                padding: '1.5rem', 
                borderRadius: '8px',
                marginTop: '2rem',
                borderLeft: '4px solid #22c55e'
              }}>
                <strong style={{ color: '#22c55e', fontSize: '1.125rem' }}>💡 Winning Formula</strong>
                <p style={{ marginTop: '0.75rem', marginBottom: 0, lineHeight: '1.75', color: 'rgba(255,255,255,0.9)' }}>
                  The best DFS plays combine: High Course Fit (85%+) + Strong Recent Form (80%+) + Good Value (7+ rating) + Reasonable Ownership ({'<25%'}). Stack 2-3 of these in every lineup!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
