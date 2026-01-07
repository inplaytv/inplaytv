"use strict";
/**
 * Salary Cap Configuration - Single Source of Truth
 * Used by both InPlay and Clubhouse systems
 *
 * Based on DraftKings model: Fixed salary cap with dynamic player pricing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SALARY_CAP_PENNIES = exports.SALARY_CAP = void 0;
exports.formatSalary = formatSalary;
exports.getSalaryTier = getSalaryTier;
exports.validateLineup = validateLineup;
exports.canAffordGolfer = canAffordGolfer;
exports.getBudgetPercentage = getBudgetPercentage;
exports.getBudgetStatus = getBudgetStatus;
exports.SALARY_CAP = {
    /**
     * Total salary cap in pennies (£60,000 = 6,000,000 pennies)
     * This is the standard used by DraftKings and other daily fantasy platforms
     */
    TOTAL_PENNIES: 6000000,
    /**
     * Display values for UI
     */
    DISPLAY: {
        CURRENCY: 'GBP',
        SYMBOL: '£',
        FORMATTED: '£60,000',
    },
    /**
     * Team composition rules
     */
    LINEUP: {
        SIZE: 6, // Number of golfers per team
        REQUIRE_CAPTAIN: true, // Must designate one captain
        CAPTAIN_MULTIPLIER: 1.5, // Captain scores 1.5x points
    },
    /**
     * Validation thresholds
     */
    LIMITS: {
        MAX_PLAYER_PERCENT: 0.30, // No single player can exceed 30% of cap (£18,000)
        MIN_REMAINING: 100, // Must have at least £1 left after selections
    },
    /**
     * Salary tier definitions (for UI filtering and display)
     */
    TIERS: {
        PREMIUM: {
            min: 1400000, // £14,000+
            label: 'Premium (£14k+)',
            color: '#daa520' // Gold
        },
        MID: {
            min: 900000, // £9,000 - £13,999
            max: 1399999,
            label: 'Mid-Range (£9k-14k)',
            color: '#4a9eff' // Blue
        },
        VALUE: {
            max: 899999, // Under £9,000
            label: 'Value (< £9k)',
            color: '#10b981' // Green
        },
    },
};
/**
 * Format salary in pennies to display string
 * @param pennies Salary in pennies
 * @returns Formatted string like "£12,500"
 */
function formatSalary(pennies) {
    const pounds = pennies / 100;
    return `${exports.SALARY_CAP.DISPLAY.SYMBOL}${pounds.toLocaleString('en-GB', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    })}`;
}
/**
 * Get tier for a given salary
 * @param pennies Salary in pennies
 * @returns Tier name ('premium' | 'mid' | 'value')
 */
function getSalaryTier(pennies) {
    if (pennies >= exports.SALARY_CAP.TIERS.PREMIUM.min)
        return 'premium';
    if (pennies >= exports.SALARY_CAP.TIERS.MID.min)
        return 'mid';
    return 'value';
}
/**
 * Validate lineup salary cap compliance
 * @param golfers Array of golfers with salary property
 * @returns ValidationResult with errors and warnings
 */
function validateLineup(golfers) {
    const errors = [];
    const warnings = [];
    // Calculate total
    const totalSalary = golfers.reduce((sum, g) => sum + (g.salary || 0), 0);
    const remaining = exports.SALARY_CAP.TOTAL_PENNIES - totalSalary;
    // Check lineup size
    if (golfers.length !== exports.SALARY_CAP.LINEUP.SIZE) {
        errors.push(`Must select exactly ${exports.SALARY_CAP.LINEUP.SIZE} golfers (currently have ${golfers.length})`);
    }
    // Check total salary
    if (totalSalary > exports.SALARY_CAP.TOTAL_PENNIES) {
        const overage = totalSalary - exports.SALARY_CAP.TOTAL_PENNIES;
        errors.push(`Team salary (${formatSalary(totalSalary)}) exceeds cap (${formatSalary(exports.SALARY_CAP.TOTAL_PENNIES)}) by ${formatSalary(overage)}`);
    }
    // Check individual player limits
    const maxAllowed = exports.SALARY_CAP.TOTAL_PENNIES * exports.SALARY_CAP.LIMITS.MAX_PLAYER_PERCENT;
    golfers.forEach((g, idx) => {
        if (g.salary > maxAllowed) {
            errors.push(`Player ${idx + 1} (${formatSalary(g.salary)}) exceeds maximum ${exports.SALARY_CAP.LIMITS.MAX_PLAYER_PERCENT * 100}% of cap (${formatSalary(maxAllowed)})`);
        }
    });
    // Warnings for near-cap situations
    if (remaining < exports.SALARY_CAP.LIMITS.MIN_REMAINING && remaining >= 0) {
        warnings.push(`Only ${formatSalary(remaining)} remaining - very tight budget`);
    }
    if (totalSalary < exports.SALARY_CAP.TOTAL_PENNIES * 0.9) {
        const unused = exports.SALARY_CAP.TOTAL_PENNIES - totalSalary;
        warnings.push(`${formatSalary(unused)} unused - consider upgrading players`);
    }
    return {
        valid: errors.length === 0,
        totalSalary,
        remaining,
        errors,
        warnings,
    };
}
/**
 * Check if a golfer can be added to the lineup without exceeding cap
 * @param currentSalary Current total salary
 * @param golferSalary Salary of golfer to add
 * @returns true if can afford, false otherwise
 */
function canAffordGolfer(currentSalary, golferSalary) {
    return (currentSalary + golferSalary) <= exports.SALARY_CAP.TOTAL_PENNIES;
}
/**
 * Calculate budget percentage used
 * @param usedSalary Total salary used
 * @returns Percentage (0-100)
 */
function getBudgetPercentage(usedSalary) {
    return Math.min(100, (usedSalary / exports.SALARY_CAP.TOTAL_PENNIES) * 100);
}
/**
 * Get budget status for UI display
 * @param remaining Remaining budget
 * @returns Status ('healthy' | 'warning' | 'danger')
 */
function getBudgetStatus(remaining) {
    const percentRemaining = (remaining / exports.SALARY_CAP.TOTAL_PENNIES) * 100;
    if (percentRemaining < 5)
        return 'danger'; // Less than 5% left
    if (percentRemaining < 15)
        return 'warning'; // Less than 15% left
    return 'healthy';
}
// Export constant for backward compatibility
exports.SALARY_CAP_PENNIES = exports.SALARY_CAP.TOTAL_PENNIES;
