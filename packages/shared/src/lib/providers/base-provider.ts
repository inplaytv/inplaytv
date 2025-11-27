/**
 * Base Provider Class
 * 
 * Shared functionality for all golf data providers
 */

import type { IGolfDataProvider, ProviderConfig, ProviderMetadata } from '../../types/golf-data-provider';

export abstract class BaseGolfDataProvider implements IGolfDataProvider {
  protected config: ProviderConfig = {};
  protected initialized = false;
  
  abstract readonly metadata: ProviderMetadata;

  async initialize(config: ProviderConfig): Promise<void> {
    this.config = {
      timeout: 10000, // 10 second default
      retries: 3,
      cacheDuration: 30000, // 30 second default
      ...config,
    };
    
    // Validate required config
    await this.validateConfig();
    
    this.initialized = true;
  }

  /**
   * Override to add provider-specific validation
   */
  protected async validateConfig(): Promise<void> {
    if (!this.config.baseUrl) {
      throw new Error(`${this.metadata.name}: baseUrl is required`);
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  protected async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok && retryCount < (this.config.retries || 0)) {
        // Exponential backoff: 1s, 2s, 4s
        await this.delay(Math.pow(2, retryCount) * 1000);
        return this.fetchWithRetry(url, options, retryCount + 1);
      }

      return response;
    } catch (error) {
      if (retryCount < (this.config.retries || 0)) {
        await this.delay(Math.pow(2, retryCount) * 1000);
        return this.fetchWithRetry(url, options, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Helper: delay execution
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Helper: build query string
   */
  protected buildQueryString(params: Record<string, any>): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });
    return query.toString();
  }

  /**
   * Helper: ensure provider is initialized
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(`${this.metadata.name}: Provider not initialized. Call initialize() first.`);
    }
  }

  /**
   * Must be implemented by each provider
   */
  abstract getRankings(limit?: number): Promise<any[]>;
  abstract getLiveScores(tournamentId: string): Promise<any[]>;
  abstract getTournaments(options?: any): Promise<any[]>;
  abstract getGolferDetails(golferId: string): Promise<any>;
  abstract healthCheck(): Promise<boolean>;
}
