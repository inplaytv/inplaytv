/**
 * Manual CSV Provider
 * 
 * Reads rankings from database (uploaded via CSV admin page)
 * Free tier - no external API calls
 */

import { BaseGolfDataProvider } from './base-provider';
import type { 
  GolferRanking, 
  LiveScore, 
  Tournament, 
  ProviderConfig,
  ProviderMetadata 
} from '../../types/golf-data-provider';

export class ManualProvider extends BaseGolfDataProvider {
  readonly metadata: ProviderMetadata = {
    name: 'Manual CSV Provider',
    version: '1.0.0',
  };

  private supabase: any; // Will be injected

  constructor(supabaseClient?: any) {
    super();
    this.supabase = supabaseClient;
  }

  async initialize(config: ProviderConfig): Promise<void> {
    if (!this.supabase) {
      throw new Error('ManualProvider requires Supabase client');
    }
    await super.initialize(config);
  }

  protected async validateConfig(): Promise<void> {
    // Manual provider doesn't need API config
    if (!this.supabase) {
      throw new Error('Supabase client is required');
    }
  }

  async getRankings(limit: number = 100): Promise<GolferRanking[]> {
    this.ensureInitialized();

    const query = this.supabase
      .from('golfers')
      .select('id, first_name, last_name, world_rank, skill_rating, form_rating, country')
      .not('world_rank', 'is', null)
      .order('world_rank', { ascending: true });

    if (limit) {
      query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch rankings: ${error.message}`);
    }

    return data.map((golfer: any) => ({
      name: `${golfer.first_name} ${golfer.last_name}`,
      firstName: golfer.first_name,
      lastName: golfer.last_name,
      worldRank: golfer.world_rank,
      skillRating: golfer.skill_rating,
      formRating: golfer.form_rating,
      country: golfer.country,
      externalId: golfer.id,
    }));
  }

  async getLiveScores(tournamentId: string): Promise<LiveScore[]> {
    // Manual provider doesn't support live scores
    console.warn('ManualProvider: Live scores not supported');
    return [];
  }

  async getTournaments(options?: {
    startDate?: Date;
    endDate?: Date;
    status?: Tournament['status'];
  }): Promise<Tournament[]> {
    this.ensureInitialized();

    let query = this.supabase
      .from('tournaments')
      .select('id, name, course, start_date, end_date, status, purse_pennies');

    if (options?.startDate) {
      query = query.gte('start_date', options.startDate.toISOString());
    }

    if (options?.endDate) {
      query = query.lte('end_date', options.endDate.toISOString());
    }

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch tournaments: ${error.message}`);
    }

    return data.map((t: any) => ({
      id: t.id,
      name: t.name,
      course: t.course,
      startDate: new Date(t.start_date),
      endDate: new Date(t.end_date),
      status: t.status,
      purse: t.purse_pennies ? t.purse_pennies / 100 : undefined,
      externalId: t.id,
    }));
  }

  async getGolferDetails(golferId: string): Promise<GolferRanking | null> {
    this.ensureInitialized();

    const { data, error } = await this.supabase
      .from('golfers')
      .select('id, first_name, last_name, world_rank, skill_rating, form_rating, country')
      .eq('id', golferId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      name: `${data.first_name} ${data.last_name}`,
      firstName: data.first_name,
      lastName: data.last_name,
      worldRank: data.world_rank,
      skillRating: data.skill_rating,
      formRating: data.form_rating,
      country: data.country,
      externalId: data.id,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('golfers')
        .select('id')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }
}
