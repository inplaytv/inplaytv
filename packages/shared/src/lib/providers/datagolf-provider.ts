/**
 * DataGolf Provider
 * 
 * Integrates with DataGolf API for rankings, skill ratings, and predictions
 * Budget tier - $10-50/month depending on features
 * 
 * API Docs: https://datagolf.com/api-access
 */

import { BaseGolfDataProvider } from './base-provider';
import type { 
  GolferRanking, 
  LiveScore, 
  Tournament,
  ProviderMetadata 
} from '../../types/golf-data-provider';

interface DataGolfRanking {
  dg_id: number;
  player_name: string;
  country: string;
  country_code: string;
  dg_skill_estimate: number;
  owgr: number;
  owgr_rank: number;
}

interface DataGolfLeaderboard {
  event_id: string;
  player_name: string;
  dg_id: number;
  position: string;
  total_score: number;
  thru: string | number;
  today: number;
  r1?: number;
  r2?: number;
  r3?: number;
  r4?: number;
}

export class DataGolfProvider extends BaseGolfDataProvider {
  readonly metadata: ProviderMetadata = {
    name: 'DataGolf',
    version: '1.0.0',
    rateLimit: {
      requests: 100,
      period: 'day', // Free tier: 100 requests/day
    },
  };

  protected async validateConfig(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('DataGolf: API key is required');
    }
    this.config.baseUrl = this.config.baseUrl || 'https://feeds.datagolf.com';
  }

  async getRankings(limit: number = 100): Promise<GolferRanking[]> {
    this.ensureInitialized();

    const url = `${this.config.baseUrl}/get-player-rankings`;
    const queryString = this.buildQueryString({
      file_format: 'json',
      key: this.config.apiKey,
    });

    const response = await this.fetchWithRetry(`${url}?${queryString}`);

    if (!response.ok) {
      throw new Error(`DataGolf API error: ${response.status} ${response.statusText}`);
    }

    const data: { rankings: DataGolfRanking[] } = await response.json();

    return data.rankings
      .slice(0, limit)
      .map(golfer => ({
        name: golfer.player_name,
        worldRank: golfer.owgr_rank || 9999,
        skillRating: golfer.dg_skill_estimate ? Math.round(golfer.dg_skill_estimate * 10) / 10 : undefined,
        country: golfer.country_code,
        externalId: String(golfer.dg_id),
      }));
  }

  async getLiveScores(tournamentId: string): Promise<LiveScore[]> {
    this.ensureInitialized();

    const url = `${this.config.baseUrl}/field-updates`;
    const queryString = this.buildQueryString({
      file_format: 'json',
      key: this.config.apiKey,
      tour: 'pga', // Could make this configurable
      event_id: tournamentId,
    });

    const response = await this.fetchWithRetry(`${url}?${queryString}`);

    if (!response.ok) {
      throw new Error(`DataGolf API error: ${response.status} ${response.statusText}`);
    }

    const data: { leaderboard: DataGolfLeaderboard[] } = await response.json();

    return data.leaderboard.map(entry => ({
      tournamentId,
      tournamentName: '', // Would need separate call to get tournament details
      golferId: String(entry.dg_id),
      golferName: entry.player_name,
      position: entry.position,
      score: entry.total_score,
      thru: entry.thru,
      today: entry.today,
      rounds: [entry.r1, entry.r2, entry.r3, entry.r4].filter(r => r !== undefined) as number[],
      lastUpdated: new Date(),
    }));
  }

  async getTournaments(options?: {
    startDate?: Date;
    endDate?: Date;
    status?: Tournament['status'];
  }): Promise<Tournament[]> {
    this.ensureInitialized();

    const url = `${this.config.baseUrl}/get-schedule`;
    const queryString = this.buildQueryString({
      file_format: 'json',
      key: this.config.apiKey,
      tour: 'pga',
    });

    const response = await this.fetchWithRetry(`${url}?${queryString}`);

    if (!response.ok) {
      throw new Error(`DataGolf API error: ${response.status} ${response.statusText}`);
    }

    const data: { schedule: any[] } = await response.json();

    let tournaments = data.schedule.map(event => {
      const startDate = new Date(event.event_start_date);
      const endDate = new Date(event.event_end_date);
      const now = new Date();
      
      let status: Tournament['status'] = 'upcoming';
      if (now >= startDate && now <= endDate) {
        status = 'in_progress';
      } else if (now > endDate) {
        status = 'completed';
      }

      return {
        id: event.event_id,
        name: event.event_name,
        course: event.course || '',
        startDate,
        endDate,
        status,
        purse: event.purse,
        externalId: event.event_id,
      };
    });

    // Apply filters
    if (options?.startDate) {
      tournaments = tournaments.filter(t => t.startDate >= options.startDate!);
    }
    if (options?.endDate) {
      tournaments = tournaments.filter(t => t.endDate <= options.endDate!);
    }
    if (options?.status) {
      tournaments = tournaments.filter(t => t.status === options.status);
    }

    return tournaments;
  }

  async getGolferDetails(golferId: string): Promise<GolferRanking | null> {
    // DataGolf doesn't have a single player endpoint
    // Would need to fetch all rankings and filter
    const rankings = await this.getRankings(500);
    return rankings.find(g => g.externalId === golferId) || null;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.config.baseUrl}/get-player-rankings`;
      const queryString = this.buildQueryString({
        file_format: 'json',
        key: this.config.apiKey,
      });

      const response = await this.fetchWithRetry(`${url}?${queryString}`, {
        method: 'HEAD', // Just check if endpoint is accessible
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}
