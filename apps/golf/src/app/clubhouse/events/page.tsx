'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabaseClient';
import RequireAuth from '@/components/RequireAuth';

interface Event {
  id: string;
  name: string;
  venue?: string;
  description: string | null;
  entry_credits: number;
  max_entries: number;
  current_entries: number;
  status: string;
  registration_opens: string;
  registration_closes: string;
  start_date: string;
  end_date: string;
}

// Helper function to calculate time remaining (countdown only for last 24 hours)
function getTimeRemaining(dateString: string): string {
  const now = new Date();
  const target = new Date(dateString);
  const diff = target.getTime() - now.getTime();
  
  if (diff <= 0) return 'Closed';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  // Show countdown only for last 24 hours
  if (days > 1) {
    return target.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }
  if (days === 1) return `${days} day ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function ClubhouseEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCredits, setUserCredits] = useState(0);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(0.15);
  const [backgroundOverlay, setBackgroundOverlay] = useState<number>(0.4);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadData();
    loadBackground();
    
    // Update countdown every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 60 seconds
    
    return () => clearInterval(timer);
  }, []);

  async function loadBackground() {
    try {
      const response = await fetch('/api/settings/page-background?page=clubhouse_events_list_background');
      const data = await response.json();
      if (data.backgroundUrl && data.backgroundUrl !== 'none') {
        setBackgroundImage(data.backgroundUrl);
        setBackgroundOpacity(data.opacity ?? 0.15);
        setBackgroundOverlay(data.overlay ?? 0.4);
      }
    } catch (error) {
      console.error('Error loading background:', error);
    }
  }

  async function loadData() {
    const supabase = createClient();
    
    // Load user credits
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: wallet, error: walletError } = await supabase
        .from('clubhouse_wallets')
        .select('balance_credits')
        .eq('user_id', user.id)
        .maybeSingle(); // Returns null if no rows instead of error
      
      if (wallet) {
        setUserCredits(wallet.balance_credits);
      } else if (walletError) {
        console.warn('Wallet query error:', walletError);
      }
      // If no wallet exists, userCredits stays at 0
    }

    // Load events (add timestamp to force fresh data)
    const res = await fetch(`/api/clubhouse/events?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      setEvents(data);
    }
    
    setLoading(false);
  }

  if (loading) {
    return (
      <RequireAuth>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div style={{ 
        minHeight: '100vh',
        background: backgroundImage 
          ? `linear-gradient(135deg, rgba(15, 23, 42, ${backgroundOverlay}) 0%, rgba(30, 41, 59, ${backgroundOverlay}) 100%)`
          : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        position: 'relative',
        padding: '2rem',
      }}>
        {backgroundImage && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            opacity: backgroundOpacity,
            zIndex: 0,
          }} />
        )}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header with Credits */}
          <div style={{ 
            marginBottom: '2rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <h1 style={{ 
              color: '#fff', 
              margin: 0,
              fontSize: '2rem',
              fontWeight: 700,
            }}>
              Clubhouse Events
            </h1>
            <div style={{ 
              padding: '0.75rem 1.5rem', 
              background: 'rgba(34, 139, 34, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(34, 139, 34, 0.2)',
              color: '#228b22',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '1.1rem',
            }}>
              💎 {userCredits} Credits
            </div>
          </div>

          {events.length === 0 ? (
            <div style={{ 
              padding: '3rem', 
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
            }}>
              <p style={{ fontSize: '1.1rem', color: '#94a3b8', margin: 0 }}>
                No events available at the moment
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {events.map((event) => (
                  <div
                    key={event.id}
                    style={{
                      padding: '2rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(20, 184, 166, 0.3)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Event Header */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      marginBottom: '1.5rem',
                      gap: '1rem',
                      flexWrap: 'wrap',
                    }}>
                      <div>
                        {/* ✅ NEW CODE LOADED - v2.0 */}
                        <h2 style={{ 
                          color: '#fff', 
                          margin: '0 0 0.25rem 0',
                          fontSize: '1.5rem',
                          fontWeight: 700,
                        }}>
                          {event.venue || event.name}
                        </h2>
                        {event.venue && event.name && (
                          <h3 style={{ 
                            color: 'rgba(255, 255, 255, 0.8)', 
                            margin: '0 0 0.5rem 0',
                            fontSize: '1.1rem',
                            fontWeight: 500,
                          }}>
                            {event.name}
                          </h3>
                        )}
                      </div>
                      <div style={{ 
                        padding: '0.5rem 1rem',
                        background: event.status === 'open' 
                          ? 'rgba(34, 197, 94, 0.1)' 
                          : event.status === 'active'
                          ? 'rgba(234, 179, 8, 0.1)'
                          : event.status === 'completed'
                          ? 'rgba(148, 163, 184, 0.1)'
                          : 'rgba(99, 102, 241, 0.1)',
                        border: `1px solid ${
                          event.status === 'open' 
                            ? 'rgba(34, 197, 94, 0.3)' 
                            : event.status === 'active'
                            ? 'rgba(234, 179, 8, 0.3)'
                            : event.status === 'completed'
                            ? 'rgba(148, 163, 184, 0.3)'
                            : 'rgba(99, 102, 241, 0.3)'
                        }`,
                        color: event.status === 'open' 
                          ? '#22c55e' 
                          : event.status === 'active'
                          ? '#eab308'
                          : event.status === 'completed'
                          ? '#94a3b8'
                          : '#6366f1',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}>
                        {event.status === 'open' 
                          ? '🟢 Open (Registration)' 
                          : event.status === 'active'
                          ? '🔴 Active (Playing)'
                          : event.status === 'completed'
                          ? '✓ Completed'
                          : event.status === 'upcoming'
                          ? '⏳ Upcoming'
                          : event.status}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '1rem',
                    }}>
                      {/* Entry Cost */}
                      <div style={{
                        padding: '1rem',
                        background: 'rgba(20, 184, 166, 0.1)',
                        border: '1px solid rgba(20, 184, 166, 0.2)',
                        borderRadius: '12px',
                      }}>
                        <div style={{ 
                          color: '#64748b', 
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          marginBottom: '0.5rem',
                        }}>
                          Entry Cost
                        </div>
                        <div style={{ 
                          color: '#228b22', 
                          fontSize: '1.5rem',
                          fontWeight: 700,
                        }}>
                          {event.entry_credits}
                          <span style={{ fontSize: '0.875rem', marginLeft: '0.25rem' }}>credits</span>
                        </div>
                      </div>

                      {/* Entries */}
                      <div style={{
                        padding: '1rem',
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        borderRadius: '12px',
                      }}>
                        <div style={{ 
                          color: '#64748b', 
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          marginBottom: '0.5rem',
                        }}>
                          Entries
                        </div>
                        <div style={{ 
                          color: '#6366f1', 
                          fontSize: '1.5rem',
                          fontWeight: 700,
                        }}>
                          {event.current_entries}/{event.max_entries}
                        </div>
                      </div>

                      {/* Tournament Start Date */}
                      <div style={{
                        padding: '1rem',
                        background: 'rgba(234, 179, 8, 0.1)',
                        border: '1px solid rgba(234, 179, 8, 0.2)',
                        borderRadius: '12px',
                      }}>
                        <div style={{ 
                          color: '#64748b', 
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          marginBottom: '0.5rem',
                        }}>
                          🏌️ Tournament Starts
                        </div>
                        <div style={{ 
                          color: '#eab308', 
                          fontSize: '0.95rem',
                          fontWeight: 600,
                        }}>
                          {event.start_date && !isNaN(new Date(event.start_date).getTime())
                            ? new Date(event.start_date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'TBA'}
                        </div>
                      </div>

                      {/* Registration Closes - WITH COUNTDOWN */}
                      <div style={{
                        padding: '1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '12px',
                      }}>
                        <div style={{ 
                          color: '#64748b', 
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          marginBottom: '0.5rem',
                        }}>
                          ⏰ Registration Closes
                        </div>
                        {event.registration_closes && !isNaN(new Date(event.registration_closes).getTime()) ? (
                          <>
                            <div style={{ 
                              color: '#ef4444', 
                              fontSize: '1.25rem',
                              fontWeight: 700,
                              marginBottom: '0.25rem',
                            }}>
                              {getTimeRemaining(event.registration_closes)}
                            </div>
                            <div style={{ 
                              color: '#64748b', 
                              fontSize: '0.75rem',
                            }}>
                              {new Date(event.registration_closes).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </div>
                          </>
                        ) : (
                          <div style={{ color: '#ef4444', fontSize: '0.95rem', fontWeight: 600 }}>
                            TBA
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                      <Link 
                        href={`/clubhouse/events/${event.id}`}
                        style={{ 
                          flex: 1,
                          textDecoration: 'none',
                        }}
                      >
                        <div style={{
                          padding: '0.875rem',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '10px',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '1rem',
                          textAlign: 'center',
                          cursor: 'pointer',
                        }}>
                          📋 Competition Details
                        </div>
                      </Link>
                    </div>
                  </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}
