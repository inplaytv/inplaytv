'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Course {
  id: string;
  name: string;
  location: string;
  course_type: string;
  difficulty_rating: number;
  driving_weight: number;
  approach_weight: number;
  short_game_weight: number;
  putting_weight: number;
}

interface PlayerFit {
  player_name: string;
  golfer_id: string;
  fit_score: number;
  overall_fit: string;
  sg_total_l20: number;
  driving_fit: string;
  approach_fit: string;
  short_game_fit: string;
  putting_fit: string;
}

export default function CourseFitPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [playerFits, setPlayerFits] = useState<PlayerFit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadPlayerFits(selectedCourse.id);
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/golfdata/course-fit');
      const data = await response.json();
      setCourses(data.courses || []);
      if (data.courses && data.courses.length > 0) {
        setSelectedCourse(data.courses[0]);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayerFits = async (courseId: string) => {
    try {
      const response = await fetch(`/api/golfdata/course-fit?courseId=${courseId}`);
      const data = await response.json();
      setPlayerFits(data.players || []);
    } catch (error) {
      console.error('Error loading player fits:', error);
    }
  };

  const getFitColor = (fit: string) => {
    switch (fit) {
      case 'elite': return '#22c55e';
      case 'excellent': return '#22c55e';
      case 'good': return '#3b82f6';
      case 'average': return '#fbbf24';
      case 'poor': return '#ef4444';
      default: return 'rgba(255,255,255,0.5)';
    }
  };

  const getFitIcon = (fit: string) => {
    switch (fit) {
      case 'elite': return '🌟';
      case 'excellent': return '✅';
      case 'good': return '👍';
      case 'average': return '➡️';
      case 'poor': return '⚠️';
      default: return '—';
    }
  };

  const getCourseTypeIcon = (type: string) => {
    switch (type) {
      case 'links': return '🌊';
      case 'parkland': return '🌳';
      case 'desert': return '🏜️';
      case 'resort': return '🏖️';
      case 'stadium': return '🏟️';
      default: return '⛳';
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 100%)',
        padding: '2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ color: '#fff', fontSize: '1.25rem' }}>Loading course data...</div>
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
          <Link href="/golfdata/players" style={{ color: '#3b82f6', marginBottom: '1rem', display: 'inline-block' }}>
            ← Back to Players
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#fff',
              margin: 0,
            }}>
              🏌️ Course Fit Analysis
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
              📖 Course Fit Explained
            </button>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>
            Discover which players are best suited for specific courses based on their SG strengths
          </p>
        </div>

        {/* Course Selector */}
        <div style={{
          background: 'rgba(26, 31, 46, 0.4)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '0.75rem',
            fontWeight: '600'
          }}>
            Select Course
          </label>
          <select
            value={selectedCourse?.id || ''}
            onChange={(e) => {
              const course = courses.find(c => c.id === e.target.value);
              if (course) setSelectedCourse(course);
            }}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            {courses.map(course => (
              <option key={course.id} value={course.id} style={{ background: '#1a1f2e' }}>
                {getCourseTypeIcon(course.course_type)} {course.name} - {course.location}
              </option>
            ))}
          </select>
        </div>

        {/* Course Details */}
        {selectedCourse && (
          <div style={{
            background: 'rgba(26, 31, 46, 0.4)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background decoration */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              fontSize: '200px',
              opacity: 0.03,
              pointerEvents: 'none'
            }}>
              {getCourseTypeIcon(selectedCourse.course_type)}
            </div>

            <h2 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: '700', marginBottom: '1rem' }}>
              {selectedCourse.name}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.125rem', marginBottom: '1.5rem' }}>
              📍 {selectedCourse.location} • {getCourseTypeIcon(selectedCourse.course_type)} {selectedCourse.course_type} • ⭐ {selectedCourse.difficulty_rating}/10
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Driving Weight
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
                  {selectedCourse.driving_weight}%
                </div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Approach Weight
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>
                  {selectedCourse.approach_weight}%
                </div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Short Game Weight
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fbbf24' }}>
                  {selectedCourse.short_game_weight}%
                </div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Putting Weight
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8b5cf6' }}>
                  {selectedCourse.putting_weight}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Best Fit Players */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#fff',
            textAlign: 'left'
          }}>
            Best Fit Players for {selectedCourse?.name}
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {playerFits.map((player, index) => (
            <Link
              key={player.golfer_id}
              href={`/golfdata/players/${player.golfer_id}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'rgba(26, 31, 46, 0.4)',
                  backdropFilter: 'blur(12px)',
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
                {/* Rank Badge */}
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: index < 3 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}>
                  #{index + 1}
                </div>

                {/* Player Name */}
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#fff',
                  marginBottom: '0.75rem',
                  paddingRight: '50px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  {player.player_name}
                </h3>

                {/* Fit Score */}
                <div style={{
                  background: `linear-gradient(135deg, ${getFitColor(player.overall_fit)}20, ${getFitColor(player.overall_fit)}10)`,
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  border: `1px solid ${getFitColor(player.overall_fit)}40`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>
                        FIT SCORE
                      </div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: getFitColor(player.overall_fit) }}>
                        {player.fit_score}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '2.5rem' }}>
                        {getFitIcon(player.overall_fit)}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: getFitColor(player.overall_fit),
                        textTransform: 'uppercase'
                      }}>
                        {player.overall_fit}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fit Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.125rem' }}>
                      DRIVING
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', color: getFitColor(player.driving_fit) }}>
                      {player.driving_fit}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.125rem' }}>
                      APPROACH
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', color: getFitColor(player.approach_fit) }}>
                      {player.approach_fit}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.125rem' }}>
                      SHORT GAME
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', color: getFitColor(player.short_game_fit) }}>
                      {player.short_game_fit}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.125rem' }}>
                      PUTTING
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', color: getFitColor(player.putting_fit) }}>
                      {player.putting_fit}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Course Fit Explained Modal */}
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
                🎯 Course Fit Analysis Explained
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
                  <strong>Course Fit Analysis</strong> matches a player's strengths (measured by Strokes Gained) to the specific demands of each golf course. 
                  <em style={{ color: '#3b82f6' }}> Different courses reward different skills - some favor long hitters, others reward accuracy and putting.</em>
                </p>
              </div>

              {/* How Course Weights Work */}
              <h3 style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2rem' }}>
                🎯 How Course Weights Work
              </h3>
              <div style={{ marginBottom: '2rem' }}>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.75', color: 'rgba(255,255,255,0.9)', marginBottom: '1rem' }}>
                  Each course has four skill weights that add up to 100%:
                </p>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    padding: '1.25rem', 
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <h4 style={{ color: '#3b82f6', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                      🚀 Driving Weight
                    </h4>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.925rem' }}>
                      Importance of distance and accuracy off the tee
                    </p>
                  </div>
                  <div style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    padding: '1.25rem', 
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <h4 style={{ color: '#22c55e', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                      🎯 Approach Weight
                    </h4>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.925rem' }}>
                      Importance of iron play and approach shots
                    </p>
                  </div>
                  <div style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    padding: '1.25rem', 
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <h4 style={{ color: '#fbbf24', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                      ⛳ Short Game Weight
                    </h4>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.925rem' }}>
                      Importance of chipping and scrambling
                    </p>
                  </div>
                  <div style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    padding: '1.25rem', 
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <h4 style={{ color: '#a855f7', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                      🏌️ Putting Weight
                    </h4>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.925rem' }}>
                      Importance of putting performance
                    </p>
                  </div>
                </div>
                <div style={{ 
                  background: 'rgba(59, 130, 246, 0.1)', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  marginTop: '1rem',
                  borderLeft: '4px solid #3b82f6'
                }}>
                  <strong>Example:</strong> A long, wide-open course might have 40% Driving, 35% Approach, 10% Short Game, 15% Putting. 
                  This course rewards bombers who can take advantage of the extra distance.
                </div>
              </div>

              {/* Calculating Fit Score */}
              <h3 style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2rem' }}>
                🧮 Calculating Fit Score
              </h3>
              <div style={{ marginBottom: '2rem' }}>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.75', color: 'rgba(255,255,255,0.9)', marginBottom: '1rem' }}>
                  We calculate a player's fit score by matching their SG performance to the course weights:
                </p>
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  padding: '1.5rem', 
                  borderRadius: '8px', 
                  marginBottom: '1rem', 
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  color: '#22c55e',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  Fit Score = (SG_Driving × Driving_Weight) + (SG_Approach × Approach_Weight) + (SG_Short × Short_Weight) + (SG_Putting × Putting_Weight)
                </div>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.75', color: 'rgba(255,255,255,0.9)' }}>
                  Higher fit scores indicate players whose strengths align perfectly with what the course demands.
                </p>
              </div>

              {/* Fit Rating Categories */}
              <h3 style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2rem' }}>
                📊 Fit Rating Categories
              </h3>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '1.25rem', 
                  borderRadius: '12px',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderLeft: '4px solid #22c55e'
                }}>
                  <h4 style={{ color: '#22c55e', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                    🏆 ELITE
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.925rem' }}>
                    Perfect match - player excels in all key areas for this course
                  </p>
                </div>
                <div style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '1.25rem', 
                  borderRadius: '12px',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderLeft: '4px solid #3b82f6'
                }}>
                  <h4 style={{ color: '#3b82f6', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                    ⭐ EXCELLENT / GOOD
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.925rem' }}>
                    Strong fit - player's strengths align well with course demands
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
                    📈 AVERAGE
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.925rem' }}>
                    Moderate fit - some strengths match, some don't
                  </p>
                </div>
                <div style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '1.25rem', 
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderLeft: '4px solid #ef4444'
                }}>
                  <h4 style={{ color: '#ef4444', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                    ⚠️ POOR / WEAK
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.925rem' }}>
                    Mismatch - player's weaknesses exposed by course demands
                  </p>
                </div>
              </div>

              {/* Real-World Example */}
              <h3 style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2rem' }}>
                🌍 Real-World Example
              </h3>
              <div style={{ marginBottom: '2rem' }}>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.75', color: 'rgba(255,255,255,0.9)', marginBottom: '1rem' }}>
                  Consider Augusta National (Masters) which heavily rewards approach play and putting:
                </p>
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  padding: '1.5rem', 
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ marginBottom: '0.5rem' }}>• Driving Weight: <strong style={{ color: '#3b82f6' }}>15%</strong> (relatively short course)</div>
                  <div style={{ marginBottom: '0.5rem' }}>• Approach Weight: <strong style={{ color: '#22c55e' }}>45%</strong> (demanding iron play)</div>
                  <div style={{ marginBottom: '0.5rem' }}>• Short Game Weight: <strong style={{ color: '#fbbf24' }}>15%</strong> (tough around greens)</div>
                  <div>• Putting Weight: <strong style={{ color: '#a855f7' }}>25%</strong> (fast, undulating greens)</div>
                </div>
                <p style={{ fontSize: '1.05rem', lineHeight: '1.75', color: 'rgba(255,255,255,0.9)' }}>
                  A player with elite approach play (+2.0 SG) and great putting (+1.5 SG) would have a much higher fit score 
                  than a long hitter (+2.0 SG Driving) with average irons (0.0 SG Approach).
                </p>
              </div>

              {/* How to Use This Data */}
              <h3 style={{ color: '#3b82f6', fontSize: '1.5rem', marginBottom: '1rem', marginTop: '2rem' }}>
                💡 How to Use This Data
              </h3>
              <div style={{ 
                background: 'rgba(255,255,255,0.05)', 
                padding: '1.5rem', 
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                marginBottom: '1rem'
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#22c55e' }}>🎮 Fantasy Golf:</strong>
                  <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '0.25rem', fontSize: '0.925rem' }}>
                    Target players with high fit scores for specific tournaments
                  </p>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#fbbf24' }}>💰 Betting:</strong>
                  <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '0.25rem', fontSize: '0.925rem' }}>
                    Identify value when bookies underrate course fit
                  </p>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#3b82f6' }}>🎯 Tournament Predictions:</strong>
                  <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '0.25rem', fontSize: '0.925rem' }}>
                    Course fit is a strong predictor of performance
                  </p>
                </div>
                <div>
                  <strong style={{ color: '#a855f7' }}>📊 Player Analysis:</strong>
                  <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '0.25rem', fontSize: '0.925rem' }}>
                    Understand which venues suit different playing styles
                  </p>
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
                  Course fit becomes even more powerful when combined with recent form data. A player in great form with an elite course fit is often a winning combination!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
