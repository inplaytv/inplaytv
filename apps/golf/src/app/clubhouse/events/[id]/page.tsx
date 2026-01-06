'use client';

export const dynamic = 'force-dynamic';

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

    // Load event with competitions
    let eventData = null;
    const res = await fetch(`/api/clubhouse/events/${eventId}`);
    if (res.ok) {
      eventData = await res.json();
      setEvent(eventData);
      // Use competitions from API response
      if (eventData.competitions) {
        setCompetitions(eventData.competitions);
      }
    }

    if (user && eventData) {
      // Load user credits (create wallet if doesn't exist)
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
      // If no wallet exists, userCredits stays at 0 (initial state)

      // Check if user already entered any competition in this event
      if (eventData.competitions && eventData.competitions.length > 0) {
        const competitionIds = eventData.competitions.map((c: any) => c.id);
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

  // Check if registration is actually open based on timing
  const now = new Date();
  const regOpens = new Date(event.reg_open_at);
  const regCloses = new Date(event.reg_close_at);
  const isRegistrationOpen = now >= regOpens && now < regCloses;
  
  const canEnter = isRegistrationOpen && userCredits >= event.entry_credits && !hasEntered;

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
                  background: event.status === 'open' 
                    ? 'rgba(34, 197, 94, 0.2)' 
                    : event.status === 'active'
                    ? 'rgba(234, 179, 8, 0.2)'
                    : event.status === 'completed'
                    ? 'rgba(148, 163, 184, 0.2)'
                    : 'rgba(99, 102, 241, 0.2)',
                  border: `1px solid ${
                    event.status === 'open' 
                      ? 'rgba(34, 197, 94, 0.4)' 
                      : event.status === 'active'
                      ? 'rgba(234, 179, 8, 0.4)'
                      : event.status === 'completed'
                      ? 'rgba(148, 163, 184, 0.4)'
                      : 'rgba(99, 102, 241, 0.4)'
                  }`,
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: event.status === 'open' 
                    ? '#22c55e' 
                    : event.status === 'active'
                    ? '#eab308'
                    : event.status === 'completed'
                    ? '#94a3b8'
                    : '#6366f1',
                  letterSpacing: '0.5px',
                }}
              >
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
                  15 Minutes before Tee-Off
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
              Status: {event.status} | Reg Open: {isRegistrationOpen ? 'Yes' : 'No'} | Credits: {userCredits}/{event.entry_credits} | Entered: {hasEntered ? 'Yes' : 'No'} | Can Enter: {canEnter ? 'Yes' : 'No'}
            </div>

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
          {competitions && competitions.length > 0 && (
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
                  // Check competition-level timing using COMPETITION's own timing
                  const now = new Date();
                  const compOpens = comp.opens_at ? new Date(comp.opens_at) : null;
                  const compCloses = comp.closes_at ? new Date(comp.closes_at) : null;
                  
                  const isCompRegistrationOpen = compOpens && compCloses && now >= compOpens && now < compCloses;
                  const compHasClosed = compCloses && now >= compCloses;
                  const compNotYetOpen = compOpens && now < compOpens;
                  
                  // Can enter if: registration is open and have credits (unlimited entries allowed)
                  const canEnterThisComp = isCompRegistrationOpen && userCredits >= comp.entry_credits;
                  
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
                    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ 
                        margin: 0, 
                        fontSize: '1.5rem', 
                        fontWeight: 700, 
                        color: 'white',
                        lineHeight: '1.3',
                      }}>
                        {comp.name}
                      </h3>
                      <div style={{ 
                        display: 'inline-block',
                        padding: '0.5rem 1rem',
                        background: compHasClosed 
                          ? 'rgba(239, 68, 68, 0.15)' 
                          : isCompRegistrationOpen 
                          ? 'rgba(34, 197, 94, 0.15)' 
                          : 'rgba(234, 179, 8, 0.15)',
                        border: compHasClosed
                          ? '1px solid rgba(239, 68, 68, 0.3)'
                          : isCompRegistrationOpen
                          ? '1px solid rgba(34, 197, 94, 0.3)'
                          : '1px solid rgba(234, 179, 8, 0.3)',
                        borderRadius: '8px',
                        fontSize: '0.8125rem',
                        color: compHasClosed ? '#ef4444' : isCompRegistrationOpen ? '#22c55e' : '#eab308',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        {compHasClosed ? 'Registration Closed' : isCompRegistrationOpen ? 'Registration Open' : 'Opens Soon'}
                      </div>
                    </div>

                    {/* Two Stat Boxes */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
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
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: '1rem', 
                      fontSize: '0.8rem',
                      marginBottom: '1.5rem',
                    }}>
                      <div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem', fontWeight: 600 }}>Registration Opens</div>
                        <div style={{ fontWeight: 700, color: isCompRegistrationOpen ? '#22c55e' : 'white' }}>
                          {isCompRegistrationOpen ? (
                            <span style={{ color: '#22c55e' }}>✓ Open Now</span>
                          ) : (
                            new Date(comp.opens_at).toLocaleString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: 'numeric', 
                              minute: '2-digit' 
                            })
                          )}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem', fontWeight: 600 }}>
                          {compHasClosed ? 'Registration Closed' : 'Closes In'}
                        </div>
                        {compHasClosed ? (
                          <div style={{ fontWeight: 700, color: '#ef4444' }}>
                            {new Date(comp.closes_at).toLocaleString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              hour: 'numeric', 
                              minute: '2-digit' 
                            })}
                          </div>
                        ) : (
                          <CountdownClock targetDate={comp.closes_at} />
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <Link
                        href={canEnterThisComp ? `/clubhouse/build-team/${comp.id}` : '#'}
                        style={{
                          flex: 1,
                          padding: '0.875rem',
                          background: compHasClosed
                            ? 'rgba(239, 68, 68, 0.2)'
                            : canEnterThisComp 
                              ? 'linear-gradient(135deg, #228b22, #32cd32)' 
                              : 'rgba(100, 100, 100, 0.3)',
                          border: compHasClosed ? '1px solid rgba(239, 68, 68, 0.4)' : 'none',
                          color: 'white',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: '0.9375rem',
                          textAlign: 'center',
                          transition: 'all 0.2s',
                          cursor: canEnterThisComp ? 'pointer' : 'not-allowed',
                          opacity: compHasClosed || !canEnterThisComp ? 0.6 : 1,
                        }}
                        onClick={(e) => {
                          if (!canEnterThisComp) e.preventDefault();
                        }}
                      >
                        {compHasClosed 
                          ? '🔒 Registration Closed' 
                          : compNotYetOpen
                          ? '⏳ Opens Soon'
                          : canEnterThisComp 
                            ? '🏌️ Build Your Team' 
                            : userCredits < comp.entry_credits
                            ? '💎 Need More Credits'
                            : '📝 Build Your Team'}
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
                    {!canEnter && userCredits < comp.entry_credits && (
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

          {/* No Competitions Message */}
          {(!competitions || competitions.length === 0) && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                padding: '3rem 2rem',
                textAlign: 'center',
                marginTop: '2rem',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏌️</div>
              <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                No Competitions Available
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem' }}>
                Competitions will be added soon. Check back later!
              </p>
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}
