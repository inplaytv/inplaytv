'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import styles from './clubhouse.module.css';

interface Club {
  id: string;
  name: string;
  location: string;
  member_count: number;
  credits_available: number;
  image_url: string;
}

interface ClubhouseEvent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string;
  start_date: string;
  end_date: string;
  status: string;
  entry_credits: number;
  max_entries: number;
  competitions: {
    id: string;
    name: string;
    entry_credits: number;
    max_entries: number;
    rounds_covered: number[] | null;
  }[];
}

export default function ClubhousePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userClub, setUserClub] = useState<Club | null>(null);
  const [clubhouseEvents, setClubhouseEvents] = useState<ClubhouseEvent[]>([]);
  const [creditsBalance, setCreditsBalance] = useState(0);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    loadClubData();
  }, []);

  async function loadClubData() {
    // For now, mock data - will integrate with real club system
    setCreditsBalance(500);
    setUserClub({
      id: '1',
      name: 'Royal Dunes Golf Club',
      location: 'St Andrews, Scotland',
      member_count: 1247,
      credits_available: 500,
      image_url: '/images/club-placeholder.jpg'
    });

    // Load clubhouse events with their competitions
    const supabase = createClient();
    const { data: events } = await supabase
      .from('clubhouse_events')
      .select(`
        id,
        name,
        slug,
        description,
        location,
        start_date,
        end_date,
        status,
        clubhouse_competitions (
          id,
          name,
          entry_credits,
          max_entries,
          rounds_covered
        )
      `)
      .order('start_date', { ascending: true })
      .limit(6);

    if (events) {
      setClubhouseEvents(events.map((e: any) => ({
        id: e.id,
        name: e.name,
        slug: e.slug,
        description: e.description,
        location: e.location,
        start_date: e.start_date,
        end_date: e.end_date,
        status: e.status,
        entry_credits: e.clubhouse_competitions?.[0]?.entry_credits || 100,
        max_entries: e.clubhouse_competitions?.[0]?.max_entries || 100,
        competitions: e.clubhouse_competitions || []
      })));
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <RequireAuth>
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading Clubhouse...</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className={styles.container}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroOverlay}></div>
          <div className={styles.heroContent}>
            <div className={styles.clubBadge}>
              <i className="fas fa-shield-alt"></i>
              <span style={{ marginLeft: '0.5rem', fontWeight: 700 }}>VIP Member</span>
            </div>
            <h1 className={styles.heroTitle}>Welcome to the Clubhouse</h1>
            <p className={styles.heroSubtitle}>
              Exclusive club competitions. Play for credits. Redeem at pro shops nationwide.
            </p>
            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <div className={styles.statIcon}>
                  <i className="fas fa-trophy"></i>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{clubhouseEvents.length}</div>
                  <div className={styles.statLabel}>Active Events</div>
                </div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statIcon}>
                  <i className="fas fa-users"></i>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{userClub?.member_count.toLocaleString()}</div>
                  <div className={styles.statLabel}>Club Members</div>
                </div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statIcon}>
                  <i className="fas fa-coins"></i>
                </div>
                <div className={styles.statContent}>
                  <div className={styles.statValue}>{creditsBalance}</div>
                  <div className={styles.statLabel}>Your Credits</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Club Info Bar */}
        {userClub && (
          <div className={styles.clubBar}>
            <div className={styles.clubInfo}>
              <div className={styles.clubLogo}>
                <i className="fas fa-golf-ball-tee"></i>
              </div>
              <div className={styles.clubDetails}>
                <h3>{userClub.name}</h3>
                <p><i className="fas fa-map-marker-alt"></i> {userClub.location}</p>
              </div>
            </div>
            <button 
              className={styles.joinClubBtn}
              onClick={() => setShowJoinModal(true)}
            >
              <i className="fas fa-users"></i>
              Change Club
            </button>
          </div>
        )}

        {/* How It Works */}
        <section className={styles.howItWorks}>
          <h2 className={styles.sectionTitle}>
            <i className="fas fa-lightbulb"></i>
            How Clubhouse Works
          </h2>
          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepIcon}>
                <i className="fas fa-user-plus"></i>
              </div>
              <h3>Join Your Club</h3>
              <p>Register at any of our parner shops to access exclusive competitions</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepIcon}>
                <i className="fas fa-trophy"></i>
              </div>
              <h3>Enter Tournaments</h3>
              <p>Use credits to enter the same InPlay formats you love, competing with club members</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepIcon}>
                <i className="fas fa-coins"></i>
              </div>
              <h3>Win Credits</h3>
              <p>Top performers earn credits that accumulate in your InPlay Clubhouse account</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <div className={styles.stepIcon}>
                <i className="fas fa-store"></i>
              </div>
              <h3>Redeem at Pro Shop</h3>
              <p>Spend your credits at participating pro shops across the country</p>
            </div>
          </div>
        </section>

        {/* Available Tournaments */}
        <section className={styles.tournaments}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <i className="fas fa-calendar-alt"></i>
              Club Tournaments
            </h2>
            <p className={styles.sectionSubtitle}>
              Same great InPlay formats, exclusive club competition
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
            gap: '1.5rem',
          }}>
            {clubhouseEvents.map((event) => {
              const totalCompetitions = event.competitions.length;
              
              return (
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
                    e.currentTarget.style.borderColor = 'rgba(218, 165, 32, 0.3)';
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
                      <h2 style={{ 
                        color: '#fff', 
                        margin: '0 0 0.5rem 0',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                      }}>
                        {event.name}
                      </h2>
                      <p style={{ 
                        color: '#94a3b8', 
                        margin: 0,
                        fontSize: '0.95rem',
                      }}>
                        {event.location || 'Location TBD'}
                      </p>
                    </div>
                    <div style={{ 
                      padding: '0.5rem 1rem',
                      background: event.status === 'open' 
                        ? 'rgba(34, 197, 94, 0.1)' 
                        : 'rgba(148, 163, 184, 0.1)',
                      border: `1px solid ${event.status === 'open' 
                        ? 'rgba(34, 197, 94, 0.3)' 
                        : 'rgba(148, 163, 184, 0.3)'}`,
                      color: event.status === 'open' ? '#22c55e' : '#94a3b8',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}>
                      {event.status}
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
                      background: 'rgba(218, 165, 32, 0.1)',
                      border: '1px solid rgba(218, 165, 32, 0.2)',
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

                    {/* Competitions */}
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
                        Competitions
                      </div>
                      <div style={{ 
                        color: '#6366f1', 
                        fontSize: '1.5rem',
                        fontWeight: 700,
                      }}>
                        {totalCompetitions}
                      </div>
                    </div>

                    {/* Max Entries */}
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
                        Max Entries
                      </div>
                      <div style={{ 
                        color: '#eab308', 
                        fontSize: '1.5rem',
                        fontWeight: 700,
                      }}>
                        {event.max_entries}
                      </div>
                    </div>

                    {/* Event Dates */}
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
                        Event Dates
                      </div>
                      <div style={{ 
                        color: '#ef4444', 
                        fontSize: '0.95rem',
                        fontWeight: 600,
                      }}>
                        {new Date(event.start_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric'
                        })} - {new Date(event.end_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div style={{ marginTop: '1.5rem' }}>
                    <Link 
                      href={`/clubhouse/events/${event.id}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <div style={{
                        padding: '0.875rem',
                        background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '1rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}>
                        📋 View Event Details
                      </div>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Partner Pro Shops */}
        <section className={styles.proShops}>
          <h2 className={styles.sectionTitle}>
            <i className="fas fa-store"></i>
            Partner Pro Shops
          </h2>
          <p className={styles.sectionSubtitle}>
            Redeem your credits at these participating locations
          </p>
          <div className={styles.shopsGrid}>
            {[
              { name: 'St Andrews Pro Shop', location: 'St Andrews, Scotland', credits: '1000+' },
              { name: 'Royal Dunes Golf', location: 'Links, England', credits: '500+' },
              { name: 'Celtic Manor Resort', location: 'Wales', credits: '750+' },
              { name: 'Gleneagles Golf', location: 'Scotland', credits: '1200+' },
            ].map((shop, idx) => (
              <div key={idx} className={styles.shopCard}>
                <div className={styles.shopIcon}>
                  <i className="fas fa-store-alt"></i>
                </div>
                <h4>{shop.name}</h4>
                <p><i className="fas fa-map-marker-alt"></i> {shop.location}</p>
                <div className={styles.shopBadge}>
                  <i className="fas fa-coins"></i>
                  {shop.credits} redeemed
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Join Club Modal */}
        {showJoinModal && (
          <div className={styles.modal} onClick={() => setShowJoinModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <button className={styles.modalClose} onClick={() => setShowJoinModal(false)}>
                <i className="fas fa-times"></i>
              </button>
              <h2>Join a Golf Club</h2>
              <p>Enter your club membership code to get started</p>
              <input 
                type="text" 
                placeholder="Club membership code"
                className={styles.modalInput}
              />
              <button className={styles.modalBtn}>
                <i className="fas fa-check"></i>
                Join Club
              </button>
              <p className={styles.modalFooter}>
                Don't have a code? Contact your club administrator.
              </p>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
