'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Golfer {
  id: string;
  name: string;
  country: string;
  image_url: string;
}

interface Tournament {
  id: string;
  name: string;
  course_name: string;
  start_date: string;
  end_date: string;
}

interface Prediction {
  id: string;
  golfer: Golfer;
  tournament?: Tournament;
  win_probability: number;
  top_5_probability: number;
  top_10_probability: number;
  top_20_probability: number;
  confidence_score: number;
  course_fit_score: number;
  form_score: number;
  historical_score: number;
  sg_total_l20: number;
}

interface TournamentWithPredictions {
  id: string;
  name: string;
  course_name: string;
  start_date: string;
  end_date: string;
  topPredictions: Prediction[];
}

export default function PredictionsPage() {
  const [tournaments, setTournaments] = useState<TournamentWithPredictions[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<TournamentWithPredictions | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const response = await fetch('/api/golfdata/predictions');
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

  const selectTournament = async (tournament: TournamentWithPredictions) => {
    setSelectedTournament(tournament);
    setLoading(true);
    try {
      const response = await fetch(`/api/golfdata/predictions?tournamentId=${tournament.id}&limit=20`);
      const data = await response.json();
      setPredictions(data.predictions || []);
    } catch (error) {
      console.error('Error loading predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return '#22c55e';
    if (confidence >= 75) return '#3b82f6';
    if (confidence >= 65) return '#fbbf24';
    return '#ef4444';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 85) return 'HIGH';
    if (confidence >= 75) return 'GOOD';
    if (confidence >= 65) return 'MODERATE';
    return 'LOW';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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
        <div style={{ color: '#fff', fontSize: '1.25rem' }}>Loading predictions...</div>
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
              🎯 Tournament Predictions
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
              📖 How Predictions Work
            </button>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>
            AI-powered winner predictions with confidence scores and key factors
          </p>
        </div>

        {/* Tournament Selector */}
        <div style={{
          background: 'rgba(26, 31, 46, 0.4)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', display: 'block', marginBottom: '0.75rem' }}>
            Select Tournament
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
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            {tournaments.map(tournament => (
              <option key={tournament.id} value={tournament.id} style={{ background: '#1a1f2e' }}>
                {tournament.name} • {tournament.course_name} • {formatDate(tournament.start_date)}
              </option>
            ))}
          </select>
        </div>

        {/* Tournament Info Card */}
        {selectedTournament && (
          <div style={{
            background: 'rgba(26, 31, 46, 0.4)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem' }}>
              {selectedTournament.name}
            </h2>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>
              <div>📍 {selectedTournament.course_name}</div>
              <div>📅 {formatDate(selectedTournament.start_date)} - {formatDate(selectedTournament.end_date)}</div>
            </div>
          </div>
        )}

        {/* Predictions Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '3rem' }}>
            Loading predictions...
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {predictions.map((prediction, index) => (
              <Link
                key={prediction.id}
                href={`/golfdata/players/${prediction.golfer.id}`}
                style={{
                  background: 'rgba(26, 31, 46, 0.4)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textDecoration: 'none',
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: '1.5rem',
                  alignItems: 'center',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
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
                {/* Rank Badge */}
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  background: index < 3
                    ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                    : 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: index < 3 ? '#1a1f2e' : '#fff',
                  border: index < 3 ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)'
                }}>
                  #{index + 1}
                </div>

                {/* Player Info & Stats */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', margin: 0 }}>
                      {prediction.golfer.name}
                    </h3>
                    <span style={{ fontSize: '1.25rem' }}>{prediction.golfer.country}</span>
                    <div style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '6px',
                      background: `${getConfidenceColor(prediction.confidence_score)}20`,
                      border: `1px solid ${getConfidenceColor(prediction.confidence_score)}`,
                      color: getConfidenceColor(prediction.confidence_score),
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {getConfidenceBadge(prediction.confidence_score)} CONFIDENCE
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>
                        Course Fit
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#3b82f6' }}>
                        {prediction.course_fit_score.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>
                        Form
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#22c55e' }}>
                        {prediction.form_score.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>
                        History
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fbbf24' }}>
                        {prediction.historical_score.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>
                        SG L20
                      </div>
                      <div style={{
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: prediction.sg_total_l20 > 0 ? '#22c55e' : '#ef4444'
                      }}>
                        {prediction.sg_total_l20 > 0 ? '+' : ''}{prediction.sg_total_l20.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Win Probability */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '3rem', fontWeight: '700', color: '#fff', lineHeight: 1 }}>
                    {prediction.win_probability.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                    Win Probability
                  </div>
                  <div style={{
                    marginTop: '0.75rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                    fontSize: '0.75rem'
                  }}>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.5)' }}>Top 5</div>
                      <div style={{ color: '#fff', fontWeight: '600' }}>{prediction.top_5_probability.toFixed(0)}%</div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.5)' }}>Top 10</div>
                      <div style={{ color: '#fff', fontWeight: '600' }}>{prediction.top_10_probability.toFixed(0)}%</div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.5)' }}>Top 20</div>
                      <div style={{ color: '#fff', fontWeight: '600' }}>{prediction.top_20_probability.toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* How Predictions Work Modal */}
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
                🎯 How Tournament Predictions Work
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
                  Our <strong>AI-powered prediction system</strong> analyzes multiple factors to forecast tournament outcomes.
                  <em style={{ color: '#3b82f6' }}> The model combines course fit, recent form, historical data, and strokes gained metrics to generate win probabilities.</em>
                </p>
              </div>

              {/* Key Factors */}
              <h3 style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2rem' }}>
                🎯 Key Prediction Factors
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
                    🎯 Course Fit (30% weight)
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.925rem' }}>
                    How well the player's skills match the course demands based on Strokes Gained analysis
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
                    🔥 Recent Form (25% weight)
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.925rem' }}>
                    Performance in last 5-20 rounds including momentum and consistency trends
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
                    📊 Venue History (20% weight)
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.925rem' }}>
                    Past results at this specific course and similar course types
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
                    ⚡ Strokes Gained (25% weight)
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.925rem' }}>
                    Overall skill level measured by SG:Total in last 20 rounds
                  </p>
                </div>
              </div>

              {/* Understanding Probabilities */}
              <h3 style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2rem' }}>
                📊 Understanding Win Probabilities
              </h3>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                padding: '1.5rem', 
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                marginBottom: '2rem'
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#22c55e' }}>15%+</strong> - Elite contender, strong favorite
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#3b82f6' }}>10-15%</strong> - Top tier pick, high chance
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#fbbf24' }}>5-10%</strong> - Solid contender, good value
                </div>
                <div>
                  <strong style={{ color: '#ef4444' }}>{'<5%'}</strong> - Longshot, needs things to break right
                </div>
              </div>

              {/* Confidence Scores */}
              <h3 style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2rem' }}>
                🎯 Confidence Scores
              </h3>
              <div style={{ marginBottom: '2rem' }}>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.75', color: 'rgba(255,255,255,0.9)', marginBottom: '1rem' }}>
                  Confidence indicates how certain the model is about its prediction:
                </p>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      background: 'rgba(34, 197, 94, 0.2)',
                      border: '1px solid #22c55e',
                      color: '#22c55e',
                      fontWeight: '600',
                      minWidth: '120px',
                      textAlign: 'center'
                    }}>
                      HIGH (85%+)
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.8)' }}>
                      Strong data, clear favorite, reliable prediction
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      background: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid #3b82f6',
                      color: '#3b82f6',
                      fontWeight: '600',
                      minWidth: '120px',
                      textAlign: 'center'
                    }}>
                      GOOD (75-85%)
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.8)' }}>
                      Solid data, trustworthy but competitive field
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      background: 'rgba(251, 191, 36, 0.2)',
                      border: '1px solid #fbbf24',
                      color: '#fbbf24',
                      fontWeight: '600',
                      minWidth: '120px',
                      textAlign: 'center'
                    }}>
                      MODERATE (65-75%)
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.8)' }}>
                      Limited data or wide-open tournament
                    </div>
                  </div>
                </div>
              </div>

              {/* How to Use */}
              <h3 style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2rem' }}>
                💡 How to Use Predictions
              </h3>
              <div style={{ 
                background: 'rgba(255,255,255,0.05)', 
                padding: '1.5rem', 
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                marginBottom: '1rem'
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#22c55e' }}>✓ Fantasy Golf:</strong> Stack top 3-5 predictions in your lineups
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#3b82f6' }}>✓ Betting:</strong> Look for value when odds don't match our probabilities
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#fbbf24' }}>✓ Research:</strong> Check individual factors to understand WHY a player is favored
                </div>
                <div>
                  <strong style={{ color: '#a855f7' }}>✓ Combine with Course Fit:</strong> Cross-reference with Course Fit Analysis for deeper insights
                </div>
              </div>

              <div style={{ 
                background: 'rgba(34, 197, 94, 0.1)', 
                padding: '1.5rem', 
                borderRadius: '8px',
                marginTop: '2rem',
                borderLeft: '4px solid #22c55e'
              }}>
                <strong style={{ color: '#22c55e', fontSize: '1.125rem' }}>💡 Pro Tip</strong>
                <p style={{ marginTop: '0.75rem', marginBottom: 0, lineHeight: '1.75', color: 'rgba(255,255,255,0.9)' }}>
                  The best bets often come from players with high win probability (10%+) combined with high course fit and high confidence scores. These represent the model's strongest convictions!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
