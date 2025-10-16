/**
 * ENHANCED FANTASY GOLF SALARY CAP SYSTEM
 * 
 * Advanced pricing algorithm that considers:
 * - World Golf Rankings
 * - Recent form and performance trends
 * - Tournament history and course fit
 * - Dynamic pricing based on ownership percentages
 * - Injury status and player availability
 */

class FantasyGolfSalarySystem {
    constructor() {
        // Base salary cap for different tournament tiers
        this.salaryCaps = {
            'FEATURED': 60000,      // £60,000 for featured tournaments
            'ELITE': 75000,         // £75,000 for elite tournaments
            'EXCLUSIVE': 90000,     // £90,000 for exclusive tournaments
            'EXECUTIVE': 120000,    // £120,000 for executive tournaments
            'PLATINUM': 150000,     // £150,000 for platinum tournaments
            'GOLD': 200000          // £200,000 for gold tournaments
        };

        // Base pricing tiers
        this.basePricing = {
            'TIER_1': { min: 12000, max: 15000 }, // Top 5 world ranking
            'TIER_2': { min: 10000, max: 12000 }, // Top 6-15 world ranking
            'TIER_3': { min: 8000, max: 10000 },  // Top 16-30 world ranking
            'TIER_4': { min: 6500, max: 8000 },   // Top 31-50 world ranking
            'TIER_5': { min: 5000, max: 6500 },   // Top 51-100 world ranking
            'TIER_6': { min: 3500, max: 5000 }    // Beyond top 100
        };

        // Performance multipliers
        this.multipliers = {
            recentForm: {
                'HOT': 1.25,      // Won or top 3 in last 3 events
                'WARM': 1.10,     // Top 10 in last 3 events
                'NEUTRAL': 1.00,  // Average recent performance
                'COLD': 0.85      // Missed cuts or poor finishes
            },
            courseHistory: {
                'EXCELLENT': 1.20, // Multiple wins/top 5s at course
                'GOOD': 1.10,      // Consistent top 20s at course
                'AVERAGE': 1.00,   // Mixed results at course
                'POOR': 0.90       // Poor track record at course
            },
            ownership: {
                'HIGH': 0.90,      // >20% owned (discount for high ownership)
                'MEDIUM': 1.00,    // 10-20% owned
                'LOW': 1.15        // <10% owned (premium for low ownership)
            }
        };
    }

    /**
     * Calculate dynamic player salary based on multiple factors
     */
    calculatePlayerSalary(player) {
        const {
            worldRanking = 100,
            recentForm = 'NEUTRAL',
            courseHistory = 'AVERAGE',
            ownershipLevel = 'MEDIUM',
            injuryStatus = 'HEALTHY',
            majorWins = 0,
            lastEventFinish = null
        } = player;

        // Determine base tier
        let tier = this.getPlayerTier(worldRanking);
        
        // Get base salary range
        const baseRange = this.basePricing[tier];
        let baseSalary = (baseRange.min + baseRange.max) / 2;

        // Apply major championship bonus
        baseSalary += (majorWins * 500);

        // Apply recent form multiplier
        baseSalary *= this.multipliers.recentForm[recentForm];

        // Apply course history multiplier
        baseSalary *= this.multipliers.courseHistory[courseHistory];

        // Apply ownership multiplier (contrarian pricing)
        baseSalary *= this.multipliers.ownership[ownershipLevel];

        // Apply injury discount
        if (injuryStatus === 'QUESTIONABLE') baseSalary *= 0.85;
        if (injuryStatus === 'INJURED') baseSalary *= 0.70;

        // Recent event performance adjustment
        if (lastEventFinish) {
            if (lastEventFinish === 'WIN') baseSalary *= 1.30;
            else if (lastEventFinish <= 3) baseSalary *= 1.20;
            else if (lastEventFinish <= 10) baseSalary *= 1.10;
            else if (lastEventFinish === 'MC') baseSalary *= 0.80;
        }

        // Round to nearest 100
        return Math.round(baseSalary / 100) * 100;
    }

    /**
     * Determine player tier based on world ranking
     */
    getPlayerTier(ranking) {
        if (ranking <= 5) return 'TIER_1';
        if (ranking <= 15) return 'TIER_2';
        if (ranking <= 30) return 'TIER_3';
        if (ranking <= 50) return 'TIER_4';
        if (ranking <= 100) return 'TIER_5';
        return 'TIER_6';
    }

    /**
     * Validate lineup against salary cap
     */
    validateLineup(players, tournamentTier = 'FEATURED') {
        const totalSalary = players.reduce((sum, player) => {
            return sum + this.calculatePlayerSalary(player);
        }, 0);

        const salaryCap = this.salaryCaps[tournamentTier];
        const remaining = salaryCap - totalSalary;

        return {
            totalSalary,
            salaryCap,
            remaining,
            isValid: remaining >= 0,
            utilization: ((totalSalary / salaryCap) * 100).toFixed(1)
        };
    }

