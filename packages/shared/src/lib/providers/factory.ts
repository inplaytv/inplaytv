/**
 * Provider Factory
 * 
 * Centralized provider selection and instantiation
 * Makes it easy to switch providers via environment variables
 */

import { ManualProvider } from './manual-provider';
import { DataGolfProvider } from './datagolf-provider';
import type { IGolfDataProvider, ProviderConfig, ProviderFactoryResult } from '../../types/golf-data-provider';

export type ProviderType = 'manual' | 'datagolf' | 'sportsdata' | 'sportradar';

interface FactoryOptions {
  type: ProviderType;
  config: ProviderConfig;
  supabaseClient?: any; // For manual provider
}

export class GolfDataProviderFactory {
  /**
   * Create and initialize a golf data provider
   */
  static async createProvider(options: FactoryOptions): Promise<ProviderFactoryResult> {
    let provider: IGolfDataProvider;
    let cost: ProviderFactoryResult['cost'] = 'free';
    let reliability: ProviderFactoryResult['reliability'] = 'medium';
    let latency: ProviderFactoryResult['latency'] = 'moderate';

    switch (options.type) {
      case 'manual':
        provider = new ManualProvider(options.supabaseClient);
        cost = 'free';
        reliability = 'high'; // Data comes from our database
        latency = 'fast'; // Direct database queries
        break;

      case 'datagolf':
        provider = new DataGolfProvider();
        cost = 'low'; // $10-50/month
        reliability = 'high'; // Well-maintained API
        latency = 'fast'; // Usually responds in <500ms
        break;

      case 'sportsdata':
        // Placeholder for SportsData.IO provider
        throw new Error('SportsData.IO provider not yet implemented');

      case 'sportradar':
        // Placeholder for SportRadar provider
        throw new Error('SportRadar provider not yet implemented');

      default:
        throw new Error(`Unknown provider type: ${options.type}`);
    }

    await provider.initialize(options.config);

    return {
      provider,
      cost,
      reliability,
      latency,
    };
  }

  /**
   * Create provider from environment variables
   */
  static async createFromEnv(supabaseClient?: any): Promise<ProviderFactoryResult> {
    const providerType = (process.env.GOLF_DATA_PROVIDER || 'manual') as ProviderType;
    
    const config: ProviderConfig = {
      apiKey: process.env.GOLF_API_KEY,
      baseUrl: process.env.GOLF_API_BASE_URL,
      timeout: process.env.GOLF_API_TIMEOUT 
        ? parseInt(process.env.GOLF_API_TIMEOUT) 
        : undefined,
      retries: process.env.GOLF_API_RETRIES 
        ? parseInt(process.env.GOLF_API_RETRIES) 
        : undefined,
      cacheDuration: process.env.GOLF_CACHE_DURATION 
        ? parseInt(process.env.GOLF_CACHE_DURATION) 
        : undefined,
    };

    return this.createProvider({
      type: providerType,
      config,
      supabaseClient,
    });
  }

  /**
   * Get available provider types
   */
  static getAvailableProviders(): ProviderType[] {
    return ['manual', 'datagolf']; // Add more as they're implemented
  }

  /**
   * Get provider recommendations based on use case
   */
  static getRecommendation(useCase: 'startup' | 'growing' | 'enterprise'): {
    primary: ProviderType;
    fallback: ProviderType;
    reason: string;
  } {
    switch (useCase) {
      case 'startup':
        return {
          primary: 'manual',
          fallback: 'manual',
          reason: 'Zero cost. Manual CSV uploads perfect for validating product-market fit.',
        };
      
      case 'growing':
        return {
          primary: 'datagolf',
          fallback: 'manual',
          reason: 'DataGolf offers best value ($10-50/mo). Fallback to manual if API fails.',
        };
      
      case 'enterprise':
        return {
          primary: 'sportradar',
          fallback: 'datagolf',
          reason: 'SportRadar provides most comprehensive data. DataGolf as cost-effective backup.',
        };
    }
  }
}

/**
 * Convenience function for quick provider creation
 */
export async function createGolfDataProvider(
  type: ProviderType = 'manual',
  config?: Partial<ProviderConfig>,
  supabaseClient?: any
): Promise<IGolfDataProvider> {
  const result = await GolfDataProviderFactory.createProvider({
    type,
    config: config || {},
    supabaseClient,
  });

  return result.provider;
}
