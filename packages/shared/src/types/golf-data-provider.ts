/**
 * Golf Data Provider Interface
 * 
 * Abstract interface for all golf data providers (DataGolf, SportRadar, SportsData.IO, etc.)
 * Allows easy switching between providers without changing application code
 */

export interface GolferRanking {
  name: string;
  firstName?: string;
  lastName?: string;
  worldRank: number;
  skillRating?: number;
  formRating?: number;
  country?: string;
  externalId?: string; // Provider's unique ID
}

export interface LiveScore {
  tournamentId: string;
  tournamentName: string;
  golferId: string;
  golferName: string;
  position: number | string; // Could be "T5", "CUT", etc.
  score: number; // Total score relative to par
  thru: string | number; // "F", "18", "E12" (early second round)
  today?: number; // Today's round score
  rounds: number[];
  lastUpdated: Date;
}

export interface Tournament {
  id: string;
  name: string;
  course: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'in_progress' | 'completed';
  purse?: number;
  externalId?: string;
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  cacheDuration?: number; // milliseconds
}

export interface ProviderMetadata {
  name: string;
  version: string;
  lastSync?: Date;
  rateLimit?: {
    requests: number;
    period: 'second' | 'minute' | 'hour' | 'day';
  };
}

/**
 * Base interface that all golf data providers must implement
 */
export interface IGolfDataProvider {
  /**
   * Provider metadata
   */
  readonly metadata: ProviderMetadata;

  /**
   * Initialize the provider with configuration
   */
  initialize(config: ProviderConfig): Promise<void>;

  /**
   * Fetch current golfer rankings
   * @param limit - Number of top golfers to fetch
   */
  getRankings(limit?: number): Promise<GolferRanking[]>;

  /**
   * Get live scores for a tournament
   * @param tournamentId - Provider's tournament ID
   */
  getLiveScores(tournamentId: string): Promise<LiveScore[]>;

  /**
   * Get upcoming and active tournaments
   */
  getTournaments(options?: {
    startDate?: Date;
    endDate?: Date;
    status?: Tournament['status'];
  }): Promise<Tournament[]>;

  /**
   * Get detailed golfer information
   * @param golferId - Provider's golfer ID or name
   */
  getGolferDetails(golferId: string): Promise<GolferRanking | null>;

  /**
   * Health check - verify provider is working
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Provider factory response
 */
export interface ProviderFactoryResult {
  provider: IGolfDataProvider;
  cost: 'free' | 'low' | 'medium' | 'high';
  reliability: 'low' | 'medium' | 'high';
  latency: 'realtime' | 'fast' | 'moderate' | 'slow';
}
