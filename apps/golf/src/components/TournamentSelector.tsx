'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import styles from './TournamentSelector.module.css';

interface Tournament {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  start_date: string;
  end_date: string;
}

interface TournamentSelectorProps {
  currentTournament: Tournament;
  allTournaments: Tournament[];
  onTournamentSelected?: () => void;
}

export default function TournamentSelector({ currentTournament, allTournaments, onTournamentSelected }: TournamentSelectorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // On mount and when currentTournament changes, check if user has selected before
  useEffect(() => {
    const hasSelected = sessionStorage.getItem('one2one-tournament-selected') === 'true';
    if (hasSelected && currentTournament && !selectedTournament) {
      setSelectedTournament(currentTournament);
    }
  }, [currentTournament, selectedTournament]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTournamentChange = (tournament: Tournament) => {
    setIsOpen(false);
    sessionStorage.setItem('one2one-tournament-selected', 'true');
    setSelectedTournament(tournament);
    if (onTournamentSelected) {
      onTournamentSelected();
    }
    router.push(`/one-2-one/${tournament.slug}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={styles.selectorContainer} ref={dropdownRef}>
      <button 
        className={styles.selectorButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className={styles.tournamentInfo}>
          {selectedTournament ? (
            <>
              {selectedTournament.image_url && (
                <img 
                  src={selectedTournament.image_url} 
                  alt={selectedTournament.name}
                  className={styles.tournamentLogo}
                />
              )}
              <div className={styles.tournamentDetails}>
                <h2 className={styles.tournamentName}>{selectedTournament.name}</h2>
                <p className={styles.tournamentDates}>
                  {formatDate(selectedTournament.start_date)} - {formatDate(selectedTournament.end_date)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className={styles.placeholderIcon}>
                <i className="fas fa-trophy"></i>
              </div>
              <div className={styles.tournamentDetails}>
                <h2 className={styles.tournamentName}>Choose Your Tournament</h2>
                <p className={styles.tournamentDates}>
                  Click to select from available tournaments
                </p>
              </div>
            </>
          )}
        </div>
        <svg 
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          width="20" 
          height="20" 
          viewBox="0 0 20 20" 
          fill="none"
        >
          <path 
            d="M5 7.5L10 12.5L15 7.5" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            Select Tournament
          </div>
          <div className={styles.tournamentList}>
            {allTournaments.map((tournament) => (
              <button
                key={tournament.id}
                className={`${styles.tournamentOption} ${
                  tournament.id === currentTournament.id ? styles.tournamentOptionActive : ''
                }`}
                onClick={() => handleTournamentChange(tournament)}
              >
                <div className={styles.optionContent}>
                  {tournament.image_url && (
                    <img 
                      src={tournament.image_url} 
                      alt={tournament.name}
                      className={styles.optionLogo}
                    />
                  )}
                  <div className={styles.optionDetails}>
                    <div className={styles.optionName}>{tournament.name}</div>
                    <div className={styles.optionDates}>
                      {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
                    </div>
                  </div>
                </div>
                {tournament.id === currentTournament.id && (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path 
                      d="M16.25 5L7.5 13.75L3.75 10" 
                      stroke="#f59e0b" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
