// ============================================================================
// Scoring Service - DataGolf Adapter
// ============================================================================
// Purpose: Fetch live tournament scores from DataGolf API with retry logic
// Provider: DataGolf (current) - designed for easy migration to SportsRadar
// ============================================================================
// ============================================================================
// DATAGOLF ADAPTER IMPLEMENTATION
// ============================================================================
export class DataGolfAdapter {
    constructor(apiKey) {
        this.baseUrl = 'https://feeds.datagolf.com';
        this.apiKey = apiKey || process.env.DATAGOLF_API_KEY || '';
        console.log('🔑 DataGolf API Key configured:', this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'MISSING');
        if (!this.apiKey) {
            throw new Error('DataGolf API key is required');
        }
    }
    getProviderName() {
        return 'datagolf';
    }
    // ==========================================================================
    // TRANSFORM HISTORICAL DATA (unused for now)
    // ==========================================================================
    /* private transformHistoricalToInPlay(historicalData: any[], tournament: any): DataGolfInPlayResponse {
      // Historical rounds data is an array of round records
      // We need to group by player and aggregate their scores
      
      const playerMap = new Map<number, DataGolfPlayer>();
      
      for (const round of historicalData) {
        const dgId = round.dg_id;
        
        if (!playerMap.has(dgId)) {
          playerMap.set(dgId, {
            player_name: round.player_name || 'Unknown',
            dg_id: dgId,
            country: round.country,
            position: round.finish_position?.toString(),
            total_to_par: round.total_to_par,
            total_score: round.total_strokes,
            made_cut: round.made_cut === 1
          });
        }
        
        const player = playerMap.get(dgId)!;
        
        // Map round scores (round_num is 1, 2, 3, or 4)
        if (round.round_num === 1) player.R1 = round.round_score;
        if (round.round_num === 2) player.R2 = round.round_score;
        if (round.round_num === 3) player.R3 = round.round_score;
        if (round.round_num === 4) player.R4 = round.round_score;
      }
      
      const players = Array.from(playerMap.values());
      
      return {
        baseline_history_fit: 'historical',
        baseline_history_fit_event_exp: 0,
        baseline_history_fit_n: 0,
        info: {
          current_round: 4,
          event_completed: true,
          event_name: tournament.name,
          last_updated: new Date().toISOString(),
          tour: 'pga',
          year: new Date(tournament.start_date).getFullYear()
        },
        baseline: players
      };
    } */
    // ==========================================================================
    // FETCH LIVE SCORES
    // ==========================================================================
    async fetchLiveScores(tournamentId, supabase) {
        // Get tournament details including event_id and tour
        const { data: tournament, error: tournamentError } = await supabase
            .from('tournaments')
            .select('id, name, event_id, start_date, end_date, status, tour')
            .eq('id', tournamentId)
            .single();
        if (tournamentError || !tournament) {
            throw new Error(`Tournament not found: ${tournamentId}`);
        }
        if (!tournament.event_id) {
            throw new Error(`Tournament ${tournament.name} has no event_id mapped`);
        }
        // Use tournament's tour, default to 'pga' if not set
        const tour = tournament.tour || 'pga';
        console.log(`🔴 Fetching scores for: ${tournament.name} (status: ${tournament.status}, tour: ${tour})`);
        const dgScores = await this.fetchWithRetry(`${this.baseUrl}/preds/in-play`, { tour });
        // Debug: Log the response structure
        console.log('DataGolf API Response structure:', {
            hasBaseline: !!dgScores.baseline,
            hasPreds: !!dgScores.preds,
            hasData: !!dgScores.data,
            hasInfo: !!dgScores.info,
            keys: Object.keys(dgScores),
            infoEventName: dgScores.info?.event_name
        });
        // Verify we got the correct tournament
        const apiEventName = dgScores.info?.event_name;
        if (apiEventName && !tournament.name.toLowerCase().includes(apiEventName.toLowerCase().split(' ').slice(0, 3).join(' '))) {
            throw new Error(`Tournament mismatch: Expected "${tournament.name}" but API returned "${apiEventName}". ` +
                `This tournament may not be currently active.`);
        }
        // Check if we got valid data - try baseline, preds, or data (different tours use different formats)
        const tournamentPlayers = dgScores.baseline || dgScores.preds || dgScores.data;
        if (!tournamentPlayers || tournamentPlayers.length === 0) {
            throw new Error(`Invalid response from DataGolf API - missing player data. Event: ${apiEventName || 'Unknown'}`);
        }
        console.log(`✅ Found ${tournamentPlayers.length} players in DataGolf response`);
        // Get golfer mappings from our database
        const { data: golfers } = await supabase
            .from('golfers')
            .select('id, full_name, dg_id, country');
        const golferMap = new Map(golfers?.map((g) => [g.dg_id, g]) || []);
        // Map DataGolf response to our format
        const scores = tournamentPlayers
            .map(player => {
            const golfer = golferMap.get(player.dg_id);
            if (!golfer)
                return null; // Skip players not in our system
            // Determine status
            let status = 'not_started';
            if (player.status === 'wd' || player.status === 'WD') {
                status = 'withdrawn';
            }
            else if (player.made_cut === false) {
                status = 'cut';
            }
            else if (player.R1 !== undefined || player.R2 !== undefined ||
                player.R3 !== undefined || player.R4 !== undefined) {
                // Check if currently playing
                if (player.thru && player.thru !== 'F' && player.thru !== '') {
                    status = 'in_progress';
                }
                else {
                    status = 'completed';
                }
            }
            return {
                golfer: {
                    id: golfer.id,
                    dgId: player.dg_id,
                    name: player.player_name,
                    country: player.country,
                },
                rounds: {
                    round1: player.R1 !== undefined ? {
                        score: player.R1,
                        toPar: this.calculateToPar(player.R1, 72),
                        status: this.getRoundStatus(player, 1, dgScores.info.current_round),
                        holesCompleted: player.thru && dgScores.info.current_round === 1 ?
                            this.parseThru(player.thru) : 18,
                    } : undefined,
                    round2: player.R2 !== undefined ? {
                        score: player.R2,
                        toPar: this.calculateToPar(player.R2, 72),
                        status: this.getRoundStatus(player, 2, dgScores.info.current_round),
                        holesCompleted: player.thru && dgScores.info.current_round === 2 ?
                            this.parseThru(player.thru) : 18,
                    } : undefined,
                    round3: player.R3 !== undefined ? {
                        score: player.R3,
                        toPar: this.calculateToPar(player.R3, 72),
                        status: this.getRoundStatus(player, 3, dgScores.info.current_round),
                        holesCompleted: player.thru && dgScores.info.current_round === 3 ?
                            this.parseThru(player.thru) : 18,
                    } : undefined,
                    round4: player.R4 !== undefined ? {
                        score: player.R4,
                        toPar: this.calculateToPar(player.R4, 72),
                        status: this.getRoundStatus(player, 4, dgScores.info.current_round),
                        holesCompleted: player.thru && dgScores.info.current_round === 4 ?
                            this.parseThru(player.thru) : 18,
                    } : undefined,
                },
                position: player.position || player.current_pos,
                totalScore: player.total_score || player.current_score,
                toPar: player.total_to_par,
                status,
            };
        })
            .filter(Boolean);
        return {
            tournament: {
                id: tournament.id,
                name: tournament.name,
                currentRound: dgScores.info.current_round,
                status: dgScores.info.event_completed ? 'completed' :
                    tournament.status === 'live' ? 'live' : 'upcoming',
                lastUpdate: new Date(dgScores.info.last_updated),
            },
            scores,
        };
    }
    // ==========================================================================
    // FETCH TOURNAMENT FIELD
    // ==========================================================================
    async fetchTournamentField(tournamentId, supabase) {
        const { data: tournament } = await supabase
            .from('tournaments')
            .select('id, event_id')
            .eq('id', tournamentId)
            .single();
        if (!tournament?.event_id) {
            throw new Error(`Tournament ${tournamentId} has no event_id`);
        }
        const dgField = await this.fetchWithRetry(`${this.baseUrl}/field-updates`, {
            tour: 'pga',
            event_id: tournament.event_id,
        });
        // Map to our format
        const players = dgField.field.map(player => ({
            golferId: '', // Will be resolved by the sync service
            dgId: player.dg_id,
            name: player.player_name,
            teeTimes: {
                round1: player.r1_teetime ? new Date(player.r1_teetime) : undefined,
                round2: player.r2_teetime ? new Date(player.r2_teetime) : undefined,
                round3: player.r3_teetime ? new Date(player.r3_teetime) : undefined,
                round4: player.r4_teetime ? new Date(player.r4_teetime) : undefined,
            },
        }));
        return {
            tournamentId: tournament.id,
            players,
        };
    }
    // ==========================================================================
    // HELPER METHODS
    // ==========================================================================
    getRoundStatus(player, round, currentRound) {
        if (player.status === 'wd' || player.status === 'WD') {
            return 'withdrawn';
        }
        const roundScore = player[`R${round}`];
        if (roundScore === undefined) {
            return 'not_started';
        }
        if (round < currentRound) {
            return 'completed';
        }
        if (round === currentRound) {
            if (player.thru === 'F' || player.thru === 18 || player.thru === '18') {
                return 'completed';
            }
            return 'in_progress';
        }
        return 'not_started';
    }
    calculateToPar(score, par) {
        return score - par;
    }
    parseThru(thru) {
        if (typeof thru === 'number')
            return thru;
        if (thru === 'F')
            return 18;
        const parsed = parseInt(thru, 10);
        return isNaN(parsed) ? 0 : parsed;
    }
    // ==========================================================================
    // RETRY LOGIC
    // ==========================================================================
    async fetchWithRetry(url, params, maxRetries = 3) {
        const queryParams = new URLSearchParams({
            ...params,
            key: this.apiKey,
        });
        const fullUrl = `${url}?${queryParams.toString()}`;
        console.log('🌐 DataGolf API URL:', fullUrl.replace(this.apiKey, 'KEY_HIDDEN'));
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(fullUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`❌ DataGolf API ${response.status}:`, errorText.substring(0, 200));
                    throw new Error(`DataGolf API error: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                return data;
            }
            catch (error) {
                const isLastAttempt = attempt === maxRetries;
                if (isLastAttempt) {
                    console.error(`DataGolf API failed after ${maxRetries} attempts:`, error);
                    throw error;
                }
                // Exponential backoff: 1s, 5s, 15s
                const delayMs = Math.pow(5, attempt - 1) * 1000;
                console.warn(`DataGolf API attempt ${attempt} failed, retrying in ${delayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        throw new Error('Should never reach here');
    }
}
// ============================================================================
// SCORING SERVICE FACTORY
// ============================================================================
export class ScoringService {
    constructor(provider, apiKey) {
        const selectedProvider = provider ||
            process.env.SCORING_PROVIDER ||
            'datagolf';
        switch (selectedProvider) {
            case 'datagolf':
                this.adapter = new DataGolfAdapter(apiKey);
                break;
            case 'sportsradar':
                // TODO: Implement in Phase 2
                throw new Error('SportsRadar adapter not yet implemented');
            default:
                throw new Error(`Unknown scoring provider: ${selectedProvider}`);
        }
    }
    async fetchLiveScores(tournamentId, supabase) {
        return this.adapter.fetchLiveScores(tournamentId, supabase);
    }
    async fetchTournamentField(tournamentId, supabase) {
        return this.adapter.fetchTournamentField(tournamentId, supabase);
    }
    getProviderName() {
        return this.adapter.getProviderName();
    }
}
//# sourceMappingURL=index.js.map