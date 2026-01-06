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
  }[];
}

export default function ClubhousePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userClub, setUserClub] = useState<Club | null>(null);
  const [clubhouseEvents, setClubhouseEvents] = useState<ClubhouseEvent[]>([]);
  const [creditsBalance, setCreditsBalance] = useState(0);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(0.15);
  const [backgroundOverlay, setBackgroundOverlay] = useState<number>(0.4);

  useEffect(() => {
    loadClubData();
    loadBackground();
  }, []);

  async function loadBackground() {
    try {
      const response = await fetch('/api/settings/page-background?page=clubhouse_landing_background');
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
          max_entries
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
        {/* Background Image */}
        {backgroundImage && (
          <>
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: backgroundOpacity,
                zIndex: 0,
                pointerEvents: 'none'
              }}
            />
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'black',
                opacity: backgroundOverlay,
                zIndex: 1,
                pointerEvents: 'none'
              }}
            />
          </>
        )}
        {/* Quick Actions Header */}
        <div className={styles.quickActions}>
          <Link href="/clubhouse/events" className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}>
            <i className="fas fa-calendar-alt"></i>
            <span>Browse Events</span>
          </Link>
          <Link href="/clubhouse/my-entries" className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}>
            <i className="fas fa-clipboard-list"></i>
            <span>My Entries</span>
          </Link>
          <Link href="/clubhouse/wallet" className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}>
            <i className="fas fa-wallet"></i>
            <span>My Wallet</span>
          </Link>
        </div>

        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroOverlay}></div>
          <div className={styles.heroContent}>
            <div className={styles.clubBadge}>
              <i className="fas fa-shield-alt"></i>
              VIP Member
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

          <div className={styles.tournamentsGrid}>
            {clubhouseEvents.map((event) => {
              const totalCompetitions = event.competitions.length;
              
              return (
                <div
                  key={event.id}
                  className={styles.tournamentCard}
                >
                  {/* Event Header */}
                  <div className={styles.tournamentHeader}>
                    <div className={styles.tournamentInfo}>
                      <h2>{event.name}</h2>
                      <p>
                        <i className="fas fa-map-marker-alt"></i>
                        {event.location || 'Location TBD'}
                      </p>
                    </div>
                    <div className={`${styles.statusBadge} ${event.status === 'open' ? styles.statusOpen : styles.statusClosed}`}>
                      {event.status}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className={styles.tournamentStats}>
                    {/* Entry Cost */}
                    <div className={`${styles.statBox} ${styles.statBoxGold}`}>
                      <div className={styles.statBoxLabel}>Entry Cost</div>
                      <div className={styles.statBoxValue}>
                        {event.entry_credits}
                        <span>credits</span>
                      </div>
                    </div>

                    {/* Competitions */}
                    <div className={`${styles.statBox} ${styles.statBoxGreen}`}>
                      <div className={styles.statBoxLabel}>Competitions</div>
                      <div className={styles.statBoxValue}>
                        {totalCompetitions}
                      </div>
                    </div>

                    {/* Max Entries */}
                    <div className={`${styles.statBox} ${styles.statBoxYellow}`}>
                      <div className={styles.statBoxLabel}>Max Entries</div>
                      <div className={styles.statBoxValue}>
                        {event.max_entries}
                      </div>
                    </div>

                    {/* Event Dates */}
                    <div className={`${styles.statBox} ${styles.statBoxRed}`}>
                      <div className={styles.statBoxLabel}>Event Dates</div>
                      <div className={styles.statBoxValue}>
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
                  <div className={styles.tournamentAction}>
                    <Link 
                      href={`/clubhouse/events/${event.id}`}
                      className={styles.viewDetailsBtn}
                    >
                      <i className="fas fa-clipboard-list"></i>
                      View Event Details
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
