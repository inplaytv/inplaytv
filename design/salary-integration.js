/**
 * INTEGRATION FILE: Enhanced Salary System for Existing Golf Fantasy App
 * 
 * This file provides immediate improvements to your current salary/cap system
 * while maintaining compatibility with existing tournament pages.
 */

// Enhanced player data with dynamic pricing factors
const enhancedTournamentData = {
    // Featured Tournament (£60,000 cap)
    featured: {
        salaryCap: 60000,
        players: [
            {
                name: 'Scottie Scheffler',
                worldRanking: 1,
                baseSalary: 14500,
                recentForm: 'HOT',
                courseHistory: 'EXCELLENT',
                ownership: 'HIGH',
                finalSalary: 13050, // Adjusted down due to high ownership
                stats: { driving: 295, accuracy: 68.5, gir: 72.3, putting: 28.8 },
                badge: 'excellent'
            },
            {
                name: 'Rory McIlroy',
                worldRanking: 2,
                baseSalary: 13800,
                recentForm: 'WARM',
                courseHistory: 'GOOD',
                ownership: 'HIGH',
                finalSalary: 12420, // Adjusted down due to high ownership
                stats: { driving: 318, accuracy: 61.2, gir: 70.8, putting: 29.1 },
                badge: 'excellent'
            },
            {
                name: 'Viktor Hovland',
                worldRanking: 8,
                baseSalary: 9200,
                recentForm: 'NEUTRAL',
                courseHistory: 'AVERAGE',
                ownership: 'MEDIUM',
                finalSalary: 9200,
                stats: { driving: 285, accuracy: 65.4, gir: 69.2, putting: 28.9 },
                badge: 'good'
            },
            {
                name: 'Xander Schauffele',
                worldRanking: 5,
                baseSalary: 11400,
                recentForm: 'WARM',
                courseHistory: 'GOOD',
                ownership: 'MEDIUM',
                finalSalary: 10400,
                stats: { driving: 288, accuracy: 71.2, gir: 71.8, putting: 28.5 },
                badge: 'good'
            },
            {
                name: 'Cameron Young',
                worldRanking: 35,
                baseSalary: 6800,
                recentForm: 'HOT',
                courseHistory: 'POOR',
                ownership: 'LOW',
                finalSalary: 7800, // Premium for low ownership + hot form
                stats: { driving: 325, accuracy: 58.7, gir: 67.5, putting: 29.8 },
                badge: 'good'
            },
            {
                name: 'Russell Henley',
                worldRanking: 45,
                baseSalary: 5500,
                recentForm: 'COLD',
                courseHistory: 'AVERAGE',
                ownership: 'LOW',
                finalSalary: 6200,
                stats: { driving: 275, accuracy: 72.1, gir: 68.2, putting: 29.2 },
                badge: 'average'
            }
        ]
    },

    // Elite Tournament (£75,000 cap)
    elite: {
        salaryCap: 75000,
        players: [
            {
                name: 'Scottie Scheffler',
                finalSalary: 15500,
                ownership: 'HIGH',
                projectedPoints: 85
            },
            {
                name: 'Jon Rahm',
                finalSalary: 14200,
                ownership: 'HIGH',
                projectedPoints: 78
            },
            {
                name: 'Patrick Cantlay',
                finalSalary: 12800,
                ownership: 'MEDIUM',
                projectedPoints: 72
            },
            {
                name: 'Max Homa',
                finalSalary: 9400,
                ownership: 'LOW',
                projectedPoints: 65
            },
            {
                name: 'Tony Finau',
                finalSalary: 8800,
                ownership: 'MEDIUM',
                projectedPoints: 60
            },
            {
                name: 'Russell Henley',
                finalSalary: 7200,
                ownership: 'LOW',
                projectedPoints: 55
            }
        ]
    }
};

/**
 * SALARY CALCULATION FUNCTIONS
 */

// Calculate value score (points per $1000 of salary)
function calculateValueScore(player) {
    const pointsPer1K = (player.projectedPoints || 50) / (player.finalSalary / 1000);
    return Math.round(pointsPer1K * 10) / 10;
}

// Generate optimal lineup within salary cap
function generateOptimalLineup(players, salaryCap, strategy = 'balanced') {
    const strategies = {
        balanced: generateBalancedLineup,
        starsAndScrubs: generateStarsAndScrubsLineup,
        contrarian: generateContrarianLineup,
        cashGame: generateCashGameLineup
    };
    
    return strategies[strategy](players, salaryCap);
}

function generateBalancedLineup(players, salaryCap) {
    // Sort players by value score
    const sortedPlayers = players
        .map(p => ({ ...p, valueScore: calculateValueScore(p) }))
        .sort((a, b) => b.valueScore - a.valueScore);
    
    let lineup = [];
    let remainingCap = salaryCap;
    
    // Select 6 players that fit within cap and maximize value
    for (let player of sortedPlayers) {
        if (lineup.length < 6 && player.finalSalary <= remainingCap) {
            lineup.push(player);
            remainingCap -= player.finalSalary;
        }
    }
    
    return {
        players: lineup,
        totalSalary: salaryCap - remainingCap,
        remainingCap: remainingCap,
        projectedPoints: lineup.reduce((sum, p) => sum + (p.projectedPoints || 50), 0)
    };
}

