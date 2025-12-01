'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface RankingPlayer {
  datagolf_rank: number;
  dg_id: number;
  player_name: string;
  dg_skill_estimate: number;
  owgr_rank: number;
  country: string;
  primary_tour: string;
}

interface SkillRating {
  player_name: string;
  dg_id: number;
  sg_putt: number;
  sg_arg: number;
  sg_app: number;
  sg_ott: number;
  sg_total: number;
  driving_dist: number;
  driving_acc: number;
}

export default function GolfDataPage() {
  const [activeTab, setActiveTab] = useState<'rankings' | 'skills' | 'predictions' | 'live' | 'betting'>('rankings');
  const [rankings, setRankings] = useState<RankingPlayer[]>([]);
  const [skills, setSkills] = useState<SkillRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load Rankings Data
  useEffect(() => {
    if (activeTab === 'rankings') {
      loadRankings();
    } else if (activeTab === 'skills') {
      loadSkills();
    }
  }, [activeTab]);

  const loadRankings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/golfdata/rankings');
      if (!response.ok) throw new Error('Failed to load rankings');
      const data = await response.json();
      setRankings(data.rankings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadSkills = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/golfdata/skills');
      if (!response.ok) throw new Error('Failed to load skills');
      const data = await response.json();
      setSkills(data.players || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on search
  const filteredRankings = rankings.filter(p => 
    p.player_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSkills = skills.filter(p => 
    p.player_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1a', padding: '2rem' }}>
      {/* Page Header */}
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            📊 GOLFDATA
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>
            Powered by DataGolf API • Real-time rankings, predictions & analytics
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '2rem', 
          borderBottom: '2px solid rgba(255,255,255,0.1)',
          paddingBottom: '0'
        }}>
          {[
            { id: 'rankings', label: '👑 Rankings', icon: '📈' },
            { id: 'skills', label: '💪 Skills', icon: '⚡' },
            { id: 'predictions', label: '🎯 Predictions', icon: '🔮' },
            { id: 'live', label: '🔴 Live', icon: '⏱️' },
            { id: 'betting', label: '💰 Tools', icon: '🎲' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: activeTab === tab.id 
                  ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)' 
                  : 'transparent',
                color: activeTab === tab.id ? '#0a0f1a' : 'rgba(255,255,255,0.7)',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                transition: 'all 0.2s',
                borderBottom: activeTab === tab.id ? '3px solid #4ade80' : '3px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ 
          background: 'rgba(255,255,255,0.03)', 
          borderRadius: '12px', 
          padding: '2rem',
          minHeight: '600px'
        }}>
          {/* Rankings Tab */}
          {activeTab === 'rankings' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.5rem' }}>
                    DataGolf World Rankings
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                    Top 50 players by skill estimate • Updated daily
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="🔍 Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    color: '#fff',
                    fontSize: '0.95rem',
                    width: '300px'
                  }}
                />
              </div>

              {loading && (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.6)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                  Loading rankings...
                </div>
              )}

              {error && (
                <div style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '1rem',
                  color: '#ef4444',
                  marginBottom: '1rem'
                }}>
                  ❌ {error}
                </div>
              )}

              {!loading && !error && filteredRankings.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem' }}>RANK</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem' }}>PLAYER</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem' }}>SKILL</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem' }}>OWGR</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem' }}>DIFF</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem' }}>TOUR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRankings.slice(0, 50).map((player, idx) => {
                        const diff = player.owgr_rank - player.datagolf_rank;
                        const isUndervalued = diff > 5;
                        const isOvervalued = diff < -5;
                        
                        return (
                          <tr 
                            key={player.dg_id}
                            style={{ 
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                              transition: 'background 0.2s'
                            }}
                          >
                            <td style={{ padding: '1rem', color: '#fff', fontWeight: 'bold' }}>
                              <span style={{
                                background: player.datagolf_rank <= 3 
                                  ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                                  : player.datagolf_rank <= 10
                                  ? 'linear-gradient(135deg, #94a3b8, #64748b)'
                                  : 'rgba(255,255,255,0.1)',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '6px',
                                display: 'inline-block',
                                minWidth: '40px',
                                textAlign: 'center',
                                color: player.datagolf_rank <= 10 ? '#000' : '#fff'
                              }}>
                                {player.datagolf_rank}
                              </span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>{getFlagEmoji(player.country)}</span>
                                <div>
                                  <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.95rem' }}>
                                    {player.player_name}
                                  </div>
                                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                                    {player.country}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ 
                                  color: '#4ade80', 
                                  fontWeight: 'bold', 
                                  fontSize: '1.1rem' 
                                }}>
                                  {player.dg_skill_estimate.toFixed(2)}
                                </span>
                                <div style={{
                                  width: '80px',
                                  height: '6px',
                                  background: 'rgba(255,255,255,0.1)',
                                  borderRadius: '3px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    width: `${Math.min((player.dg_skill_estimate / 3) * 100, 100)}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #4ade80, #22c55e)',
                                    borderRadius: '3px'
                                  }} />
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.7)' }}>
                              #{player.owgr_rank}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{
                                background: isUndervalued 
                                  ? 'rgba(34, 197, 94, 0.2)' 
                                  : isOvervalued 
                                  ? 'rgba(239, 68, 68, 0.2)'
                                  : 'rgba(255,255,255,0.05)',
                                color: isUndervalued 
                                  ? '#22c55e' 
                                  : isOvervalued 
                                  ? '#ef4444'
                                  : 'rgba(255,255,255,0.5)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                fontWeight: '600'
                              }}>
                                {diff > 0 ? `↑${diff}` : diff < 0 ? `↓${Math.abs(diff)}` : '—'}
                              </span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{
                                background: 'rgba(59, 130, 246, 0.2)',
                                color: '#3b82f6',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                fontWeight: '600'
                              }}>
                                {player.primary_tour}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && !error && filteredRankings.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.6)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                  No players found matching "{searchTerm}"
                </div>
              )}
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.5rem' }}>
                    Player Skill Ratings
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                    Strokes gained breakdown by category • Based on ShotLink data
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="🔍 Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    color: '#fff',
                    fontSize: '0.95rem',
                    width: '300px'
                  }}
                />
              </div>

              {loading && (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.6)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                  Loading skill ratings...
                </div>
              )}

              {error && (
                <div style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '1rem',
                  color: '#ef4444',
                  marginBottom: '1rem'
                }}>
                  ❌ {error}
                </div>
              )}

              {!loading && !error && filteredSkills.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem' }}>PLAYER</th>
                        <th style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem' }}>SG: TOTAL</th>
                        <th style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem' }}>SG: OTT</th>
                        <th style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem' }}>SG: APP</th>
                        <th style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem' }}>SG: ARG</th>
                        <th style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem' }}>SG: PUTT</th>
                        <th style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem' }}>DIST</th>
                        <th style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '0.875rem' }}>ACC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSkills.slice(0, 50).map((player, idx) => (
                        <tr 
                          key={player.dg_id}
                          style={{ 
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '1rem' }}>
                            <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.95rem' }}>
                              {player.player_name}
                            </div>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span style={{ 
                              color: player.sg_total > 0 ? '#4ade80' : '#ef4444',
                              fontWeight: 'bold',
                              fontSize: '1rem'
                            }}>
                              {player.sg_total > 0 ? '+' : ''}{player.sg_total.toFixed(2)}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            {renderSGBar(player.sg_ott)}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            {renderSGBar(player.sg_app)}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            {renderSGBar(player.sg_arg)}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            {renderSGBar(player.sg_putt)}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span style={{ 
                              color: player.driving_dist > 5 ? '#4ade80' : player.driving_dist < -5 ? '#ef4444' : 'rgba(255,255,255,0.7)',
                              fontSize: '0.9rem',
                              fontWeight: '600'
                            }}>
                              {player.driving_dist > 0 ? '+' : ''}{player.driving_dist.toFixed(1)}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <span style={{ 
                              color: player.driving_acc > 0.01 ? '#4ade80' : player.driving_acc < -0.01 ? '#ef4444' : 'rgba(255,255,255,0.7)',
                              fontSize: '0.9rem',
                              fontWeight: '600'
                            }}>
                              {player.driving_acc > 0 ? '+' : ''}{(player.driving_acc * 100).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && !error && filteredSkills.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.6)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                  No players found matching "{searchTerm}"
                </div>
              )}
            </div>
          )}

          {/* Coming Soon Tabs */}
          {activeTab === 'predictions' && <ComingSoonTab icon="🎯" title="Pre-Tournament Predictions" features={['Win probabilities', 'Top 5/10/20 finish odds', 'Course fit analysis', 'Model comparison']} />}
          {activeTab === 'live' && <ComingSoonTab icon="🔴" title="Live Tournament Stats" features={['Real-time scoring updates', 'Win probability tracker', 'Live strokes-gained', 'Hole-by-hole analysis']} />}
          {activeTab === 'betting' && <ComingSoonTab icon="💰" title="Betting & DFS Tools" features={['Odds comparison (11 books)', 'Value finder', 'Fantasy projections', 'Matchup analyzer']} />}
        </div>
      </div>
    </div>
  );
}

