'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface PlayerRound {
  id: string;
  event_date: string;
  tournament_name?: string;
  round_number: number;
  score: number;
  to_par: number;
  sg_total: number;
  sg_ott: number;
  sg_app: number;
  sg_arg: number;
  sg_putt: number;
  sg_t2g: number;
  birdies: number;
  bogies: number;
  eagles_or_better: number;
  doubles_or_worse: number;
  pars: number;
}

interface PlayerStats {
  name: string;
  country: string | null;
  photoUrl: string | null;
  form: {
    status: 'hot' | 'cold' | 'neutral';
    sgTotalL5: number;
    sgTotalL20: number;
    sgTotalCareer: number;
    momentum: number;
  };
  sgBreakdown: {
    l5: { ott: number; app: number; arg: number; putt: number; t2g: number };
    l20: { ott: number; app: number; arg: number; putt: number; t2g: number };
    career: { ott: number; app: number; arg: number; putt: number; t2g: number };
  };
  recentRounds: PlayerRound[];
  totalRounds: number;
  lastRoundDate: string | null;
}

export default function PlayerDetailPage() {
  const params = useParams();
  const playerId = params.playerId as string;

  const [player, setPlayer] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'l5' | 'l20' | 'career'>('l20');
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (playerId) {
      loadPlayerData();
    }
  }, [playerId]);

  const loadPlayerData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/golfdata/players/${playerId}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setPlayer(data);
      }
    } catch (err) {
      setError('Failed to load player data');
      console.error('Error loading player:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFormIcon = (status: string) => {
    switch (status) {
      case 'hot': return '🔥';
      case 'cold': return '❄️';
      default: return '➡️';
    }
  };

  const getFormColor = (status: string) => {
    switch (status) {
      case 'hot': return '#22c55e';
      case 'cold': return '#3b82f6';
      default: return 'rgba(255,255,255,0.5)';
    }
  };

  const getSGColor = (value: number) => {
    if (value > 0.5) return '#22c55e'; // Green for good
    if (value < -0.5) return '#ef4444'; // Red for bad
    return '#fbbf24'; // Yellow for average
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const renderSGBar = (label: string, value: number, maxValue: number = 3) => {
    const percentage = Math.min(Math.abs(value) / maxValue * 100, 100);
    const isPositive = value >= 0;
    
    return (
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '0.25rem',
          fontSize: '0.875rem',
          color: 'rgba(255,255,255,0.8)'
        }}>
          <span>{label}</span>
          <span style={{ 
            color: getSGColor(value),
            fontWeight: '600'
          }}>
            {value > 0 ? '+' : ''}{value.toFixed(3)}
          </span>
        </div>
        <div style={{ 
          width: '100%', 
          height: '8px', 
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '4px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            left: isPositive ? '50%' : `${50 - percentage}%`,
            width: `${percentage}%`,
            height: '100%',
            background: getSGColor(value),
            transition: 'all 0.3s ease'
          }} />
          {/* Center line */}
          <div style={{
            position: 'absolute',
            left: '50%',
            width: '2px',
            height: '100%',
            background: 'rgba(255,255,255,0.3)',
            transform: 'translateX(-50%)'
          }} />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%)',
        padding: '2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ color: '#fff', fontSize: '1.25rem' }}>Loading player data...</div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%)',
        padding: '2rem'
      }}>
        <Link href="/golfdata/players" style={{ color: '#3b82f6', marginBottom: '1rem', display: 'inline-block' }}>
          ← Back to Players
        </Link>
        <div style={{ color: '#ef4444', fontSize: '1.25rem' }}>{error || 'Player not found'}</div>
      </div>
    );
  }

  const currentBreakdown = player.sgBreakdown[selectedPeriod];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%)',
      padding: '2rem'
    }}>
      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Link 
          href="/golfdata/players" 
          style={{ 
            color: '#3b82f6', 
            marginBottom: '1.5rem', 
            display: 'inline-block',
            textDecoration: 'none'
          }}
        >
          ← Back to Players
        </Link>

        {/* Player Header Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 40, 60, 0.95), rgba(40, 50, 70, 0.95))',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            {/* Player Photo */}
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              border: '4px solid rgba(255,255,255,0.2)'
            }}>
              {player.photoUrl ? (
                <img src={player.photoUrl} alt={player.name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
              ) : (
                '⛳'
              )}
            </div>

            {/* Player Info */}
            <div style={{ flex: 1 }}>
              <h1 style={{ 
                color: '#fff', 
                fontSize: '2.5rem', 
                marginBottom: '0.5rem',
                fontWeight: '700'
              }}>
                {player.name}
              </h1>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1.5rem',
                fontSize: '1.125rem'
              }}>
                {player.country && (
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {player.country}
                  </span>
                )}
                <span style={{ 
                  color: getFormColor(player.form.status),
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {getFormIcon(player.form.status)} {player.form.status.toUpperCase()} Form
                </span>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {player.totalRounds} Rounds
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {/* Strokes Gained Explained Button */}
              <button
                onClick={() => setShowGuide(true)}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }}
              >
                📚 Strokes Gained Explained
              </button>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '1.5rem',
                textAlign: 'center'
              }}>
              <div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: '0.25rem'
                }}>
                  L5 AVERAGE
                </div>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700',
                  color: getSGColor(player.form.sgTotalL5)
                }}>
                  {player.form.sgTotalL5 > 0 ? '+' : ''}{player.form.sgTotalL5.toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: '0.25rem'
                }}>
                  L20 AVERAGE
                </div>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700',
                  color: getSGColor(player.form.sgTotalL20)
                }}>
                  {player.form.sgTotalL20 > 0 ? '+' : ''}{player.form.sgTotalL20.toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: '0.25rem'
                }}>
                  MOMENTUM
                </div>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700',
                  color: player.form.momentum > 0 ? '#22c55e' : '#ef4444'
                }}>
                  {player.form.momentum > 0 ? '+' : ''}{player.form.momentum.toFixed(2)}
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* SG Breakdown Section */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 40, 60, 0.95), rgba(40, 50, 70, 0.95))',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <h2 style={{ 
              color: '#fff', 
              fontSize: '1.75rem',
              fontWeight: '700',
              margin: 0
            }}>
              Strokes Gained Breakdown
            </h2>
            
            {/* Period Selector */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['l5', 'l20', 'career'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: selectedPeriod === period 
                      ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                      : 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                >
                  {period === 'l5' ? 'Last 5' : period === 'l20' ? 'Last 20' : 'Career'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              {renderSGBar('Off-the-Tee', currentBreakdown.ott)}
              {renderSGBar('Approach', currentBreakdown.app)}
              {renderSGBar('Around-the-Green', currentBreakdown.arg)}
            </div>
            <div>
              {renderSGBar('Putting', currentBreakdown.putt)}
              {renderSGBar('Tee-to-Green', currentBreakdown.t2g)}
            </div>
          </div>
        </div>

        {/* Recent Rounds Table */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 40, 60, 0.95), rgba(40, 50, 70, 0.95))',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ 
            color: '#fff', 
            fontSize: '1.75rem',
            fontWeight: '700',
            marginBottom: '1.5rem'
          }}>
            Recent Rounds ({player.recentRounds.length})
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '0.875rem'
            }}>
              <thead>
                <tr style={{ 
                  borderBottom: '2px solid rgba(255,255,255,0.1)',
                  textAlign: 'left'
                }}>
                  <th style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>Rnd</th>
                  <th style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>Score</th>
                  <th style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>SG Total</th>
                  <th style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>SG:OTT</th>
                  <th style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>SG:APP</th>
                  <th style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>SG:ARG</th>
                  <th style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>SG:PUTT</th>
                  <th style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>Scoring</th>
                </tr>
              </thead>
              <tbody>
                {player.recentRounds.map((round, index) => (
                  <tr 
                    key={round.id}
                    style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      background: index < 5 ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                      {formatDate(round.event_date)}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                      R{round.round_number}
                    </td>
                    <td style={{ 
                      padding: '0.75rem',
                      color: round.to_par < 0 ? '#22c55e' : round.to_par > 0 ? '#ef4444' : '#fff',
                      fontWeight: '600'
                    }}>
                      {round.score} ({round.to_par > 0 ? '+' : ''}{round.to_par})
                    </td>
                    <td style={{ 
                      padding: '0.75rem',
                      color: getSGColor(round.sg_total),
                      fontWeight: '600'
                    }}>
                      {round.sg_total > 0 ? '+' : ''}{round.sg_total.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem', color: getSGColor(round.sg_ott) }}>
                      {round.sg_ott > 0 ? '+' : ''}{round.sg_ott.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem', color: getSGColor(round.sg_app) }}>
                      {round.sg_app > 0 ? '+' : ''}{round.sg_app.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem', color: getSGColor(round.sg_arg) }}>
                      {round.sg_arg > 0 ? '+' : ''}{round.sg_arg.toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem', color: getSGColor(round.sg_putt) }}>
                      {round.sg_putt > 0 ? '+' : ''}{round.sg_putt.toFixed(2)}
                    </td>
                    <td style={{ 
                      padding: '0.75rem',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.8rem'
                    }}>
                      {round.eagles_or_better > 0 && `🦅${round.eagles_or_better} `}
                      🐦{round.birdies} <span style={{ color: '#22c55e' }}>●{round.pars}</span> ⬜{round.bogies}
                      {round.doubles_or_worse > 0 && <span style={{ color: '#ef4444' }}> ■{round.doubles_or_worse}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Strokes Gained Guide Modal */}
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
                🏌️ Strokes Gained Explained
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
              {/* Introduction */}
              <div style={{ marginBottom: '2rem' }}>
                <p style={{ fontSize: '1.125rem', lineHeight: '1.75', color: 'rgba(255,255,255,0.9)' }}>
                  <strong>Strokes Gained (SG)</strong> is the most advanced golf statistic that answers one simple question: 
                  <em style={{ color: '#3b82f6' }}> "How much better or worse is this player compared to the average PGA Tour player?"</em>
                </p>
                <div style={{ 
                  background: 'rgba(59, 130, 246, 0.1)', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  marginTop: '1rem',
                  borderLeft: '4px solid #3b82f6'
                }}>
                  <div style={{ marginBottom: '0.5rem' }}>• <strong>0.0 = Average PGA Tour performance</strong> (the baseline)</div>
                  <div style={{ marginBottom: '0.5rem' }}>• <strong style={{ color: '#22c55e' }}>Positive numbers (+) = Better than average</strong> (gaining strokes)</div>
                  <div>• <strong style={{ color: '#ef4444' }}>Negative numbers (-) = Worse than average</strong> (losing strokes)</div>
                </div>
              </div>

              {/* SG Categories */}
              <h3 style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2rem' }}>
                🎯 The 5 Main SG Categories
              </h3>

              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* SG:OTT */}
                <div style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '1.25rem', 
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <h4 style={{ color: '#22c55e', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                    1. SG: Off-the-Tee (SG:OTT) 🏌️‍♂️
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>
                    <strong>Measures:</strong> Driving performance (distance + accuracy)
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.925rem' }}>
                    How good is the player at hitting tee shots? Includes both how far AND how straight they hit it.
                  </p>
                </div>

                {/* SG:APP */}
                <div style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '1.25rem', 
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <h4 style={{ color: '#22c55e', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                    2. SG: Approach (SG:APP) 🎯
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>
                    <strong>Measures:</strong> Iron play and approach shots to the green
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.925rem' }}>
                    How close does the player hit it to the pin? <strong style={{ color: '#fbbf24' }}>The MOST important stat for winning tournaments!</strong>
                  </p>
                </div>

                {/* SG:ARG */}
                <div style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '1.25rem', 
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <h4 style={{ color: '#22c55e', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                    3. SG: Around the Green (SG:ARG) 🏌️
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>
                    <strong>Measures:</strong> Short game (chipping, pitching, bunker play)
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.925rem' }}>
                    How good is the player at getting up and down when they miss the green? Includes all shots within 30 yards.
                  </p>
                </div>

                {/* SG:PUTT */}
                <div style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '1.25rem', 
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <h4 style={{ color: '#22c55e', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                    4. SG: Putting (SG:PUTT) ⛳
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>
                    <strong>Measures:</strong> Putting performance
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.925rem' }}>
                    How many putts does it take compared to average? Accounts for distance and shows if a player is making expected putts.
                  </p>
                </div>

                {/* SG:T2G */}
                <div style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '1.25rem', 
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <h4 style={{ color: '#22c55e', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                    5. SG: Tee-to-Green (SG:T2G) 🏌️‍♂️➡️⛳
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>
                    <strong>Measures:</strong> Everything EXCEPT putting
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.925rem' }}>
                    Combined performance of driving, irons, and short game. Shows pure ball-striking ability.
                  </p>
                </div>
              </div>

              {/* Understanding Numbers */}
              <h3 style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2.5rem' }}>
                📊 Understanding the Numbers
              </h3>
              
              <div style={{ 
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#3b82f6' }}>SG Value</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#3b82f6' }}>What It Means</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: '#3b82f6' }}>Player Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={{ padding: '0.75rem', color: '#22c55e', fontWeight: '600' }}>+2.5 or higher</td>
                      <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>Elite performance</td>
                      <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Top 10 players</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={{ padding: '0.75rem', color: '#22c55e', fontWeight: '600' }}>+1.5 to +2.5</td>
                      <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>Excellent</td>
                      <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Top 30 players</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={{ padding: '0.75rem', color: '#22c55e', fontWeight: '600' }}>+0.5 to +1.5</td>
                      <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>Very good</td>
                      <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Top 50-75 players</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={{ padding: '0.75rem', color: '#fbbf24', fontWeight: '600' }}>-0.5 to +0.5</td>
                      <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>Average</td>
                      <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Rank 75-125</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={{ padding: '0.75rem', color: '#ef4444', fontWeight: '600' }}>-1.0 to -0.5</td>
                      <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>Below average</td>
                      <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Struggling</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem', color: '#ef4444', fontWeight: '600' }}>-1.5 or lower</td>
                      <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>Poor</td>
                      <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Bottom tier</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Form Status */}
              <h3 style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2.5rem' }}>
                🔥 Form Status Explained
              </h3>
              
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ 
                  background: 'rgba(34, 197, 94, 0.1)',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(34, 197, 94, 0.3)'
                }}>
                  <h4 style={{ color: '#22c55e', marginBottom: '0.5rem' }}>🔥 HOT</h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.925rem' }}>
                    L5 average is <strong>+0.5 or higher</strong> than career average. Player is in exceptional form right now!
                  </p>
                </div>

                <div style={{ 
                  background: 'rgba(59, 130, 246, 0.1)',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}>
                  <h4 style={{ color: '#3b82f6', marginBottom: '0.5rem' }}>❄️ COLD</h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.925rem' }}>
                    L5 average is <strong>-0.5 or lower</strong> than career average. Player is struggling compared to their usual level.
                  </p>
                </div>

                <div style={{ 
                  background: 'rgba(251, 191, 36, 0.1)',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(251, 191, 36, 0.3)'
                }}>
                  <h4 style={{ color: '#fbbf24', marginBottom: '0.5rem' }}>➡️ NEUTRAL</h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.925rem' }}>
                    L5 is <strong>within 0.5 strokes</strong> of career average. Player is performing at their normal level.
                  </p>
                </div>
              </div>

              {/* Key Takeaway */}
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))',
                padding: '1.5rem',
                borderRadius: '12px',
                marginTop: '2.5rem',
                border: '2px solid rgba(139, 92, 246, 0.3)'
              }}>
                <h3 style={{ color: '#8b5cf6', fontSize: '1.25rem', marginBottom: '1rem' }}>
                  💡 Key Takeaways
                </h3>
                <ul style={{ 
                  color: 'rgba(255,255,255,0.9)', 
                  lineHeight: '1.75',
                  paddingLeft: '1.5rem',
                  margin: 0
                }}>
                  <li style={{ marginBottom: '0.5rem' }}><strong>SG:Total</strong> is the best single stat to evaluate a player</li>
                  <li style={{ marginBottom: '0.5rem' }}><strong>0.0 = Average</strong>, positive is good, negative is bad</li>
                  <li style={{ marginBottom: '0.5rem' }}><strong>L5 vs Career</strong> shows if they're hot or cold right now</li>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Momentum</strong> (L5 - L20) shows if they're trending up or down</li>
                  <li style={{ marginBottom: '0.5rem' }}><strong>SG:APP</strong> (approach) is the most important for winning</li>
                  <li>Each <strong>+1.0 SG = gaining 4 strokes per tournament</strong> (4 rounds)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
