/**
 * INPLAY FANTASY GOLF SCORING SYSTEM
 * 
 * Official scoring rules for hole-by-hole and tournament-wide fantasy points.
 * This is the single source of truth for all fantasy point calculations.
 */

// ===================================================================
// HOLE-BY-HOLE SCORING
// ===================================================================

export interface HoleScore {
  hole: number;
  par: number;
  score: number;
}

export interface RoundScore {
  round: number;
  holes: HoleScore[];
}

/**
 * Calculate fantasy points for a single hole based on score relative to par
 * 
 * @param score - Player's score on the hole
 * @param par - Par for the hole
 * @returns Fantasy points earned (can be negative)
 */
export function calculateHolePoints(score: number, par: number): number {
  const toPar = score - par;
  
  if (toPar <= -3) return 10;  // Albatross, Double Eagle, or Hole-in-One
  if (toPar === -2) return 6;   // Eagle
  if (toPar === -1) return 3;   // Birdie
  if (toPar === 0) return 1;    // Par
  if (toPar === 1) return -1;   // Bogey
  if (toPar >= 2) return -3;    // Double Bogey or worse
  
  return 0;
}

/**
 * Calculate fantasy points for a complete round
 */
export function calculateRoundPoints(holes: HoleScore[]): number {
  return holes.reduce((total, hole) => {
    return total + calculateHolePoints(hole.score, hole.par);
  }, 0);
}

/**
 * Calculate total fantasy points for all rounds
 */
export function calculateTournamentHolePoints(rounds: RoundScore[]): number {
  return rounds.reduce((total, round) => {
    return total + calculateRoundPoints(round.holes);
  }, 0);
}

// ===================================================================
// ROUND ACHIEVEMENT BONUSES
// ===================================================================

export interface RoundStats {
  birdies: number;
  eagles: number;
  bogeys: number;
  doubleBogeys: number;
  totalScore: number;
  parForRound: number;
}

/**
 * Calculate round achievement bonuses
 * These bonuses stack (can earn multiple in same round)
 */
export function calculateRoundBonuses(stats: RoundStats): {
  bonuses: { name: string; points: number }[];
  total: number;
} {
  const bonuses: { name: string; points: number }[] = [];
  
  // Bogey-free round: +5 points
  if (stats.bogeys === 0 && stats.doubleBogeys === 0) {
    bonuses.push({ name: 'Bogey Free Round', points: 5 });
  }
  
  // Sub-70 round: +3 points (if par is 72, adjust for different pars)
  if (stats.totalScore < 70) {
    bonuses.push({ name: 'Under 70 Strokes', points: 3 });
  }
  
  // 3+ eagles in a round: +10 points
  if (stats.eagles >= 3) {
    bonuses.push({ name: '3+ Eagles', points: 10 });
  }
  
  // 7+ birdies in a round: +5 points
  if (stats.birdies >= 7) {
    bonuses.push({ name: '7+ Birdies', points: 5 });
  }
  
  // Under par by 6+ strokes: +5 points
  const underPar = stats.parForRound - stats.totalScore;
  if (underPar >= 6) {
    bonuses.push({ name: '6+ Under Par Round', points: 5 });
  }
  
  const total = bonuses.reduce((sum, bonus) => sum + bonus.points, 0);
  return { bonuses, total };
}

/**
 * Detect consecutive scoring streaks in a round
 */
export function detectStreakBonuses(holes: HoleScore[]): {
  bonuses: { name: string; points: number }[];
  total: number;
} {
  const bonuses: { name: string; points: number }[] = [];
  let consecutiveBirdies = 0;
  let maxBirdieStreak = 0;
  
  // Count consecutive birdies or better
  holes.forEach(hole => {
    const toPar = hole.score - hole.par;
    if (toPar <= -1) { // Birdie or better
      consecutiveBirdies++;
      maxBirdieStreak = Math.max(maxBirdieStreak, consecutiveBirdies);
    } else {
      consecutiveBirdies = 0;
    }
  });
  
  // 3 consecutive birdies: +5 points
  if (maxBirdieStreak >= 3) {
    bonuses.push({ name: '3 Consecutive Birdies', points: 5 });
  }
  
  // 4 consecutive birdies: +8 points (includes the +5 from 3 consecutive)
  if (maxBirdieStreak >= 4) {
    bonuses.push({ name: '4 Consecutive Birdies', points: 3 }); // Additional 3 points
  }
  
  // 5+ consecutive birdies: +12 points total
  if (maxBirdieStreak >= 5) {
    bonuses.push({ name: '5+ Consecutive Birdies', points: 4 }); // Additional 4 points
  }
  
  const total = bonuses.reduce((sum, bonus) => sum + bonus.points, 0);
  return { bonuses, total };
}

