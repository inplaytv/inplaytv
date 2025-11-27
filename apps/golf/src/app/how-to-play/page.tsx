'use client';

import { useState } from 'react';
import styles from './how-to-play.module.css';

type Section = 'fantasy-scoring' | 'game-rules' | 'how-to-enter' | 'captain-rules' | 'tournament-types';

export default function HowToPlayPage() {
  const [activeSection, setActiveSection] = useState<Section>('game-rules');

  return (
    <main style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 100%)',
      padding: '40px 20px'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        gap: '40px'
      }}>
        {/* Side Menu */}
        <aside style={{
          position: 'sticky',
          top: '40px',
          height: 'fit-content',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
          border: '1px solid rgba(212, 175, 55, 0.18)',
          borderRadius: '16px',
          padding: '24px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 700, 
            color: '#fbbf24',
            marginBottom: '20px',
            marginTop: 0
          }}>
            How To Play
          </h2>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => setActiveSection('game-rules')}
              style={{
                padding: '12px 16px',
                background: activeSection === 'game-rules' 
                  ? 'rgba(251, 191, 36, 0.15)' 
                  : 'transparent',
                border: activeSection === 'game-rules'
                  ? '1px solid rgba(251, 191, 36, 0.4)'
                  : '1px solid transparent',
                borderRadius: '8px',
                color: activeSection === 'game-rules' ? '#fbbf24' : 'rgba(255,255,255,0.7)',
                fontSize: '14px',
                fontWeight: activeSection === 'game-rules' ? 600 : 400,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'game-rules') {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'game-rules') {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <i className="fas fa-book" style={{ marginRight: '10px' }}></i>
              Game Rules
            </button>
            
            <button
              onClick={() => setActiveSection('fantasy-scoring')}
              style={{
                padding: '12px 16px',
                background: activeSection === 'fantasy-scoring' 
                  ? 'rgba(251, 191, 36, 0.15)' 
                  : 'transparent',
                border: activeSection === 'fantasy-scoring'
                  ? '1px solid rgba(251, 191, 36, 0.4)'
                  : '1px solid transparent',
                borderRadius: '8px',
                color: activeSection === 'fantasy-scoring' ? '#fbbf24' : 'rgba(255,255,255,0.7)',
                fontSize: '14px',
                fontWeight: activeSection === 'fantasy-scoring' ? 600 : 400,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (activeSection !== 'fantasy-scoring') {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== 'fantasy-scoring') {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <i className="fas fa-chart-line" style={{ marginRight: '10px' }}></i>
              Fantasy Scoring
            </button>
            
            <button
              onClick={() => setActiveSection('how-to-enter')}
              style={{
                padding: '12px 16px',
                background: activeSection === 'how-to-enter' 
                  ? 'rgba(251, 191, 36, 0.15)' 
                  : 'transparent',
                border: activeSection === 'how-to-enter'
                  ? '1px solid rgba(251, 191, 36, 0.4)'
                  : '1px solid transparent',
                borderRadius: '8px',
                color: activeSection === 'how-to-enter' ? '#fbbf24' : 'rgba(255,255,255,0.7)',
                fontSize: '14px',
                fontWeight: activeSection === 'how-to-enter' ? 600 : 400,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: 0.5
              }}
              disabled
            >
              <i className="fas fa-sign-in-alt" style={{ marginRight: '10px' }}></i>
              How To Enter
              <span style={{ 
                fontSize: '10px', 
                marginLeft: '8px',
                padding: '2px 6px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px'
              }}>
                Coming Soon
              </span>
            </button>

            <button
              onClick={() => setActiveSection('captain-rules')}
              style={{
                padding: '12px 16px',
                background: activeSection === 'captain-rules' 
                  ? 'rgba(251, 191, 36, 0.15)' 
                  : 'transparent',
                border: activeSection === 'captain-rules'
                  ? '1px solid rgba(251, 191, 36, 0.4)'
                  : '1px solid transparent',
                borderRadius: '8px',
                color: activeSection === 'captain-rules' ? '#fbbf24' : 'rgba(255,255,255,0.7)',
                fontSize: '14px',
                fontWeight: activeSection === 'captain-rules' ? 600 : 400,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: 0.5
              }}
              disabled
            >
              <i className="fas fa-crown" style={{ marginRight: '10px' }}></i>
              Captain Rules
              <span style={{ 
                fontSize: '10px', 
                marginLeft: '8px',
                padding: '2px 6px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px'
              }}>
                Coming Soon
              </span>
            </button>

            <button
              onClick={() => setActiveSection('tournament-types')}
              style={{
                padding: '12px 16px',
                background: activeSection === 'tournament-types' 
                  ? 'rgba(251, 191, 36, 0.15)' 
                  : 'transparent',
                border: activeSection === 'tournament-types'
                  ? '1px solid rgba(251, 191, 36, 0.4)'
                  : '1px solid transparent',
                borderRadius: '8px',
                color: activeSection === 'tournament-types' ? '#fbbf24' : 'rgba(255,255,255,0.7)',
                fontSize: '14px',
                fontWeight: activeSection === 'tournament-types' ? 600 : 400,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: 0.5
              }}
              disabled
            >
              <i className="fas fa-trophy" style={{ marginRight: '10px' }}></i>
              Tournament Types
              <span style={{ 
                fontSize: '10px', 
                marginLeft: '8px',
                padding: '2px 6px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px'
              }}>
                Coming Soon
              </span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
          border: '1px solid rgba(212, 175, 55, 0.18)',
          borderRadius: '16px',
          padding: '40px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
        }}>
          {activeSection === 'fantasy-scoring' && (
            <div>
              <h1 style={{ 
                fontSize: '32px', 
                fontWeight: 700, 
                color: '#fbbf24',
                marginBottom: '12px',
                marginTop: 0
              }}>
                InPlay Fantasy Scoring System
                <span style={{ 
                  marginLeft: '12px', 
                  fontSize: '14px', 
                  background: '#10b981', 
                  color: '#000', 
                  padding: '4px 12px', 
                  borderRadius: '6px',
                  fontWeight: 600
                }}>
                  ✅ UPDATED v2
                </span>
              </h1>
              <p style={{ 
                fontSize: '16px', 
                color: 'rgba(255,255,255,0.6)', 
                marginBottom: '40px',
                borderLeft: '3px solid #fbbf24',
                paddingLeft: '16px',
                fontStyle: 'italic'
              }}>
                These are the exclusive scoring metrics used throughout InPlay Fantasy Golf Game.
              </p>

              {/* Hole-by-Hole Scoring */}
              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: 600, 
                  color: '#10b981',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                  }}>
                    🏌️
                  </span>
                  Hole-by-Hole Fantasy Scoring Points
                </h2>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{
                    padding: '14px 18px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                      Par
                    </span>
                    <span style={{ fontSize: '22px', color: '#10b981', fontWeight: 700 }}>
                      +1 point
                    </span>
                  </div>
                  <div style={{
                    padding: '14px 18px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                      Birdie
                    </span>
                    <span style={{ fontSize: '22px', color: '#10b981', fontWeight: 700 }}>
                      +3 points
                    </span>
                  </div>
                  <div style={{
                    padding: '14px 18px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                      Eagle
                    </span>
                    <span style={{ fontSize: '22px', color: '#10b981', fontWeight: 700 }}>
                      +6 points
                    </span>
                  </div>
                  <div style={{
                    padding: '14px 18px',
                    background: 'rgba(251, 191, 36, 0.12)',
                    border: '1px solid rgba(251, 191, 36, 0.35)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                      Hole-in-One / Albatross
                    </span>
                    <span style={{ fontSize: '22px', color: '#fbbf24', fontWeight: 700 }}>
                      +10 points
                    </span>
                  </div>
                  <div style={{
                    padding: '14px 18px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                      Bogey
                    </span>
                    <span style={{ fontSize: '22px', color: '#ef4444', fontWeight: 700 }}>
                      -1 point
                    </span>
                  </div>
                  <div style={{
                    padding: '14px 18px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                      Double Bogey+
                    </span>
                    <span style={{ fontSize: '22px', color: '#ef4444', fontWeight: 700 }}>
                      -3 points
                    </span>
                  </div>
                </div>
              </section>

              {/* Round Achievements */}
              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: 600, 
                  color: '#8b5cf6',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(139, 92, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                  }}>
                    🎯
                  </span>
                  Round Achievements (Bonus Points)
                </h2>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{
                    padding: '14px 18px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', fontWeight: 500, display: 'block' }}>
                        Bogey Free Round
                      </span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '3px', display: 'block' }}>
                        Complete 18 holes without a bogey
                      </span>
                    </div>
                    <span style={{ fontSize: '22px', color: '#8b5cf6', fontWeight: 700 }}>
                      +5 points
                    </span>
                  </div>
                  <div style={{
                    padding: '14px 18px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', fontWeight: 500, display: 'block' }}>
                        3 Consecutive Birdies
                      </span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '3px', display: 'block' }}>
                        ONCE PER ROUND only
                      </span>
                    </div>
                    <span style={{ fontSize: '22px', color: '#8b5cf6', fontWeight: 700 }}>
                      +5 points
                    </span>
                  </div>
                  <div style={{
                    padding: '14px 18px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', fontWeight: 500, display: 'block' }}>
                        Under 70 Strokes
                      </span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '3px', display: 'block' }}>
                        Finish round in under 70 strokes
                      </span>
                    </div>
                    <span style={{ fontSize: '22px', color: '#8b5cf6', fontWeight: 700 }}>
                      +3 points
                    </span>
                  </div>
                </div>
              </section>

              {/* Tournament Placement */}
              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: 600, 
                  color: '#fbbf24',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(251, 191, 36, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                  }}>
                    🏆
                  </span>
                  Final Tournament Placement
                </h2>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{
                    padding: '14px 18px',
                    background: 'rgba(251, 191, 36, 0.15)',
                    border: '1px solid rgba(251, 191, 36, 0.4)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                      🥇 1st Place
                    </span>
                    <span style={{ fontSize: '22px', color: '#fbbf24', fontWeight: 700 }}>
                      +25 points
                    </span>
                  </div>
                  <div style={{
                    padding: '14px 18px',
                    background: 'rgba(251, 191, 36, 0.12)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                      🥈 2nd Place
                    </span>
                    <span style={{ fontSize: '22px', color: '#fbbf24', fontWeight: 700 }}>
                      +15 points
                    </span>
                  </div>
                  <div style={{
                    padding: '14px 18px',
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.25)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                      🥉 3rd Place
                    </span>
                    <span style={{ fontSize: '22px', color: '#fbbf24', fontWeight: 700 }}>
                      +10 points
                    </span>
                  </div>
                  <div style={{
                    padding: '14px 18px',
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1px solid rgba(251, 191, 36, 0.2)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                      4th Place
                    </span>
                    <span style={{ fontSize: '22px', color: '#fbbf24', fontWeight: 700 }}>
                      +7 points
                    </span>
                  </div>
                  <div style={{
                    padding: '14px 18px',
                    background: 'rgba(251, 191, 36, 0.06)',
                    border: '1px solid rgba(251, 191, 36, 0.18)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                      5th Place
                    </span>
                    <span style={{ fontSize: '22px', color: '#fbbf24', fontWeight: 700 }}>
                      +5 points
                    </span>
                  </div>
                  <div style={{
                    padding: '14px 18px',
                    background: 'rgba(251, 191, 36, 0.05)',
                    border: '1px solid rgba(251, 191, 36, 0.15)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                      6th-10th Place
                    </span>
                    <span style={{ fontSize: '22px', color: '#fbbf24', fontWeight: 700 }}>
                      +3 points
                    </span>
                  </div>
                  <div style={{
                    padding: '14px 18px',
                    background: 'rgba(251, 191, 36, 0.04)',
                    border: '1px solid rgba(251, 191, 36, 0.12)',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                      11th-20th Place
                    </span>
                    <span style={{ fontSize: '22px', color: '#fbbf24', fontWeight: 700 }}>
                      +2 points
                    </span>
                  </div>
                </div>
              </section>

              {/* Captain Rules */}
              <section>
                <h2 style={{ 
                  fontSize: '24px', 
                  fontWeight: 600, 
                  color: '#f59e0b',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    👑
                  </span>
                  Captain Rules
                </h2>
                <div style={{
                  padding: '24px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '12px'
                }}>
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ 
                      fontSize: '18px', 
                      color: '#10b981', 
                      fontWeight: 600,
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <i className="fas fa-check-circle"></i>
                      What Doubles (2x Points)
                    </h3>
                    <ul style={{ 
                      margin: '0', 
                      paddingLeft: '24px',
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: '15px',
                      lineHeight: '1.8'
                    }}>
                      <li>Hole-by-hole scoring (Par, Birdie, Eagle, Bogey, etc.)</li>
                      <li>Round achievements (Bogey Free, 3 Consecutive Birdies, Under 70)</li>
                    </ul>
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'rgba(255,255,255,0.7)'
                    }}>
                      <strong style={{ color: '#10b981' }}>Example:</strong> Captain gets 2 birdies = 6 points (3 × 2) Doubled = 12 points
                    </div>
                  </div>
                  
                  <div>
                    <h3 style={{ 
                      fontSize: '18px', 
                      color: '#ef4444', 
                      fontWeight: 600,
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <i className="fas fa-times-circle"></i>
                      What Does NOT Double
                    </h3>
                    <ul style={{ 
                      margin: '0', 
                      paddingLeft: '24px',
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: '15px',
                      lineHeight: '1.8'
                    }}>
                      <li>Tournament placement bonuses (1st, 2nd, 3rd place, etc.)</li>
                    </ul>
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'rgba(255,255,255,0.7)'
                    }}>
                      <strong style={{ color: '#ef4444' }}>Example:</strong> Captain wins 1st place = still 25 points (not doubled)
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeSection === 'game-rules' && (
            <div>
              <h1 style={{ 
                fontSize: '32px', 
                fontWeight: 700, 
                color: '#fbbf24',
                marginBottom: '12px',
                marginTop: 0
              }}>
                Game Rules
              </h1>
              <p style={{ 
                fontSize: '16px', 
                color: 'rgba(255,255,255,0.6)', 
                marginBottom: '40px',
                borderLeft: '3px solid #fbbf24',
                paddingLeft: '16px',
                fontStyle: 'italic'
              }}>
                Learn how to play InPlay Fantasy Golf and build your winning scorecard.
              </p>

              {/* Main Rules */}
              <section style={{ marginBottom: '48px' }}>
                <h2 style={{ 
                  fontSize: '24px', 
                  fontWeight: 600, 
                  color: '#10b981',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    ⛳
                  </span>
                  How It Works
                </h2>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{
                    padding: '20px 24px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '16px'
                  }}>
                    <span style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#10b981',
                      color: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      1
                    </span>
                    <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: '1.6' }}>
                      Select just 6 players for your fantasy golf scorecard.
                    </p>
                  </div>

                  <div style={{
                    padding: '20px 24px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '16px'
                  }}>
                    <span style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#10b981',
                      color: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      2
                    </span>
                    <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: '1.6' }}>
                      Choose one player as your team captain for double points.
                    </p>
                  </div>

                  <div style={{
                    padding: '20px 24px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '16px'
                  }}>
                    <span style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#10b981',
                      color: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      3
                    </span>
                    <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: '1.6' }}>
                      Each player's performance is scored based on their real-world golf results.
                    </p>
                  </div>

                  <div style={{
                    padding: '20px 24px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '16px'
                  }}>
                    <span style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#10b981',
                      color: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      4
                    </span>
                    <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: '1.6' }}>
                      Your total scorecard points are the sum of all selected players' fantasy points.
                    </p>
                  </div>

                  <div style={{
                    padding: '20px 24px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '16px'
                  }}>
                    <span style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#10b981',
                      color: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      5
                    </span>
                    <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: '1.6' }}>
                      Create multiple scorecards for different tournament competitions.
                    </p>
                  </div>

                  <div style={{
                    padding: '20px 24px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '16px'
                  }}>
                    <span style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#10b981',
                      color: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      6
                    </span>
                    <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: '1.6' }}>
                      Choose wisely to maximize birdies, eagles, and rare achievements!
                    </p>
                  </div>
                </div>
              </section>

              {/* Pro Tips */}
              <section>
                <h2 style={{ 
                  fontSize: '24px', 
                  fontWeight: 600, 
                  color: '#fbbf24',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(251, 191, 36, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    💡
                  </span>
                  Pro Tips
                </h2>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{
                    padding: '16px 20px',
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <i className="fas fa-lightbulb" style={{ color: '#fbbf24', fontSize: '18px' }}></i>
                    <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                      Balance your budget between star players and value picks
                    </p>
                  </div>
                  <div style={{
                    padding: '16px 20px',
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <i className="fas fa-lightbulb" style={{ color: '#fbbf24', fontSize: '18px' }}></i>
                    <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                      Consider course history and players recent form
                    </p>
                  </div>
                  <div style={{
                    padding: '16px 20px',
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <i className="fas fa-lightbulb" style={{ color: '#fbbf24', fontSize: '18px' }}></i>
                    <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                      Your captain choice is crucial - they score double points!
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
