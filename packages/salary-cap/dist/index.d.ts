/**
 * Salary Cap Configuration - Single Source of Truth
 * Used by both InPlay and Clubhouse systems
 *
 * Based on DraftKings model: Fixed salary cap with dynamic player pricing
 */
export declare const SALARY_CAP: {
    /**
     * Total salary cap in pennies (£60,000 = 6,000,000 pennies)
     * This is the standard used by DraftKings and other daily fantasy platforms
     */
    readonly TOTAL_PENNIES: 6000000;
    /**
     * Display values for UI
     */
    readonly DISPLAY: {
        readonly CURRENCY: "GBP";
        readonly SYMBOL: "£";
        readonly FORMATTED: "£60,000";
    };
    /**
     * Team composition rules
     */
    readonly LINEUP: {
        readonly SIZE: 6;
        readonly REQUIRE_CAPTAIN: true;
        readonly CAPTAIN_MULTIPLIER: 1.5;
    };
    /**
     * Validation thresholds
     */
    readonly LIMITS: {
        readonly MAX_PLAYER_PERCENT: 0.3;
        readonly MIN_REMAINING: 100;
    };
    /**
     * Salary tier definitions (for UI filtering and display)
     */
    readonly TIERS: {
        readonly PREMIUM: {
            readonly min: 1400000;
            readonly label: "Premium (£14k+)";
            readonly color: "#daa520";
        };
        readonly MID: {
            readonly min: 900000;
            readonly max: 1399999;
            readonly label: "Mid-Range (£9k-14k)";
            readonly color: "#4a9eff";
        };
        readonly VALUE: {
            readonly max: 899999;
            readonly label: "Value (< £9k)";
            readonly color: "#10b981";
        };
    };
};
/**
 * Format salary in pennies to display string
 * @param pennies Salary in pennies
 * @returns Formatted string like "£12,500"
 */
export declare function formatSalary(pennies: number): string;
/**
 * Get tier for a given salary
 * @param pennies Salary in pennies
 * @returns Tier name ('premium' | 'mid' | 'value')
 */
export declare function getSalaryTier(pennies: number): 'premium' | 'mid' | 'value';
/**
 * Validation result interface
 */
export interface ValidationResult {
    valid: boolean;
    totalSalary: number;
    remaining: number;
    errors: string[];
    warnings: string[];
}
/**
 * Validate lineup salary cap compliance
 * @param golfers Array of golfers with salary property
 * @returns ValidationResult with errors and warnings
 */
export declare function validateLineup(golfers: Array<{
    salary: number;
}>): ValidationResult;
/**
 * Check if a golfer can be added to the lineup without exceeding cap
 * @param currentSalary Current total salary
 * @param golferSalary Salary of golfer to add
 * @returns true if can afford, false otherwise
 */
export declare function canAffordGolfer(currentSalary: number, golferSalary: number): boolean;
/**
 * Calculate budget percentage used
 * @param usedSalary Total salary used
 * @returns Percentage (0-100)
 */
export declare function getBudgetPercentage(usedSalary: number): number;
/**
 * Get budget status for UI display
 * @param remaining Remaining budget
 * @returns Status ('healthy' | 'warning' | 'danger')
 */
export declare function getBudgetStatus(remaining: number): 'healthy' | 'warning' | 'danger';
export declare const SALARY_CAP_PENNIES: 6000000;
