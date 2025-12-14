'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './tournaments.module.css';

interface CompetitionType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface Competition {
  id: string;
  entry_fee_pennies: number;
  entrants_cap: number;
  admin_fee_percent: number;
  reg_open_at: string | null;
  reg_close_at: string | null;
  start_at: string | null;
  end_at: string | null;
  status: string;
  competition_type_id: string;
  tournament_id: string;
  competition_types: CompetitionType;
}

interface Tournament {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string;
  status: string;
  image_url: string | null;
  competitions: Competition[];
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('prize_pool');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [myEntries, setMyEntries] = useState(0);
  
  // Featured tournaments data for slider
  const featuredTournaments = [
    { id: 1, name: 'Masters Tournament 2025' },
    { id: 2, name: 'PGA Championship 2025' },
    { id: 3, name: 'U.S. Open 2025' }
  ];

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchData();
    checkUser();
  }, []);

  // Auto-advance slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % featuredTournaments.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [featuredTournaments.length]);

  const handleJoinPrompt = () => {
    if (!userEmail) {
      router.push('/signup?redirect=/tournaments');
    } else {
      window.location.href = 'https://golf.inplay.tv/tournaments';
    }
  };

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUserEmail(user?.email || null);
    
    if (user) {
      try {
        const res = await fetch('/api/user/entries');
        if (res.ok) {
          const data = await res.json();
          setMyEntries(data.entries || 0);
        }
      } catch (err) {
        console.error('Error fetching user entries:', err);
      }
    }
  }

  async function fetchData() {
    try {
      setError(null);
      const res = await fetch('/api/tournaments?status=upcoming,live');
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setTournaments(data);
      } else {
        setError('Invalid data format received from server');
        setTournaments([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching tournaments:', error);
      setError(error.message || 'Failed to load tournaments');
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading tournaments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wrap}>
        <div className={styles.emptyState}>
          <div className={styles.glass}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', color: '#f87171', marginBottom: '1rem' }}></i>
            <h3>Error Loading Tournaments</h3>
            <p style={{ marginBottom: '1rem' }}>{error}</p>
            <button 
              onClick={fetchData}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {/* Tournament Slider */}
      <div className={styles.featuredSliderSection}>
        <div className={styles.sliderHeader}>
          <h2>Featured Tournaments</h2>
          <div className={styles.sliderControls}>
            <button 
              className={styles.sliderArrow}
              onClick={() => setCurrentSlide(currentSlide === 0 ? featuredTournaments.length - 1 : currentSlide - 1)}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <div className={styles.sliderDots}>
              {featuredTournaments.map((_, index) => (
                <button
                  key={index}
                  className={`${styles.sliderDot} ${index === currentSlide ? styles.active : ''}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
            <button 
              className={styles.sliderArrow}
              onClick={() => setCurrentSlide((currentSlide + 1) % featuredTournaments.length)}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
        
        <div className={styles.featuredSlider}>
          <div 
            className={styles.sliderTrack}
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {/* Slide 1 - Masters Tournament */}
            <div className={styles.sliderSlide}>
              <div className={`${styles.featuredCompetitionCard} ${styles.glass}`}>
                <div className={styles.featuredTop}>
                  <div className={styles.featuredCourseInfo}>
                    <div className={styles.featuredCourseTitle}>THE FULL COURSE</div>
                    <div className={styles.featuredCourseSubtitle}>The Complete Competition</div>
                  </div>
                  <div className={styles.featuredBadge}>
                    <i className="fas fa-crown"></i>
                    FULL COURSE
                  </div>
                </div>
                
                <div className={styles.featuredContent}>
                  <div className={styles.featuredImage}>
                    <img 
                      src="https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&h=300&fit=crop" 
                      alt="Tournament"
                    />
                  </div>
                  <div className={styles.featuredInfo}>
                    <h3 className={styles.featuredName}>Masters Tournament 2025</h3>
                    <p className={styles.featuredLocation}>
                      <i className="fas fa-map-marker-alt"></i>
                      Augusta National Golf Club
                    </p>
                    <p className={styles.featuredDates}>
                      <i className="fas fa-calendar"></i>
                      April 10-13, 2025
                    </p>
                  </div>
                  <div className={styles.featuredBadgeRight}>
                    <i className="fas fa-star"></i>
                    <span>FEATURED</span>
                  </div>
                </div>
                
                <div className={styles.featuredStats}>
                  <div className={styles.featuredStatBox}>
                    <i className="fas fa-trophy"></i>
                    <div>
                      <div className={styles.featuredStatValue}>£2.5M</div>
                      <div className={styles.featuredStatLabel}>Prize Pool</div>
                    </div>
                  </div>
                  <div className={styles.featuredStatBox}>
                    <i className="fas fa-users"></i>
                    <div>
                      <div className={styles.featuredStatValue}>12,847</div>
                      <div className={styles.featuredStatLabel}>Entries</div>
                    </div>
                  </div>
                  <div className={styles.featuredStatBox}>
                    <i className="fas fa-ticket-alt"></i>
                    <div>
                      <div className={styles.featuredStatValue}>£25</div>
                      <div className={styles.featuredStatLabel}>Entry Fee</div>
                    </div>
                  </div>
                  <div className={styles.featuredStatBox}>
                    <i className="fas fa-medal"></i>
                    <div>
                      <div className={styles.featuredStatValue}>£500K</div>
                      <div className={styles.featuredStatLabel}>1st Place</div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.featuredActions}>
                  <button className={styles.btnPrimary} onClick={handleJoinPrompt}>
                    <i className="fas fa-users"></i>
                    Build Your Team
                  </button>
                  <button className={styles.btnSecondary}>
                    <i className="fas fa-list-ol"></i>
                    Leaderboard List
                  </button>
                </div>
              </div>
            </div>

            {/* Slide 2 - PGA Championship */}
            <div className={styles.sliderSlide}>
              <div className={`${styles.featuredCompetitionCard} ${styles.glass}`}>
                <div className={styles.featuredTop}>
                  <div className={styles.featuredCourseInfo}>
                    <div className={styles.featuredCourseTitle}>BEAT THE CUT</div>
                    <div className={styles.featuredCourseSubtitle}>36 Holes Competition</div>
                  </div>
                  <div className={`${styles.featuredBadge} ${styles.badgeElite}`}>
                    <i className="fas fa-star"></i>
                    BEAT THE CUT
                  </div>
                </div>
                
                <div className={styles.featuredContent}>
                  <div className={styles.featuredImage}>
                    <img 
                      src="https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=600&h=300&fit=crop" 
                      alt="Tournament"
                    />
                  </div>
                  <div className={styles.featuredInfo}>
                    <h3 className={styles.featuredName}>PGA Championship 2025</h3>
                    <p className={styles.featuredLocation}>
                      <i className="fas fa-map-marker-alt"></i>
                      Kiawah Island Golf Resort
                    </p>
                    <p className={styles.featuredDates}>
                      <i className="fas fa-calendar"></i>
                      May 15-18, 2025
                    </p>
                  </div>
                  <div className={styles.featuredBadgeRight}>
                    <i className="fas fa-star"></i>
                    <span>FEATURED</span>
                  </div>
                </div>
                
                <div className={styles.featuredStats}>
                  <div className={styles.featuredStatBox}>
                    <i className="fas fa-trophy"></i>
                    <div>
                      <div className={styles.featuredStatValue}>£5.0M</div>
                      <div className={styles.featuredStatLabel}>Prize Pool</div>
                    </div>
                  </div>
                  <div className={styles.featuredStatBox}>
                    <i className="fas fa-users"></i>
                    <div>
                      <div className={styles.featuredStatValue}>2,543</div>
                      <div className={styles.featuredStatLabel}>Entries</div>
                    </div>
                  </div>
                  <div className={styles.featuredStatBox}>
                    <i className="fas fa-ticket-alt"></i>
                    <div>
                      <div className={styles.featuredStatValue}>£100</div>
                      <div className={styles.featuredStatLabel}>Entry Fee</div>
                    </div>
                  </div>
                  <div className={styles.featuredStatBox}>
                    <i className="fas fa-medal"></i>
                    <div>
                      <div className={styles.featuredStatValue}>£1.2M</div>
                      <div className={styles.featuredStatLabel}>1st Place</div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.featuredActions}>
                  <button className={styles.btnPrimary} onClick={handleJoinPrompt}>
                    <i className="fas fa-users"></i>
                    Build Your Team
                  </button>
                  <button className={styles.btnSecondary}>
                    <i className="fas fa-list-ol"></i>
                    Leaderboard List
                  </button>
                </div>
              </div>
            </div>

            {/* Slide 3 - U.S. Open */}
            <div className={styles.sliderSlide}>
              <div className={`${styles.featuredCompetitionCard} ${styles.glass}`}>
                <div className={styles.featuredTop}>
                  <div className={styles.featuredCourseInfo}>
                    <div className={styles.featuredCourseTitle}>WEEKEND WARRIOR</div>
                    <div className={styles.featuredCourseSubtitle}>Two Day Challenge</div>
                  </div>
                  <div className={`${styles.featuredBadge} ${styles.badgeHot}`}>
                    <i className="fas fa-fire"></i>
                    HOT
                  </div>
                </div>
                
                <div className={styles.featuredContent}>
                  <div className={styles.featuredImage}>
                    <img 
                      src="https://images.unsplash.com/photo-1566041510631-1a645ac66a7e?w=600&h=300&fit=crop" 
                      alt="Tournament"
                    />
                  </div>
                  <div className={styles.featuredInfo}>
                    <h3 className={styles.featuredName}>U.S. Open 2025</h3>
                    <p className={styles.featuredLocation}>
                      <i className="fas fa-map-marker-alt"></i>
                      Pinehurst Resort
                    </p>
                    <p className={styles.featuredDates}>
                      <i className="fas fa-calendar"></i>
                      June 12-15, 2025
                    </p>
                  </div>
                  <div className={styles.featuredBadgeRight}>
                    <i className="fas fa-fire"></i>
                    <span>HOT</span>
                  </div>
                </div>
                
                <div className={styles.featuredStats}>
                  <div className={styles.featuredStatBox}>
                    <i className="fas fa-trophy"></i>
                    <div>
                      <div className={styles.featuredStatValue}>£3.2M</div>
                      <div className={styles.featuredStatLabel}>Prize Pool</div>
                    </div>
                  </div>
                  <div className={styles.featuredStatBox}>
                    <i className="fas fa-users"></i>
                    <div>
                      <div className={styles.featuredStatValue}>8,921</div>
                      <div className={styles.featuredStatLabel}>Entries</div>
                    </div>
                  </div>
                  <div className={styles.featuredStatBox}>
                    <i className="fas fa-ticket-alt"></i>
                    <div>
                      <div className={styles.featuredStatValue}>£50</div>
                      <div className={styles.featuredStatLabel}>Entry Fee</div>
                    </div>
                  </div>
                  <div className={styles.featuredStatBox}>
                    <i className="fas fa-medal"></i>
                    <div>
                      <div className={styles.featuredStatValue}>£750K</div>
                      <div className={styles.featuredStatLabel}>1st Place</div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.featuredActions}>
                  <button className={styles.btnPrimary} onClick={handleJoinPrompt}>
                    <i className="fas fa-users"></i>
                    Build Your Team
                  </button>
                  <button className={styles.btnSecondary}>
                    <i className="fas fa-list-ol"></i>
                    Leaderboard List
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.sliderProgress}>
          <div 
            className={styles.progressBar}
            style={{ width: `${((currentSlide + 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Basic tournament list */}
      <div className={styles.content}>
        <h2>All Tournaments</h2>
        {tournaments.length === 0 ? (
          <p>No tournaments available at this time.</p>
        ) : (
          <div className={styles.competitionsGrid}>
            {tournaments.map((tournament) => (
              <div key={tournament.id} className={styles.competitionCard}>
                <h3>{tournament.name}</h3>
                <p>{tournament.location}</p>
                <p>{tournament.start_date} - {tournament.end_date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}