// Helper function to render SG bars
function renderSGBar(value: number) {
  const maxVal = 1.5;
  const percentage = Math.min(Math.abs(value / maxVal) * 100, 100);
  const isPositive = value > 0;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
      <span style={{ 
        color: isPositive ? '#4ade80' : '#ef4444',
        fontSize: '0.85rem',
        fontWeight: '600'
      }}>
        {value > 0 ? '+' : ''}{value.toFixed(2)}
      </span>
      <div style={{
        width: '60px',
        height: '4px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: isPositive 
            ? 'linear-gradient(90deg, #4ade80, #22c55e)'
            : 'linear-gradient(90deg, #ef4444, #dc2626)',
          borderRadius: '2px'
        }} />
      </div>
    </div>
  );
}

// Coming Soon component
function ComingSoonTab({ icon, title, features }: { icon: string; title: string; features: string[] }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.7)' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{icon}</div>
      <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#fff', marginBottom: '1rem' }}>
        {title}
      </h3>
      <p style={{ fontSize: '1rem', marginBottom: '2rem', color: 'rgba(255,255,255,0.6)' }}>
        Coming Soon
      </p>
      <div style={{ 
        display: 'inline-block',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'left'
      }}>
        <h4 style={{ color: '#4ade80', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: '600' }}>
          PLANNED FEATURES:
        </h4>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {features.map((feature, idx) => (
            <li key={idx} style={{ padding: '0.5rem 0', color: 'rgba(255,255,255,0.7)' }}>
              ✓ {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Helper to get flag emoji
function getFlagEmoji(country: string): string {
  const countryFlags: { [key: string]: string } = {
    'USA': '🇺🇸', 'ESP': '🇪🇸', 'NOR': '🇳🇴', 'NIR': '🇬🇧', 'ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'SCO': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'IRL': '🇮🇪', 'AUS': '🇦🇺', 'CAN': '🇨🇦', 'JPN': '🇯🇵',
    'KOR': '🇰🇷', 'RSA': '🇿🇦', 'MEX': '🇲🇽', 'SWE': '🇸🇪', 'DEN': '🇩🇰',
    'GER': '🇩🇪', 'FRA': '🇫🇷', 'ITA': '🇮🇹', 'CHI': '🇨🇱', 'ARG': '🇦🇷',
    'COL': '🇨🇴', 'VEN': '🇻🇪', 'CHN': '🇨🇳', 'TPE': '🇹🇼', 'IND': '🇮🇳',
    'NZL': '🇳🇿', 'WAL': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'BEL': '🇧🇪', 'NED': '🇳🇱', 'AUT': '🇦🇹'
  };
  return countryFlags[country] || '🌍';
}
