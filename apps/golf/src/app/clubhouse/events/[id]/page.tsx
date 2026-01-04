'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabaseClient';
import RequireAuth from '@/components/RequireAuth';
import CountdownClock from '@/components/CountdownClock';

interface Event {
  id: string;
  name: string;
  description: string | null;
  entry_credits: number;
  max_entries: number;
  current_entries: number;
  status: string;
  reg_open_at: string;
  reg_close_at: string;
  start_at: string;
  end_at: string;
}

interface Competition {
  id: string;
  name: string;
  rounds_covered: number[];
  entry_credits: number;
  max_entries: number;
  opens_at: string;
  closes_at: string;
  starts_at: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [userCredits, setUserCredits] = useState(0);
  const [hasEntered, setHasEntered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(0.15);
  const [backgroundOverlay, setBackgroundOverlay] = useState<number>(0.4);

  useEffect(() => {
    loadEventData();
    loadBackground();
  }, [eventId]);

  async function loadBackground() {
    try {
      const response = await fetch('/api/settings/page-background?page=clubhouse_page_background');
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

  async function loadEventData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Load event
    const res = await fetch(`/api/clubhouse/events/${eventId}`);
    if (res.ok) {
      const data = await res.json();
      setEvent(data);
    }

    // Load competitions for this event
    const { data: comps } = await supabase
      .from('clubhouse_competitions')
      .select('id, name, rounds_covered, entry_credits, max_entries, opens_at, closes_at, starts_at')
      .eq('event_id', eventId)
      .order('rounds_covered');

    if (comps) setCompetitions(comps);

    if (user) {
      // Load user credits
      const { data: wallet } = await supabase
        .from('clubhouse_wallets')
        .select('credits')
        .eq('user_id', user.id)
        .single();

      if (wallet) setUserCredits(wallet.credits);

      // Check if user already entered any competition in this event
      if (comps && comps.length > 0) {
        const competitionIds = comps.map(c => c.id);
        const { data: entries } = await supabase
          .from('clubhouse_entries')
          .select('id')
          .in('competition_id', competitionIds)
          .eq('user_id', user.id);

        setHasEntered(!!entries && entries.length > 0);
      }
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

  if (!event) {
    return (
      <RequireAuth>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Event not found</p>
          <Link href="/clubhouse/events" style={{ color: '#0d9488' }}>
            Back to Events
          </Link>
        </div>
      </RequireAuth>
    );
  }

  const canEnter = (event.status === 'open' || event.status === 'active') && userCredits >= event.entry_credits && !hasEntered;

  return (
    <RequireAuth>
      <div style={{ 
        minHeight: '100vh',
        background: backgroundImage 
          ? `linear-gradient(135deg, rgba(15, 32, 39, ${backgroundOverlay}) 0%, rgba(32, 58, 67, ${backgroundOverlay}) 50%, rgba(44, 83, 100, ${backgroundOverlay}) 100%)`
          : 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
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
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto' }}>
          <Link
            href="/clubhouse/events"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '2rem',
              color: '#14b8a6',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: 600,
              transition: 'color 0.2s',
            }}
          >
            ← Back to Events
          </Link>

          {/* Event Header Card - Compact */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h1 style={{ margin: 0, color: 'white', fontSize: '1.75rem', fontWeight: 700 }}>{event.name}</h1>
              <div
                style={{
                  padding: '0.5rem 1rem',
                  background: event.status === 'active' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'white',
                  letterSpacing: '0.5px',
                }}
              >
                {event.status}
              </div>
            </div>

            {/* Stats Grid - Compact */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '1rem',
              marginBottom: '1rem',
            }}>
              <div
                style={{
                  padding: '1rem',
                  background: 'rgba(20, 184, 166, 0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(20, 184, 166, 0.3)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Entry Cost
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#daa520' }}>
                  {event.entry_credits}
                </div>
              </div>

              <div
                style={{
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Entries
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>
                  {event.current_entries}/{event.max_entries}
                </div>
              </div>

              <div
                style={{
                  padding: '1rem',
                  background: 'rgba(234, 179, 8, 0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.25rem', fontWeight: 600 }}>
                  Your Balance
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#eab308' }}>
                  {userCredits}
                </div>
              </div>
            </div>

            {/* Timing Info - Compact */}
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.2)', 
              padding: '1rem', 
              borderRadius: '12px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem',
              fontSize: '0.75rem',
            }}>
              <div>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Reg Opens
                </div>
                <div style={{ fontWeight: 600, color: 'white' }}>
                  {new Date(event.reg_open_at).toLocaleString('en-US', { 
                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                  })}
                </div>
              </div>
              <div>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Reg Closes
                </div>
                <div style={{ fontWeight: 600, color: 'white' }}>
                  {new Date(event.reg_close_at).toLocaleString('en-US', { 
                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                  })}
                </div>
              </div>
              <div>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Starts
                </div>
                <div style={{ fontWeight: 600, color: 'white' }}>
                  {new Date(event.start_at).toLocaleString('en-US', { 
                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                  })}
                </div>
              </div>
              <div>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Ends
                </div>
                <div style={{ fontWeight: 600, color: 'white' }}>
                  {new Date(event.end_at).toLocaleString('en-US', { 
                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>

            {/* Debug Info */}
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '8px',
              fontSize: '0.75rem',
              color: '#a5b4fc',
            }}>
              Status: {event.status} | Credits: {userCredits}/{event.entry_credits} | Entered: {hasEntered ? 'Yes' : 'No'} | Can Enter: {canEnter ? 'Yes' : 'No'}
            </div>

            {hasEntered && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '8px',
                  color: '#10b981',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>✓</span> Already entered
              </div>
            )}

            {!canEnter && event.status !== 'open' && !hasEntered && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  color: '#f87171',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                Registration not open (Status: {event.status})
              </div>
            )}

            {event.status === 'open' && userCredits < event.entry_credits && !hasEntered && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(234, 179, 8, 0.2)',
                  border: '1px solid rgba(234, 179, 8, 0.4)',
                  borderRadius: '8px',
                  color: '#eab308',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                Need {event.entry_credits - userCredits} more credits
              </div>
            )}
          </div>

          {/* Competitions Section */}
          {competitions.length > 0 && (
            <div>
              <h2 style={{ 
                fontSize: '2rem', 
                fontWeight: 700, 
                color: 'white', 
                marginBottom: '2rem',
                textAlign: 'center',
              }}>
                Available Competitions
              </h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '2rem',
              }}>
                {competitions.map((comp) => {
                  const compHasStarted = new Date(comp.starts_at) <= new Date();
                  const canEnterThisComp = canEnter && !compHasStarted;
                  
                  return (
                  <div
                    key={comp.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '20px',
                      padding: '2rem',
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 12px 48px 0 rgba(20, 184, 166, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.37)';
                    }}
                  >
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ 
                        margin: '0 0 0.5rem 0', 
                        fontSize: '1.5rem', 
                        fontWeight: 700, 
                        color: 'white',
                        lineHeight: '1.3',
                      }}>
                        {comp.name || `${event.name} - Round${comp.rounds_covered.length > 1 ? 's' : ''} ${comp.rounds_covered.join(', ')}`}
                      </h3>
                      <div style={{ 
                        display: 'inline-block',
                        padding: '0.5rem 1rem',
                        background: 'rgba(20, 184, 166, 0.2)',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        color: '#daa520',
                        fontWeight: 600,
                      }}>
                        Round{comp.rounds_covered.length > 1 ? 's' : ''} {comp.rounds_covered.join(', ')}
                      </div>
                    </div>

                    {/* Three Stat Boxes */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr 1fr', 
                      gap: '1rem',
                      marginBottom: '1.5rem',
                    }}>
                      <div style={{ 
                        padding: '1rem',
                        background: 'rgba(20, 184, 166, 0.15)',
                        borderRadius: '12px',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem', fontWeight: 600 }}>
                          Entry Fee
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#daa520' }}>
                          {comp.entry_credits}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>Credits</div>
                      </div>

                      <div style={{ 
                        padding: '1rem',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem', fontWeight: 600 }}>
                          Entries
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>
                          0/{comp.max_entries}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>Players</div>
                      </div>

                      <div style={{ 
                        padding: '1rem',
                        background: 'rgba(99, 102, 241, 0.15)',
                        borderRadius: '12px',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem', fontWeight: 600 }}>
                          Status
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#818cf8' }}>
                          {event.status === 'active' ? '🔴' : '🟢'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                          {event.status === 'active' ? 'Live' : 'Open'}
                        </div>
                      </div>
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: '1rem', 
                      fontSize: '0.8rem',
                      marginBottom: '1.5rem',
                    }}>
                      <div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem', fontWeight: 600 }}>Closes In</div>
                        <CountdownClock targetDate={comp.closes_at} />
                      </div>
                      <div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem', fontWeight: 600 }}>Starts</div>
                        <div style={{ fontWeight: 700, color: 'white' }}>
                          {new Date(comp.starts_at).toLocaleString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <Link
                        href={canEnterThisComp ? `/clubhouse/build-team/${comp.id}` : '#'}
                        style={{
                          flex: 1,
                          padding: '0.875rem',
                          background: canEnterThisComp 
                            ? 'linear-gradient(135deg, #228b22, #32cd32)' 
                            : 'rgba(100, 100, 100, 0.3)',
                          color: 'white',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: '0.9375rem',
                          textAlign: 'center',
                          transition: 'all 0.2s',
                          opacity: canEnterThisComp ? 1 : 0.6,
                          cursor: canEnterThisComp ? 'pointer' : 'not-allowed',
                        }}
                        onClick={(e) => {
                          if (!canEnterThisComp) e.preventDefault();
                        }}
                        onMouseEnter={(e) => {
                          if (canEnterThisComp) {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #1a6b1a, #28a428)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (canEnterThisComp) {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #228b22, #32cd32)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        {compHasStarted ? '🔒 Closed' : '🏌️ Build Team'}
                      </Link>
                      <Link
                        href={`/clubhouse/competitions/${comp.id}`}
                        style={{
                          flex: 1,
                          padding: '0.875rem',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: '0.9375rem',
                          textAlign: 'center',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        📋 Comp Details
                      </Link>
                    </div>
                    {!canEnter && event.status === 'active' && hasEntered && (
                      <div style={{ 
                        padding: '1rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: 'rgba(255, 255, 255, 0.7)', 
                        fontSize: '0.9rem', 
                        fontStyle: 'italic',
                        textAlign: 'center',
                      }}>
                        ✓ Already entered
                      </div>
                    )}
                    {!canEnter && event.status !== 'active' && (
                      <div style={{ 
                        padding: '1rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: 'rgba(255, 255, 255, 0.7)', 
                        fontSize: '0.9rem', 
                        fontStyle: 'italic',
                        textAlign: 'center',
                      }}>
                        Registration closed
                      </div>
                    )}
                    {!canEnter && userCredits < comp.entry_credits && event.status === 'active' && !hasEntered && (
                      <div style={{ 
                        padding: '1rem',
                        background: 'rgba(234, 179, 8, 0.2)',
                        border: '1px solid rgba(234, 179, 8, 0.3)',
                        borderRadius: '12px',
                        color: '#eab308', 
                        fontSize: '0.9rem', 
                        fontWeight: 600,
                        textAlign: 'center',
                      }}>
                        Need {comp.entry_credits - userCredits} more credits
                      </div>
                    )}
                  </div>
                );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}
