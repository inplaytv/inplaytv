export type SupabaseClient = any;
export interface ScoringAdapter {
    fetchLiveScores(tournamentId: string, supabase: SupabaseClient): Promise<TournamentScores>;
    fetchTournamentField(tournamentId: string, supabase: SupabaseClient): Promise<TournamentField>;
    getProviderName(): string;
}
export interface TournamentScores {
    tournament: {
        id: string;
        name: string;
        currentRound: number;
        status: 'upcoming' | 'live' | 'completed';
        lastUpdate: Date;
    };
    scores: PlayerRoundScore[];
}
export interface PlayerRoundScore {
    golfer: {
        id: string;
        dgId?: number;
        name: string;
        country?: string;
    };
    rounds: {
        round1?: RoundScore;
        round2?: RoundScore;
        round3?: RoundScore;
        round4?: RoundScore;
    };
    position?: string;
    totalScore?: number;
    toPar?: number;
    status: 'not_started' | 'in_progress' | 'completed' | 'withdrawn' | 'cut';
}
export interface RoundScore {
    score: number | null;
    toPar: number | null;
    status: 'not_started' | 'in_progress' | 'completed' | 'withdrawn';
    holesCompleted?: number;
    thru?: string | number;
    teeTime?: Date;
}
export interface TournamentField {
    tournamentId: string;
    players: {
        golferId: string;
        dgId: number;
        name: string;
        teeTimes?: {
            round1?: Date;
            round2?: Date;
            round3?: Date;
            round4?: Date;
        };
    }[];
}
export declare class DataGolfAdapter implements ScoringAdapter {
    private apiKey;
    private baseUrl;
    constructor(apiKey?: string);
    getProviderName(): string;
    fetchLiveScores(tournamentId: string, supabase: SupabaseClient): Promise<TournamentScores>;
    fetchTournamentField(tournamentId: string, supabase: SupabaseClient): Promise<TournamentField>;
    private getRoundStatus;
    private calculateToPar;
    private parseThru;
    private fetchWithRetry;
}
export declare class ScoringService {
    private adapter;
    constructor(provider?: 'datagolf' | 'sportsradar', apiKey?: string);
    fetchLiveScores(tournamentId: string, supabase: SupabaseClient): Promise<TournamentScores>;
    fetchTournamentField(tournamentId: string, supabase: SupabaseClient): Promise<TournamentField>;
    getProviderName(): string;
}
//# sourceMappingURL=index.d.ts.map