function generateStarsAndScrubsLineup(players, salaryCap) {
    // Select 1-2 expensive players, fill rest with value plays
    const expensive = players.filter(p => p.finalSalary >= salaryCap * 0.2);
    const cheap = players.filter(p => p.finalSalary < salaryCap * 0.15);
    
    let lineup = [];
    let remainingCap = salaryCap;
    
    // Add 1-2 stars
    const stars = expensive.slice(0, 2);
    for (let star of stars) {
        if (star.finalSalary <= remainingCap) {
            lineup.push(star);
            remainingCap -= star.finalSalary;
        }
    }
    
    // Fill rest with value plays
    const valuesByScore = cheap
        .map(p => ({ ...p, valueScore: calculateValueScore(p) }))
        .sort((a, b) => b.valueScore - a.valueScore);
    
    for (let player of valuesByScore) {
        if (lineup.length < 6 && player.finalSalary <= remainingCap) {
            lineup.push(player);
            remainingCap -= player.finalSalary;
        }
    }
    
    return {
        players: lineup,
        totalSalary: salaryCap - remainingCap,
        remainingCap: remainingCap,
        projectedPoints: lineup.reduce((sum, p) => sum + (p.projectedPoints || 50), 0),
        strategy: 'Stars & Scrubs'
    };
}

function generateContrarianLineup(players, salaryCap) {
    // Focus on low-ownership players
    const contrarian = players
        .filter(p => p.ownership === 'LOW')
        .map(p => ({ ...p, valueScore: calculateValueScore(p) }))
        .sort((a, b) => b.valueScore - a.valueScore);
    
    let lineup = [];
    let remainingCap = salaryCap;
    
    for (let player of contrarian) {
        if (lineup.length < 6 && player.finalSalary <= remainingCap) {
            lineup.push(player);
            remainingCap -= player.finalSalary;
        }
    }
    
    // Fill remaining spots with best available
    if (lineup.length < 6) {
        const remaining = players.filter(p => !lineup.includes(p));
        for (let player of remaining) {
            if (lineup.length < 6 && player.finalSalary <= remainingCap) {
                lineup.push(player);
                remainingCap -= player.finalSalary;
            }
        }
    }
    
    return {
        players: lineup,
        totalSalary: salaryCap - remainingCap,
        remainingCap: remainingCap,
        projectedPoints: lineup.reduce((sum, p) => sum + (p.projectedPoints || 50), 0),
        strategy: 'Contrarian'
    };
}

/**
 * INTEGRATION WITH EXISTING SYSTEM
 */

// Update existing tournament data structure
function enhanceExistingData(originalData) {
    return Object.keys(originalData).reduce((enhanced, entryKey) => {
        const entry = originalData[entryKey];
        enhanced[entryKey] = {
            ...entry,
            players: entry.players.map(player => ({
                ...player,
                // Convert price string to salary number
                salary: parseInt(player.price.replace(/[$,]/g, '')),
                valueScore: calculateValueScore({
                    finalSalary: parseInt(player.price.replace(/[$,]/g, '')),
                    projectedPoints: parseInt(player.points)
                })
            }))
        };
        return enhanced;
    }, {});
}

/**
 * SALARY CAP VALIDATION
 */
function validateLineupSalary(players, tournamentTier = 'featured') {
    const caps = {
        featured: 60000,
        elite: 75000,
        exclusive: 90000,
        executive: 120000,
        platinum: 150000,
        gold: 200000
    };
    
    const totalSalary = players.reduce((sum, player) => {
        return sum + (player.salary || parseInt((player.price || '0').replace(/[$,]/g, '')));
    }, 0);
    
    const salaryCap = caps[tournamentTier];
    const remaining = salaryCap - totalSalary;
    const utilization = ((totalSalary / salaryCap) * 100).toFixed(1);
    
    return {
        totalSalary,
        salaryCap,
        remaining,
        utilization,
        isValid: remaining >= 0,
        status: remaining >= 0 ? 'VALID' : 'OVER_CAP'
    };
}

/**
 * EXPORT FOR INTEGRATION
 */
window.EnhancedSalarySystem = {
    data: enhancedTournamentData,
    calculateValueScore,
    generateOptimalLineup,
    validateLineupSalary,
    enhanceExistingData
};

// Example usage:
console.log('Enhanced Salary System Loaded!');
console.log('Featured Tournament Salary Cap:', enhancedTournamentData.featured.salaryCap);

// Example lineup validation
const sampleLineup = enhancedTournamentData.featured.players.slice(0, 6);
const validation = validateLineupSalary(sampleLineup, 'featured');
console.log('Sample Lineup Validation:', validation);