// ===================================================================
// TOURNAMENT PLACEMENT BONUSES
// ===================================================================

/**
 * Calculate bonus points based on final tournament position
 * These bonuses are NOT affected by captain multiplier
 */
export function calculatePlacementBonus(position: number): number {
  if (position === 1) return 25;
  if (position === 2) return 15;
  if (position === 3) return 10;
  if (position === 4) return 7;
  if (position === 5) return 5;
  if (position >= 6 && position <= 10) return 3;
  if (position >= 11 && position <= 20) return 2;
  if (position >= 21 && position <= 30) return 1;
  return 0;
}

/**
 * Calculate bonus for making the cut
 */
export function calculateCutBonus(madeCut: boolean): number {
  return madeCut ? 5 : 0;
}

// ===================================================================
// CAPTAIN MULTIPLIER
// ===================================================================

/**
 * Apply captain multiplier to eligible points
 * 
 * Captain gets 2x points for:
 * - Hole-by-hole scoring
 * - Round achievement bonuses
 * 
 * Captain does NOT get 2x for:
 * - Tournament placement bonuses
 * - Cut-made bonus
 */
export function applyCaptainMultiplier(
  basePoints: number,
  bonusPoints: number,
  placementPoints: number,
  cutPoints: number,
  isCaptain: boolean
): number {
  if (!isCaptain) {
    return basePoints + bonusPoints + placementPoints + cutPoints;
  }
  
  // Captain gets 2x on base scoring and bonuses, but not placement/cut
  return (basePoints * 2) + (bonusPoints * 2) + placementPoints + cutPoints;
}

// ===================================================================
// COMPREHENSIVE GOLFER SCORING
// ===================================================================

export interface GolferPerformance {
  rounds: RoundScore[];
  finalPosition?: number;
  madeCut: boolean;
  isCaptain: boolean;
}

export interface ScoringBreakdown {
  holeByHolePoints: number;
  roundBonuses: { name: string; points: number }[];
  roundBonusTotal: number;
  streakBonuses: { name: string; points: number }[];
  streakBonusTotal: number;
  placementBonus: number;
  cutBonus: number;
  subtotal: number;
  captainMultiplier: number;
  finalTotal: number;
}

/**
 * Calculate complete fantasy score for a golfer with full breakdown
 */
export function calculateGolferScore(performance: GolferPerformance): ScoringBreakdown {
  // 1. Calculate hole-by-hole points
  const holeByHolePoints = calculateTournamentHolePoints(performance.rounds);
  
  // 2. Calculate round bonuses
  let allRoundBonuses: { name: string; points: number }[] = [];
  let allStreakBonuses: { name: string; points: number }[] = [];
  
  performance.rounds.forEach((round, index) => {
    // Calculate stats for the round
    const stats = calculateRoundStats(round.holes);
    
    // Get round bonuses
    const { bonuses: roundBonuses } = calculateRoundBonuses(stats);
    allRoundBonuses.push(...roundBonuses.map(b => ({ 
      name: `R${index + 1}: ${b.name}`, 
      points: b.points 
    })));
    
    // Get streak bonuses
    const { bonuses: streakBonuses } = detectStreakBonuses(round.holes);
    allStreakBonuses.push(...streakBonuses.map(b => ({ 
      name: `R${index + 1}: ${b.name}`, 
      points: b.points 
    })));
  });
  
  const roundBonusTotal = allRoundBonuses.reduce((sum, b) => sum + b.points, 0);
  const streakBonusTotal = allStreakBonuses.reduce((sum, b) => sum + b.points, 0);
  const bonusTotal = roundBonusTotal + streakBonusTotal;
  
  // 3. Calculate placement and cut bonuses
  const placementBonus = performance.finalPosition 
    ? calculatePlacementBonus(performance.finalPosition) 
    : 0;
  const cutBonus = calculateCutBonus(performance.madeCut);
  
  // 4. Apply captain multiplier
  const captainMultiplier = performance.isCaptain ? 2 : 1;
  const multipliedBase = holeByHolePoints * captainMultiplier;
  const multipliedBonuses = bonusTotal * captainMultiplier;
  
  // 5. Calculate final total
  const subtotal = holeByHolePoints + bonusTotal;
  const finalTotal = multipliedBase + multipliedBonuses + placementBonus + cutBonus;
  
  return {
    holeByHolePoints,
    roundBonuses: allRoundBonuses,
    roundBonusTotal,
    streakBonuses: allStreakBonuses,
    streakBonusTotal,
    placementBonus,
    cutBonus,
    subtotal,
    captainMultiplier,
    finalTotal: Math.round(finalTotal)
  };
}