    /**
     * Generate optimized lineup suggestions
     */
    suggestOptimalLineup(availablePlayers, tournamentTier = 'FEATURED', strategy = 'BALANCED') {
        const cap = this.salaryCaps[tournamentTier];
        let suggestions = [];

        // Different strategy approaches
        const strategies = {
            'STARS_AND_SCRUBS': this.starsAndScrubsStrategy,
            'BALANCED': this.balancedStrategy,
            'CONTRARIAN': this.contrarianStrategy,
            'CASH_GAME': this.cashGameStrategy
        };

        return strategies[strategy].call(this, availablePlayers, cap);
    }

    /**
     * Strategy: Stars and Scrubs (1-2 expensive players, fill with value)
     */
    starsAndScrubsStrategy(players, cap) {
        // Implementation for stars and scrubs approach
        const tier1Players = players.filter(p => this.getPlayerTier(p.worldRanking) === 'TIER_1');
        const valuePlayers = players.filter(p => this.getPlayerTier(p.worldRanking) >= 'TIER_4');
        
        // Select 1-2 top tier players, fill rest with value
        // ... implementation logic
    }

    /**
     * Strategy: Balanced approach across all tiers
     */
    balancedStrategy(players, cap) {
        // Even distribution across salary tiers
        // ... implementation logic
    }

    /**
     * Generate tournament-specific pricing
     */
    generateTournamentPricing(tournament) {
        return {
            tournamentName: tournament.name,
            tier: tournament.tier,
            salaryCap: this.salaryCaps[tournament.tier],
            field: tournament.players.map(player => ({
                ...player,
                salary: this.calculatePlayerSalary(player),
                tier: this.getPlayerTier(player.worldRanking)
            }))
        };
    }
}

/**
 * SAMPLE ENHANCED PLAYER DATABASE
 */
const enhancedPlayerDatabase = [
    {
        name: 'Scottie Scheffler',
        worldRanking: 1,
        recentForm: 'HOT',
        courseHistory: 'EXCELLENT',
        ownershipLevel: 'HIGH',
        injuryStatus: 'HEALTHY',
        majorWins: 2,
        lastEventFinish: 'WIN',
        stats: {
            drivingDistance: 295,
            fairwayAccuracy: 68.5,
            greenInRegulation: 72.3,
            puttingAverage: 28.8
        }
    },
    {
        name: 'Rory McIlroy',
        worldRanking: 2,
        recentForm: 'WARM',
        courseHistory: 'GOOD',
        ownershipLevel: 'HIGH',
        injuryStatus: 'HEALTHY',
        majorWins: 4,
        lastEventFinish: 2,
        stats: {
            drivingDistance: 318,
            fairwayAccuracy: 61.2,
            greenInRegulation: 70.8,
            puttingAverage: 29.1
        }
    },
    {
        name: 'Viktor Hovland',
        worldRanking: 8,
        recentForm: 'NEUTRAL',
        courseHistory: 'AVERAGE',
        ownershipLevel: 'MEDIUM',
        injuryStatus: 'HEALTHY',
        majorWins: 0,
        lastEventFinish: 15,
        stats: {
            drivingDistance: 285,
            fairwayAccuracy: 65.4,
            greenInRegulation: 69.2,
            puttingAverage: 28.9
        }
    },
    {
        name: 'Cameron Young',
        worldRanking: 35,
        recentForm: 'HOT',
        courseHistory: 'POOR',
        ownershipLevel: 'LOW',
        injuryStatus: 'HEALTHY',
        majorWins: 0,
        lastEventFinish: 3,
        stats: {
            drivingDistance: 325,
            fairwayAccuracy: 58.7,
            greenInRegulation: 67.5,
            puttingAverage: 29.8
        }
    }
];

/**
 * USAGE EXAMPLES
 */

// Initialize the salary system
const salarySystem = new FantasyGolfSalarySystem();

// Calculate individual player salary
const scottiePrice = salarySystem.calculatePlayerSalary(enhancedPlayerDatabase[0]);
console.log(`Scottie Scheffler: £${scottiePrice.toLocaleString()}`);

// Validate a complete lineup
const sampleLineup = enhancedPlayerDatabase.slice(0, 6);
const validation = salarySystem.validateLineup(sampleLineup, 'ELITE');
console.log('Lineup Validation:', validation);

// Generate tournament pricing
const mastersTournament = {
    name: 'Masters Tournament 2025',
    tier: 'ELITE',
    players: enhancedPlayerDatabase
};

const tournamentPricing = salarySystem.generateTournamentPricing(mastersTournament);
console.log('Tournament Pricing:', tournamentPricing);

export default FantasyGolfSalarySystem;