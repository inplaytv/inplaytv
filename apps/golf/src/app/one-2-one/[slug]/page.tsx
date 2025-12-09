'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import TournamentSelector from '@/components/TournamentSelector';
import { formatPounds } from '@/lib/money';
import styles from './one-2-one.module.css';

interface One2OneTemplate {
  id: string;
  name: string;
  short_name: string;
  description: string;
  entry_fee_pennies: number;
  admin_fee_percent: number;
  max_players: number;
  rounds_covered: number[];
  reg_close_round: number | null;
  status: string;
  tournament_id: string;
  reg_close_at: string | null;
  is_open: boolean;
  available_instances: number;
}

interface Tournament {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  start_date: string;
  end_date: string;
  current_round: number;
  status?: string;
  is_visible?: boolean;
}

// Helper functions
function formatCurrency(pennies: number): string {
  return formatPounds(pennies);
}

function getRoundDescription(rounds: number[]): string {
  if (!rounds || rounds.length === 0) return 'Unknown';
  if (rounds.length === 1) return `Round ${rounds[0]}`;
  if (rounds.length === 4) return 'All Rounds';
  const sorted = [...rounds].sort((a, b) => a - b);
  return `Rounds ${sorted[0]}-${sorted[sorted.length - 1]}`;
}

function getTournamentStatus(tournament: Tournament | null): { label: string; color: string; icon: string } | null {
  if (!tournament || !tournament.start_date || !tournament.end_date) return null;
  
  const now = new Date();
  const startDate = new Date(tournament.start_date);
  const endDate = new Date(tournament.end_date);
  
  // Tournament completed or not visible
  if (now > endDate || tournament.status === 'completed' || tournament.is_visible === false) {
    return null;
  }
  
  // Tournament in play
  if (now >= startDate && now <= endDate) {
    return {
      label: 'In Play',
      color: '#10b981',
      icon: 'fa-play-circle'
    };
  }
  
  // Registration open (before tournament starts)
  if (now < startDate) {
    return {
      label: 'Registration Open',
      color: '#3b82f6',
      icon: 'fa-door-open'
    };
  }
  
  return null;
}