/**
 * Helper: Calculate round statistics from holes
 */
function calculateRoundStats(holes: HoleScore[]): RoundStats {
  let birdies = 0;
  let eagles = 0;
  let bogeys = 0;
  let doubleBogeys = 0;
  let totalScore = 0;
  let parForRound = 0;
  
  holes.forEach(hole => {
    const toPar = hole.score - hole.par;
    totalScore += hole.score;
    parForRound += hole.par;
    
    if (toPar <= -2) eagles++;
    else if (toPar === -1) birdies++;
    else if (toPar === 1) bogeys++;
    else if (toPar >= 2) doubleBogeys++;
  });
  
  return {
    birdies,
    eagles,
    bogeys,
    doubleBogeys,
    totalScore,
    parForRound
  };
}

// ===================================================================
// SCORECARD ENTRY SCORING
// ===================================================================

export interface EntryGolfer {
  id: string;
  name: string;
  performance: GolferPerformance;
}

export interface ScoreEntry {
  entryId: string;
  entryName: string;
  golfers: EntryGolfer[];
  captainId: string;
}

export interface EntryScoreBreakdown {
  entryId: string;
  entryName: string;
  golferScores: Map<string, ScoringBreakdown>;
  totalPoints: number;
}

/**
 * Calculate complete fantasy score for an entry (6 golfers including captain)
 */
export function calculateEntryScore(entry: ScoreEntry): EntryScoreBreakdown {
  const golferScores = new Map<string, ScoringBreakdown>();
  let totalPoints = 0;
  
  entry.golfers.forEach(golfer => {
    const score = calculateGolferScore(golfer.performance);
    golferScores.set(golfer.id, score);
    totalPoints += score.finalTotal;
  });
  
  return {
    entryId: entry.entryId,
    entryName: entry.entryName,
    golferScores,
    totalPoints: Math.round(totalPoints)
  };
}

// ===================================================================
// DISPLAY HELPERS
// ===================================================================

/**
 * Get human-readable score name
 */
export function getScoreName(score: number, par: number): string {
  const toPar = score - par;
  
  if (toPar <= -4) return 'Condor';
  if (toPar === -3) return 'Albatross';
  if (toPar === -2) return 'Eagle';
  if (toPar === -1) return 'Birdie';
  if (toPar === 0) return 'Par';
  if (toPar === 1) return 'Bogey';
  if (toPar === 2) return 'Double Bogey';
  if (toPar === 3) return 'Triple Bogey';
  if (toPar >= 4) return 'Quadruple+';
  
  return 'Unknown';
}

/**
 * Get CSS class for score styling
 */
export function getScoreClass(score: number, par: number): string {
  const toPar = score - par;
  
  if (toPar <= -2) return 'eagle';
  if (toPar === -1) return 'birdie';
  if (toPar === 0) return 'par';
  if (toPar === 1) return 'bogey';
  if (toPar >= 2) return 'double-bogey';
  
  return '';
}

/**
 * Format points with sign
 */
export function formatPoints(points: number): string {
  if (points > 0) return `+${points}`;
  return String(points);
}
