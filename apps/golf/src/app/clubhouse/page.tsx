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

interface Competition {
  id: string;
  tournament_id: string;
  tournament_name: string;
  tournament_slug: string;
  tournament_location: string;
  tournament_image_url: string | null;
  start_date: string;
  end_date: string;
  competition_type_name: string;
  competition_type_slug: string;
  entry_fee_pennies: number;
  entrants_cap: number;
  admin_fee_percent: number;
  status: string;
  participants: number;
}

export default function ClubhousePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userClub, setUserClub] = useState<Club | null>(null);
  const [availableCompetitions, setAvailableCompetitions] = useState<Competition[]>([]);
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

    // Load competitions (Full Course, Beat The Cut, etc.) - Limit to 6
    const supabase = createClient();
    const { data: competitions } = await supabase
      .from('tournament_competitions')
      .select(`
        id,
        tournament_id,
        entry_fee_pennies,
        entrants_cap,
        admin_fee_percent,
        status,
        tournaments!tournament_competitions_tournament_id_fkey (
          name,
          slug,
          location,
          start_date,
          end_date,
          image_url
        ),
        competition_types (
          name,
          slug
        )
      `)
      .eq('competition_format', 'inplay')
      .in('status', ['reg_open', 'live'])
      .order('tournaments(start_date)', { ascending: true })
      .limit(6);

    if (competitions) {
      setAvailableCompetitions(competitions.map((c: any) => ({
        id: c.id,
        tournament_id: c.tournament_id,
        tournament_name: c.tournaments?.name || '',
        tournament_slug: c.tournaments?.slug || '',
        tournament_location: c.tournaments?.location || '',
        tournament_image_url: c.tournaments?.image_url || null,
        start_date: c.tournaments?.start_date || '',
        end_date: c.tournaments?.end_date || '',
        competition_type_name: c.competition_types?.name || '',
        competition_type_slug: c.competition_types?.slug || '',
        entry_fee_pennies: c.entry_fee_pennies,
        entrants_cap: c.entrants_cap,
        admin_fee_percent: c.admin_fee_percent || 10,
        status: c.status,
        participants: Math.floor(Math.random() * 30) + 5
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
                  <div className={styles.statValue}>{availableCompetitions.length}</div>
                  <div className={styles.statLabel}>Active Competitions</div>
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
            {availableCompetitions.map((competition) => {
              const prizePool = (competition.entry_fee_pennies / 100) * competition.entrants_cap * (1 - competition.admin_fee_percent / 100);
              const firstPlace = prizePool * 0.25; // 25% to winner
              
              return (
                <div key={competition.id} className={styles.tournamentCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.competitionBadge}>
                      {competition.competition_type_name}
                    </div>
                    <div className={styles.clubBadge}>
                      <i className="fas fa-shield-alt"></i>
                      <span>CLUB EXCLUSIVE</span>
                    </div>
                  </div>
                  
                  <div className={styles.cardContent}>
                    <div className={styles.tournamentImage}>
                      <img 
                        src={competition.tournament_image_url || "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=300&h=180&fit=crop"} 
                        alt={competition.competition_type_name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=300&h=180&fit=crop";
                        }}
                      />
                    </div>

                    <div className={styles.tournamentInfo}>
                      <p className={styles.tournamentLocation}>
                        <i className="fas fa-map-marker-alt"></i>
                        {competition.tournament_location}
                      </p>
                      <p className={styles.tournamentDates}>
                        <i className="fas fa-calendar"></i>
                        {new Date(competition.start_date).toLocaleDateString('en-GB', { 
                          day: 'numeric', 
                          month: 'short' 
                        })} - {new Date(competition.end_date).toLocaleDateString('en-GB', { 
                          day: 'numeric', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>

                    <div className={styles.competitionStats}>
                      <div className={styles.competitionStat}>
                        <i className="fas fa-trophy"></i>
                        <div>
                          <div className={styles.statValue}>{prizePool.toLocaleString()} cr</div>
                          <div className={styles.statLabel}>Prize Pool</div>
                        </div>
                      </div>
                      <div className={styles.competitionStat}>
                        <i className="fas fa-users"></i>
                        <div>
                          <div className={styles.statValue}>{competition.entrants_cap}</div>
                          <div className={styles.statLabel}>Max Entries</div>
                        </div>
                      </div>
                      <div className={styles.competitionStat}>
                        <i className="fas fa-ticket-alt"></i>
                        <div>
                          <div className={styles.statValue}>{Math.floor(competition.entry_fee_pennies / 100)} cr</div>
                          <div className={styles.statLabel}>Entry Fee</div>
                        </div>
                      </div>
                      <div className={styles.competitionStat}>
                        <i className="fas fa-medal"></i>
                        <div>
                          <div className={styles.statValue}>{Math.floor(firstPlace).toLocaleString()} cr</div>
                          <div className={styles.statLabel}>1st Place</div>
                        </div>
                      </div>
                    </div>

                    <Link 
                      href={`/clubhouse/build-team/${competition.tournament_slug}?competition=${competition.id}`}
                      className={styles.enterBtn}
                    >
                      <i className="fas fa-users"></i>
                      Build Team
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