export default function One2OnePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
  const [templates, setTemplates] = useState<One2OneTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customEntryFees, setCustomEntryFees] = useState<Record<string, number>>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [joiningTemplate, setJoiningTemplate] = useState<string | null>(null);
  const [openChallenges, setOpenChallenges] = useState<any[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<One2OneTemplate | null>(null);
  const [activeView, setActiveView] = useState<'create' | 'board'>('create');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Responsive layout detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch current user
  useEffect(() => {
    async function getCurrentUser() {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const data = await response.json();
          setCurrentUserId(data.user?.id || null);
        }
      } catch (err) {
        console.error('Failed to fetch current user:', err);
      }
    }
    getCurrentUser();
  }, []);

  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleJoinCompetition = async (templateOrInstanceId: string, entryFee: number) => {
    if (!tournament) return;
    
    console.log('🚀 Starting challenge creation - setting joiningTemplate to:', templateOrInstanceId);
    setJoiningTemplate(templateOrInstanceId);
    console.log('🚀 joiningTemplate set, button should now show "Submitting Challenge..."');
    
    try {
      // Call API to find or create an instance
      // Can accept either a template ID (create new) or instance ID (join existing)
      console.log('🔍 Calling join API with:', { id: templateOrInstanceId, tournamentId: tournament.id, entryFee });
      
      const response = await fetch('/api/one-2-one/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: templateOrInstanceId, // Works for both template and instance IDs
          tournamentId: tournament.id,
          entryFeePennies: entryFee
        })
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Join API error:', errorData);
        throw new Error(errorData.error || 'Failed to join competition');
      }

      const data = await response.json();
      console.log('✅ Join successful:', data);
      
      // Redirect to build-team page with the instance ID
      router.push(`/build-team/${data.instanceId}`);
    } catch (err) {
      console.error('Error joining competition:', err);
      setError(err instanceof Error ? err.message : 'Failed to join competition');
      setJoiningTemplate(null);
    }
  };

  const formatCountdown = useCallback((closeTime: string | null) => {
    if (!closeTime) return null;
    
    const closeDate = new Date(closeTime);
    const now = currentTime;
    const diff = closeDate.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }, [currentTime]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch all tournaments for the selector
        const allTournamentsResponse = await fetch('/api/tournaments?status=active');
        if (allTournamentsResponse.ok) {
          const allTournamentsData = await allTournamentsResponse.json();
          const tournaments = allTournamentsData.tournaments || [];
          setAllTournaments(tournaments);
        }

        // Fetch tournament data for templates but DON'T auto-select it
        const response = await fetch(`/api/tournaments/${slug}/one-2-one`);
        if (!response.ok) throw new Error('Failed to fetch ONE 2 ONE data');
        
      const data = await response.json();
      // DON'T set tournament - force user to select it fresh
      // setTournament(data.tournament);
      setTemplates(data.templates || []);        // Initialize customEntryFees with template defaults
        const initialFees: Record<string, number> = {};
        (data.templates || []).forEach((template: One2OneTemplate) => {
          initialFees[template.id] = template.entry_fee_pennies;
        });
        setCustomEntryFees(initialFees);
        
        // Don't auto-select any template or tournament - let user choose both
        console.log('🔍 Page loaded - tournament and selectedTemplate should be NULL');
        console.log('🔍 Available templates:', data.templates?.length);
        
        // Fetch all open challenges
        fetchOpenChallenges();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    
    // Poll for open challenges every 10 seconds
    const pollInterval = setInterval(() => {
      fetchOpenChallenges();
    }, 10000);
    
    return () => clearInterval(pollInterval);
  }, [slug]);

  async function fetchOpenChallenges() {
    try {
      setLoadingChallenges(true);
      const response = await fetch('/api/one-2-one/all-open-challenges');
      if (response.ok) {
        const data = await response.json();
        setOpenChallenges(data.challenges || []);
      }
    } catch (err) {
      console.error('Failed to fetch open challenges:', err);
    } finally {
      setLoadingChallenges(false);
    }
  }

  const formatCurrency = (pennies: number) => {
    return `£${(pennies / 100).toFixed(2)}`;
  };

  const getRoundDescription = (roundsCovered: number[]) => {
    if (roundsCovered.length === 4) return 'ALL 4 ROUNDS';
    if (roundsCovered.length === 1) {
      const round = roundsCovered[0];
      return `ROUND ${round} ONLY`;
    }
    return `ROUNDS ${roundsCovered.join(', ')}`;
  };

  // Memoized current entry fee for selected template
  const currentEntryFee = useMemo(() => {
    if (!selectedTemplate) return 0;
    const fee = customEntryFees[selectedTemplate.id] || selectedTemplate.entry_fee_pennies;
    return fee;
  }, [selectedTemplate?.id, customEntryFees[selectedTemplate?.id ?? ''], selectedTemplate?.entry_fee_pennies]);

  // Memoized prize pool calculation
  const currentPrizePool = useMemo(() => {
    if (!selectedTemplate) return 0;
    const fee = customEntryFees[selectedTemplate.id] || selectedTemplate.entry_fee_pennies;
    const pool = Math.round((fee * 2 * (100 - selectedTemplate.admin_fee_percent)) / 100);
    return pool;
  }, [selectedTemplate?.id, customEntryFees[selectedTemplate?.id ?? ''], selectedTemplate?.entry_fee_pennies, selectedTemplate?.admin_fee_percent]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading ONE 2 ONE competitions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <Link href="/tournaments" className={styles.backButton}>
            Back to Tournaments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.backgroundAnimation}>
        <div className={styles.gradientOrb1}></div>
        <div className={styles.gradientOrb2}></div>
        <div className={styles.gradientOrb3}></div>
      </div>

      <div className={styles.content}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/tournaments">Tournaments</Link>
          <i className="fas fa-chevron-right"></i>
          <span>ONE 2 ONE</span>
        </div>

        {/* Modern Dropdown Navigation */}
        <div style={{ marginBottom: '2rem', position: 'relative', zIndex: 100 }}>
          {/* Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: menuOpen ? '0 8px 24px rgba(16, 185, 129, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
              overflow: 'visible'
            }}
            onMouseEnter={(e) => {
              if (!menuOpen) {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15))';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!menuOpen) {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}>
                <i className="fas fa-plus-circle"></i>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '3px' }}>
                  Create Challenge
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                  Choose tournament, round & entry fee
                </div>
              </div>
            </div>
            <i className={`fas fa-chevron-${menuOpen ? 'up' : 'down'}`} style={{ 
              color: '#10b981', 
              fontSize: '1.3rem',
              transition: 'transform 0.3s ease'
            }}></i>
          </button>

          {/* Dropdown Panel - Slides Over Everything */}
          {menuOpen && (
            <>
              {/* Backdrop */}
              <div 
                onClick={() => setMenuOpen(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 99,
                  animation: 'fadeIn 0.3s ease'
                }}
              />
              
              {/* Dropdown Content */}
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 1rem - 175px)',
                left: 0,
                right: 0,
                background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(31, 41, 55, 0.98))',
                border: '2px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '20px',
                padding: '2rem',
                zIndex: 100,
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(16, 185, 129, 0.1)',
                backdropFilter: 'blur(20px)',
                animation: 'slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}>
                {/* Close Button */}
                <button
                  onClick={() => setMenuOpen(false)}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '1.2rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
                
                <style jsx>{`
                  @keyframes slideDown {
                    from {
                      opacity: 0;
                      transform: translateY(-20px) scale(0.95);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0) scale(1);
                    }
                  }
                  @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                  }
                `}</style>

                {/* Two Column Layout for Steps */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  
                  {/* Step 1: Round Selector (Left) */}
                  <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    marginBottom: '1rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '2px solid rgba(251, 191, 36, 0.2)'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#000'
                    }}>
                      1
                    </div>
                    <div>
                      <h3 style={{ 
                        margin: 0, 
                        fontSize: '1rem', 
                        fontWeight: 700, 
                        color: '#fbbf24',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        Choose Round & Set Fee
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                        Select which round and adjust your entry fee
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    {templates.map((template) => {
                      const isSelected = selectedTemplate?.id === template.id;
                      
                      return (
                        <button
                          key={template.id}
                          onClick={() => {
                            setSelectedTemplate(template);
                            setIsConfirmed(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem',
                            background: isSelected 
                              ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))' 
                              : 'rgba(255,255,255,0.03)',
                            border: isSelected 
                              ? '2px solid #fbbf24' 
                              : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            width: '100%',
                            textAlign: 'left'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: isSelected 
                                ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' 
                                : 'rgba(251, 191, 36, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.9rem',
                              color: isSelected ? '#000' : '#fbbf24',
                              fontWeight: 700
                            }}>
                              {template.rounds_covered.length === 4 ? (
                                <i className="fas fa-layer-group"></i>
                              ) : (
                                `R${template.rounds_covered[0]}`
                              )}
                            </div>
                            <div>
                              <div style={{ 
                                fontSize: '0.95rem', 
                                fontWeight: 700, 
                                color: isSelected ? '#fff' : 'rgba(255,255,255,0.9)',
                                marginBottom: '2px'
                              }}>
                                {getRoundDescription(template.rounds_covered)}
                              </div>
                              <div style={{ 
                                fontSize: '0.7rem', 
                                color: 'rgba(255,255,255,0.5)'
                              }}>
                                {template.description}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <i className="fas fa-check-circle" style={{ 
                              color: '#fbbf24', 
                              fontSize: '1.2rem' 
                            }}></i>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Entry Fee & Prize Pool for Selected Template */}
                  {selectedTemplate && (
                    <div style={{
                      background: 'rgba(251, 191, 36, 0.05)',
                      borderRadius: '16px',
                      border: '1px solid rgba(251, 191, 36, 0.2)',
                      padding: '1rem 1.5rem',
                        marginTop: '1rem'
                      }}>
                        {/* Prize Pool & Entry Fee - Side by Side */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '1.5rem',
                          marginBottom: '1.5rem',
                          paddingBottom: '1rem',
                          borderBottom: '1px solid rgba(255,255,255,0.05)'
                        }}>
                          {/* Winner Takes */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.2rem'
                            }}>
                              <i className="fas fa-trophy"></i>
                            </div>
                            <div>
                              <span style={{ 
                                fontSize: '0.7rem', 
                                color: 'rgba(255,255,255,0.5)', 
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontWeight: 600,
                                display: 'block',
                                marginBottom: '2px'
                              }}>
                                Winner Takes All
                              </span>
                              <div style={{ 
                                fontSize: '1.5rem', 
                                fontWeight: 700, 
                                color: '#10b981',
                                lineHeight: 1
                              }}>
                                {formatCurrency(currentPrizePool)}
                              </div>
                            </div>
                          </div>

                          {/* Entry Fee */}
                          <div>
                            <label style={{ 
                              display: 'block',
                              fontSize: '0.7rem', 
                              fontWeight: 600, 
                              color: 'rgba(255,255,255,0.5)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '0.5rem'
                            }}>
                              <i className="fas fa-ticket-alt" style={{ marginRight: '0.5rem', color: '#fbbf24' }}></i>
                              Entry Fee
                            </label>
                            <input
                              type="range"
                              min="500"
                              max="10000"
                              step="100"
                              value={currentEntryFee}
                              onChange={(e) => {
                                if (!selectedTemplate) return;
                                const newValue = parseInt(e.target.value);
                                console.log('🎚️ Slider onChange:', { 
                                  newValue, 
                                  templateId: selectedTemplate.id,
                                  currentFee: currentEntryFee,
                                  allFees: customEntryFees 
                                });
                                setCustomEntryFees(prev => {
                                  const updated = { ...prev, [selectedTemplate.id]: newValue };
                                  console.log('✅ State updated:', updated);
                                  return updated;
                                });
                                setIsConfirmed(false);
                              }}
                              onInput={(e) => {
                                if (!selectedTemplate) return;
                                const newValue = parseInt((e.target as HTMLInputElement).value);
                                console.log('🎚️ Slider onInput:', newValue);
                                setCustomEntryFees(prev => ({ ...prev, [selectedTemplate.id]: newValue }));
                              }}
                              style={{
                                width: '100%',
                                height: '8px',
                                accentColor: '#f59e0b',
                                marginBottom: '0.5rem',
                                cursor: 'pointer'
                              }}
                              disabled={!selectedTemplate?.is_open}
                            />
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: !selectedTemplate?.is_open ? 'rgba(255,0,0,0.7)' : 'rgba(255,255,255,0.5)',
                              marginBottom: '0.5rem',
                              fontStyle: 'italic'
                            }}>
                              {!selectedTemplate?.is_open ? '⚠️ Tournament closed - slider disabled' : '← Drag slider to adjust fee →'}
                            </div>
                            <div style={{ 
                              fontSize: '1.5rem', 
                              fontWeight: 700, 
                              color: '#fbbf24',
                              lineHeight: 1
                            }}>
                              {formatCurrency(currentEntryFee)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Tournament Selector (Right) */}
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem', 
                      marginBottom: '1rem',
                      paddingBottom: '0.75rem',
                      borderBottom: '2px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: '#000'
                      }}>
                        2
                      </div>
                      <div>
                        <h3 style={{ 
                          margin: 0, 
                          fontSize: '1rem', 
                          fontWeight: 700, 
                          color: '#10b981',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>
                          Select Tournament
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                          Choose which tournament to compete in
                        </p>
                      </div>
                    </div>
                    
                    {allTournaments.length > 0 && (
                      <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                        {allTournaments.map((t) => {
                          const isSelected = tournament?.id === t.id;
                          return (
                            <button
                              key={t.id}
                              onClick={async (e) => {
                                e.preventDefault();
                                if (tournament?.id !== t.id) {
                                  // Reset confirmation state
                                  setIsConfirmed(false);
                                  
                                  // Clear old challenges immediately to prevent showing stale data
                                  setOpenChallenges([]);
                                  
                                  // Update URL without navigation
                                  window.history.replaceState(null, '', `/one-2-one/${t.slug}`);
                                  
                                  // Fetch data for the new tournament
                                  try {
                                    const response = await fetch(`/api/tournaments/${t.slug}/one-2-one`);
                                    if (!response.ok) throw new Error('Failed to fetch ONE 2 ONE data');
                                    
                                    const data = await response.json();
                                    setTournament(data.tournament);
                                    setTemplates(data.templates || []);
                                    
                                    // Update customEntryFees with new template defaults
                                    const initialFees: Record<string, number> = {};
                                    (data.templates || []).forEach((template: One2OneTemplate) => {
                                      initialFees[template.id] = template.entry_fee_pennies;
                                    });
                                    setCustomEntryFees(initialFees);
                                    
                                    // Try to keep the same round selection if it exists in new tournament
                                    if (selectedTemplate) {
                                      const matchingTemplate = data.templates?.find(
                                        (t: One2OneTemplate) => t.rounds_covered.length === selectedTemplate.rounds_covered.length &&
                                        t.rounds_covered.every((r: number, i: number) => r === selectedTemplate.rounds_covered[i])
                                      );
                                      setSelectedTemplate(matchingTemplate || null);
                                    } else {
                                      setSelectedTemplate(null);
                                    }
                                    
                                    // Fetch all open challenges
                                    fetchOpenChallenges();
                                  } catch (err) {
                                    console.error('Failed to load tournament data:', err);
                                  }
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '1rem',
                                background: isSelected 
                                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))' 
                                  : 'rgba(255,255,255,0.03)',
                                border: isSelected 
                                  ? '2px solid #10b981' 
                                  : '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                width: '100%',
                                textAlign: 'left'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                }
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                <div style={{
                                  width: '44px',
                                  height: '44px',
                                  borderRadius: '10px',
                                  background: isSelected 
                                    ? 'linear-gradient(135deg, #10b981, #059669)' 
                                    : 'rgba(16, 185, 129, 0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '1.2rem',
                                  color: isSelected ? '#fff' : '#10b981'
                                }}>
                                  <i className="fas fa-golf-ball"></i>
                                </div>
                                <div style={{ flex: 1, position: 'relative' }}>
                                  <div style={{ 
                                    fontSize: '1rem', 
                                    fontWeight: 700, 
                                    color: isSelected ? '#fff' : 'rgba(255,255,255,0.9)',
                                    marginBottom: '2px'
                                  }}>
                                    {t.name}
                                  </div>
                                  <div style={{ 
                                    fontSize: '0.75rem', 
                                    color: 'rgba(255,255,255,0.5)'
                                  }}>
                                    {new Date(t.start_date).toLocaleDateString()} - {new Date(t.end_date).toLocaleDateString()}
                                  </div>
                                  {/* Status badge positioned absolutely at bottom center */}
                                  {getTournamentStatus(t) && (
                                    <div style={{ 
                                      position: 'absolute',
                                      bottom: '-13px',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      pointerEvents: 'none'
                                    }}>
                                      <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: '6px',
                                        background: `${getTournamentStatus(t)!.color}22`,
                                        border: `1px solid ${getTournamentStatus(t)!.color}66`,
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        color: '#fff',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        whiteSpace: 'nowrap'
                                      }}>
                                        <i className={`fas ${getTournamentStatus(t)!.icon}`} style={{ fontSize: '0.65rem' }}></i>
                                        {getTournamentStatus(t)!.label}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {isSelected && (
                                <i className="fas fa-check-circle" style={{ 
                                  color: '#10b981', 
                                  fontSize: '1.3rem' 
                                }}></i>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Confirmation Summary Section - Always Visible */}
                      <div style={{
                        marginTop: '1.5rem',
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(16, 185, 129, 0.1))',
                        border: '2px solid rgba(251, 191, 36, 0.3)',
                        borderRadius: '12px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '1rem'
                        }}>
                          <i className="fas fa-clipboard-list" style={{ color: '#fbbf24', fontSize: '1.2rem' }}></i>
                          <h4 style={{ 
                            margin: 0, 
                            fontSize: '1rem', 
                            fontWeight: 700,
                            color: '#fbbf24',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                          }}>
                            Challenge Summary
                          </h4>
                        </div>
                        
                        {/* Summary Grid */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '1rem',
                          marginBottom: '1.5rem'
                        }}>
                          <div style={{
                            padding: '0.75rem',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            opacity: tournament ? 1 : 0.5
                          }}>
                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '1rem' }}>🏆</span>
                              Tournament
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: tournament ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                              {tournament ? tournament.name : 'Not selected'}
                            </div>
                          </div>
                          
                          <div style={{
                            padding: '0.75rem',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            opacity: selectedTemplate ? 1 : 0.5
                          }}>
                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '1rem' }}>🎯</span>
                              Round
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: selectedTemplate ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                              {selectedTemplate ? getRoundDescription(selectedTemplate.rounds_covered) : 'Not selected'}
                            </div>
                          </div>
                          
                          <div style={{
                            padding: '0.75rem',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            opacity: selectedTemplate ? 1 : 0.5
                          }}>
                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '1rem' }}>💰</span>
                              Entry Fee
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: selectedTemplate ? '#fbbf24' : 'rgba(255,255,255,0.4)' }}>
                              {selectedTemplate ? formatCurrency(customEntryFees[selectedTemplate.id] || selectedTemplate.entry_fee_pennies) : '—'}
                            </div>
                          </div>
                          
                          <div style={{
                            padding: '0.75rem',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            opacity: selectedTemplate ? 1 : 0.5
                          }}>
                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '1rem' }}>🏅</span>
                              Prize Pool
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: selectedTemplate ? '#10b981' : 'rgba(255,255,255,0.4)' }}>
                              {selectedTemplate ? formatCurrency(Math.round(((customEntryFees[selectedTemplate.id] || selectedTemplate.entry_fee_pennies) * 2 * (100 - selectedTemplate.admin_fee_percent)) / 100)) : '—'}
                            </div>
                          </div>
                        </div>
                        
                        {/* Status Message when incomplete */}
                        {(!tournament || !selectedTemplate) && (
                          <div style={{
                            padding: '0.75rem',
                            background: 'rgba(251, 191, 36, 0.1)',
                            border: '1px solid rgba(251, 191, 36, 0.3)',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <i className="fas fa-info-circle" style={{ color: '#fbbf24', fontSize: '1rem' }}></i>
                            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                              {!selectedTemplate && !tournament ? 'Select a round and tournament to continue' : 
                               !selectedTemplate ? 'Select a round to continue' : 
                               'Select a tournament to continue'}
                            </span>
                          </div>
                        )}
                        
                        {/* Create Challenge Button */}
                        {(() => {
                          const isClosed = selectedTemplate ? !selectedTemplate.is_open : false;
                          const isDisabled = !tournament || !selectedTemplate || joiningTemplate !== null || isClosed;
                          
                          return (
                            <button
                              className={styles.btnFindMatch}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isDisabled) return;
                                const customFee = customEntryFees[selectedTemplate!.id] || selectedTemplate!.entry_fee_pennies;
                                handleJoinCompetition(selectedTemplate!.id, customFee);
                                setMenuOpen(false);
                              }}
                              disabled={isDisabled}
                              style={{ 
                                width: '100%', 
                                margin: 0, 
                                fontSize: '1.1rem', 
                                padding: '1.25rem',
                                background: isDisabled
                                  ? 'rgba(255,255,255,0.1)' 
                                  : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                opacity: isDisabled ? 0.5 : 1,
                                boxShadow: !isDisabled ? '0 4px 12px rgba(251, 191, 36, 0.4)' : 'none',
                                color: isDisabled ? 'rgba(255,255,255,0.5)' : joiningTemplate !== null ? '#fff' : '#000',
                                fontWeight: 700,
                                transition: 'all 0.3s ease',
                                cursor: isDisabled ? 'not-allowed' : 'pointer'
                              }}
                            >
                              {joiningTemplate === selectedTemplate?.id ? (
                                <>
                                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                                  <span>Submitting Challenge...</span>
                                </>
                              ) : joiningTemplate !== null ? (
                                <>
                                  <i className="fas fa-hourglass-half" style={{ marginRight: '0.5rem' }}></i>
                                  <span>Please wait...</span>
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-check-circle" style={{ marginRight: '0.5rem' }}></i>
                                  <span>Confirm Selections</span>
                                </>
                              )}
                            </button>
                          );
                        })()}
                      </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Challenge Board - Always Visible */}
        <div style={{ 
          marginTop: '2rem', 
          minHeight: '200px',
          display: 'block',
          visibility: 'visible',
          opacity: 1,
          width: '100%',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <h2 className={styles.sectionTitle}>
                <i className="fas fa-th-list" style={{ color: '#fbbf24', marginRight: '0.5rem' }}></i>
                Challenge Board ({openChallenges.length} total)
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Browse and accept challenges from all tournaments ({openChallenges.length} available)
              </p>
            </div>
            {loadingChallenges && (
              <i className="fas fa-sync fa-spin" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem' }}></i>
            )}
          </div>

          {(() => {
            const filteredChallenges = openChallenges.filter(challenge => challenge.challenger.userId !== currentUserId);
            
            return filteredChallenges.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '16px',
              border: '1px dashed rgba(255,255,255,0.1)'
            }}>
              <i className="fas fa-inbox" style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.2)', marginBottom: '1rem' }}></i>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', margin: 0 }}>
                {openChallenges.length > 0 
                  ? 'All open challenges are your own. Create a new challenge or wait for others!'
                  : 'No open challenges at the moment. Be the first to create one!'}
              </p>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.05)',
              overflow: 'hidden'
            }}>
              {/* Challenge List Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile 
                  ? '1fr' 
                  : isTablet
                  ? '1.5fr 1.5fr 1fr'
                  : '1.5fr 1.5fr 1fr 1fr 1fr 1.5fr',
                gap: '1rem',
                padding: '1rem 1.5rem',
                background: 'rgba(255,255,255,0.05)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <div>Challenger</div>
                {!isMobile && <div>Tournament</div>}
                {!isMobile && !isTablet && (
                  <>
                    <div style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Round</div>
                    <div style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Entry Fee</div>
                    <div style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>Prize Pool</div>
                  </>
                )}
                {!isMobile && <div style={{ textAlign: 'right' }}>Action</div>}
              </div>

              {/* Challenge List Items */}
              {filteredChallenges.map((challenge, index) => (
                <div 
                  key={challenge.instanceId}
                  style={{
                    display: isMobile ? 'block' : 'grid',
                    gridTemplateColumns: isMobile 
                      ? 'none' 
                      : isTablet
                      ? '1.5fr 1.5fr 1fr'
                      : '1.5fr 1.5fr 1fr 1fr 1fr 1.5fr',
                    gap: '1rem',
                    padding: '1.25rem 1.5rem',
                    alignItems: 'center',
                    borderBottom: index < openChallenges.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    transition: 'background 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(251, 191, 36, 0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Challenger Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#000'
                    }}>
                      {challenge.challenger.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                        {challenge.challenger.displayName}
                      </p>
                      {challenge.challenger.entryName && (
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                          "{challenge.challenger.entryName}"
                        </p>
                      )}
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                        #{challenge.instanceNumber}
                      </p>
                    </div>
                  </div>

                  {/* Tournament */}
                  {!isMobile && (
                    <div>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                        {challenge.tournamentName || 'Unknown'}
                      </p>
                    </div>
                  )}

                  {/* Round */}
                  {!isMobile && !isTablet && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#10b981',
                      background: 'rgba(16, 185, 129, 0.1)',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      whiteSpace: 'nowrap'
                    }}>
                      {getRoundDescription(challenge.roundsCovered)}
                    </span>
                  </div>
                  )}

                  {/* Entry Fee */}
                  {!isMobile && !isTablet && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fbbf24', whiteSpace: 'nowrap' }}>
                        {formatCurrency(challenge.entryFeePennies)}
                      </p>
                    </div>
                  )}

                  {/* Prize Pool */}
                  {!isMobile && !isTablet && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#10b981', whiteSpace: 'nowrap' }}>
                      {formatCurrency(Math.round((challenge.entryFeePennies * 2 * (100 - (challenge.adminFeePercent || 10))) / 100))}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                      {challenge.adminFeePercent || 10}% fee
                    </p>
                  </div>
                  )}

                  {/* Mobile Details */}
                  {isMobile && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                        <div>
                          <span style={{ color: 'rgba(255,255,255,0.5)' }}>Tournament:</span>
                          <p style={{ margin: '2px 0 0 0', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                            {challenge.tournamentName}
                          </p>
                        </div>
                        <div>
                          <span style={{ color: 'rgba(255,255,255,0.5)' }}>Round:</span>
                          <p style={{ margin: '2px 0 0 0', color: '#10b981', fontWeight: 600 }}>
                            {getRoundDescription(challenge.roundsCovered)}
                          </p>
                        </div>
                        <div>
                          <span style={{ color: 'rgba(255,255,255,0.5)' }}>Entry Fee:</span>
                          <p style={{ margin: '2px 0 0 0', color: '#fbbf24', fontWeight: 700 }}>
                            {formatCurrency(challenge.entryFeePennies)}
                          </p>
                        </div>
                        <div>
                          <span style={{ color: 'rgba(255,255,255,0.5)' }}>Prize Pool:</span>
                          <p style={{ margin: '2px 0 0 0', color: '#10b981', fontWeight: 700 }}>
                            {formatCurrency(Math.round((challenge.entryFeePennies * 2 * (100 - (challenge.adminFeePercent || 10))) / 100))}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
                            {challenge.adminFeePercent || 10}% fee
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tablet Summary */}
                  {isTablet && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>{getRoundDescription(challenge.roundsCovered)}</span> • 
                        <span style={{ color: '#fbbf24', fontWeight: 700 }}> {formatCurrency(challenge.entryFeePennies)}</span> → 
                        <span style={{ color: '#10b981', fontWeight: 700 }}> {formatCurrency(Math.round((challenge.entryFeePennies * 2 * (100 - (challenge.adminFeePercent || 10))) / 100))}</span>
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  {!isMobile && (
                  <div style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleJoinCompetition(challenge.instanceId, challenge.entryFeePennies)}
                      disabled={joiningTemplate === challenge.instanceId}
                      style={{
                        padding: '0.625rem 1.25rem',
                        background: joiningTemplate === challenge.instanceId 
                          ? 'rgba(251, 191, 36, 0.3)' 
                          : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#000',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: joiningTemplate === challenge.instanceId ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginLeft: 'auto',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (joiningTemplate !== challenge.instanceId) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {joiningTemplate === challenge.instanceId ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          <span>Joining...</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-bolt"></i>
                          <span>Accept</span>
                        </>
                      )}
                    </button>
                  </div>
                  )}

                  {/* Mobile Action Button */}
                  {isMobile && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <button
                        onClick={() => handleJoinCompetition(challenge.instanceId, challenge.entryFeePennies)}
                        disabled={joiningTemplate === challenge.instanceId}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: joiningTemplate === challenge.instanceId 
                            ? 'rgba(251, 191, 36, 0.3)' 
                            : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#000',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          cursor: joiningTemplate === challenge.instanceId ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        {joiningTemplate === challenge.instanceId ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i>
                            <span>Joining...</span>
                          </>
                        ) : (
                          <>
                            <i className="fas fa-bolt"></i>
                            <span>Accept Challenge</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
          })()}
        </div>
      </div>
    </div>
  );
}
