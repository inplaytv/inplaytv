/**
 * Dynamic Fantasy Golf Salary Cap System
 * 
 * Based on OWGR (Official World Golf Ranking) with form and field size modifiers
 * Budget: £60,000 | Team Size: 6 golfers | Salary Range: £5,000 - £12,500
 */

export interface GolferSalaryInput {
  id: string;
  full_name: string;
  world_ranking: number;
  form_modifier?: 'excellent' | 'good' | 'average' | 'poor'; // Optional, defaults to 'average'
}

export interface SalaryCalculation {
  golfer_id: string;
  full_name: string;
  world_ranking: number;
  owgr_factor: number;
  form_modifier: number;
  field_size_modifier: number;
  base_salary: number;
  calculated_salary: number;
}

export interface SalaryStats {
  total_golfers: number;
  total_budget: number;
  highest_salary: number;
  lowest_salary: number;
  average_salary: number;
  total_allocated: number;
  cheapest_six_total: number;
  cheapest_six_percentage: number;
}

const TOTAL_BUDGET = 60000;
const MIN_SALARY = 5000;
const MAX_SALARY = 12500;
const BASE_RANGE = MAX_SALARY - MIN_SALARY; // £7,500

/**
 * OWGR Factor Lookup Table
 * Maps world ranking to salary factor (0.0 to 1.0)
 */
const OWGR_FACTORS: { [key: number]: number } = {
  1: 1.0,    // £12,500
  2: 0.93,   // £12,000
  5: 0.87,   // £11,500
  10: 0.75,  // £10,600
  25: 0.55,  // £9,100
  50: 0.35,  // £7,600
  100: 0.22, // £6,600
  200: 0.08, // £5,600
  300: 0.0,  // £5,000
};

/**
 * Form Modifiers (recent performance)
 */
const FORM_MODIFIERS = {
  excellent: 1.2,  // Hot/Excellent form
  good: 1.1,       // Good/Solid form
  average: 1.0,    // Average/Steady form
  poor: 0.9,       // Poor/Struggling form
};

/**
 * Field Size Modifiers
 */
function getFieldSizeModifier(fieldSize: number): number {
  if (fieldSize <= 30) return 1.15;
  if (fieldSize <= 50) return 1.10;
  if (fieldSize <= 70) return 1.05;
  if (fieldSize <= 100) return 1.00;
  return 0.95; // 100+ players
}

/**
 * Calculate OWGR factor using interpolation between known points
 */
function getOWGRFactor(ranking: number): number {
  // Handle edge cases
  if (ranking < 1) ranking = 1;
  if (ranking >= 300) return 0.0;

  // Direct lookup if exact match
  if (OWGR_FACTORS[ranking] !== undefined) {
    return OWGR_FACTORS[ranking];
  }

  // Find surrounding points for interpolation
  const sortedRanks = Object.keys(OWGR_FACTORS)
    .map(Number)
    .sort((a, b) => a - b);

  let lowerRank = sortedRanks[0];
  let upperRank = sortedRanks[sortedRanks.length - 1];

  for (let i = 0; i < sortedRanks.length - 1; i++) {
    if (ranking >= sortedRanks[i] && ranking <= sortedRanks[i + 1]) {
      lowerRank = sortedRanks[i];
      upperRank = sortedRanks[i + 1];
      break;
    }
  }

  // Linear interpolation
  const lowerFactor = OWGR_FACTORS[lowerRank];
  const upperFactor = OWGR_FACTORS[upperRank];
  const ratio = (ranking - lowerRank) / (upperRank - lowerRank);
  
  return lowerFactor + (upperFactor - lowerFactor) * ratio;
}

/**
 * Professional rounding to clean endings
 * Only allow: 000, 500, 600, 700, 800, 900
 */
function roundToClean(value: number): number {
  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;

  let cleanRemainder: number;
  if (remainder < 25) cleanRemainder = 0;
  else if (remainder < 55) cleanRemainder = 50;
  else if (remainder < 65) cleanRemainder = 60;
  else if (remainder < 75) cleanRemainder = 70;
  else if (remainder < 85) cleanRemainder = 80;
  else if (remainder < 95) cleanRemainder = 90;
  else cleanRemainder = 100;

  const result = (hundreds * 100) + (cleanRemainder === 100 ? 100 : cleanRemainder);
  
  // Enforce min/max bounds
  return Math.max(MIN_SALARY, Math.min(MAX_SALARY, result));
}

/**
 * Calculate salary for a single golfer
 */
export function calculateGolferSalary(
  golfer: GolferSalaryInput,
  fieldSize: number = 100
): SalaryCalculation {
  const owgrFactor = getOWGRFactor(golfer.world_ranking);
  const formModifier = FORM_MODIFIERS[golfer.form_modifier || 'average'];
  const fieldSizeModifier = getFieldSizeModifier(fieldSize);

  // Base salary calculation
  const baseSalary = MIN_SALARY + (BASE_RANGE * owgrFactor);
  
  // Apply modifiers
  const withForm = baseSalary * formModifier;
  const withField = withForm * fieldSizeModifier;
  
  // Round to clean number
  const finalSalary = roundToClean(withField);

  return {
    golfer_id: golfer.id,
    full_name: golfer.full_name,
    world_ranking: golfer.world_ranking,
    owgr_factor: Math.round(owgrFactor * 1000) / 1000, // 3 decimal places
    form_modifier: formModifier,
    field_size_modifier: fieldSizeModifier,
    base_salary: Math.round(baseSalary),
    calculated_salary: finalSalary,
  };
}

/**
 * Calculate salaries for all golfers with validation
 */
export function calculateAllSalaries(
  golfers: GolferSalaryInput[],
  fieldSize: number = 100
): { calculations: SalaryCalculation[]; stats: SalaryStats; needsScaling: boolean } {
  // Calculate individual salaries
  let calculations = golfers.map(g => calculateGolferSalary(g, fieldSize));

  // Sort by salary (descending) to find cheapest six
  const sortedBySalary = [...calculations].sort((a, b) => a.calculated_salary - b.calculated_salary);
  const cheapestSix = sortedBySalary.slice(0, 6);
  const cheapestSixTotal = cheapestSix.reduce((sum, c) => sum + c.calculated_salary, 0);
  const cheapestSixPercentage = (cheapestSixTotal / TOTAL_BUDGET) * 100;

  // Validation: Cheapest 6 golfers should cost ≤ 85% of budget (£51,000)
  const maxCheapestSix = TOTAL_BUDGET * 0.85;
  const needsScaling = cheapestSixTotal > maxCheapestSix;

  if (needsScaling) {
    console.warn(`⚠️  Cheapest 6 golfers cost £${cheapestSixTotal} (${cheapestSixPercentage.toFixed(1)}%), exceeding 85% limit`);
    console.warn(`⚠️  Scaling all salaries proportionally...`);

    // Scale all salaries down proportionally
    const scaleFactor = maxCheapestSix / cheapestSixTotal;
    calculations = calculations.map(c => ({
      ...c,
      calculated_salary: roundToClean(c.calculated_salary * scaleFactor),
    }));
  }

  // Sort by world ranking for display
  calculations.sort((a, b) => a.world_ranking - b.world_ranking);

  // Calculate statistics
  const stats: SalaryStats = {
    total_golfers: calculations.length,
    total_budget: TOTAL_BUDGET,
    highest_salary: Math.max(...calculations.map(c => c.calculated_salary)),
    lowest_salary: Math.min(...calculations.map(c => c.calculated_salary)),
    average_salary: Math.round(
      calculations.reduce((sum, c) => sum + c.calculated_salary, 0) / calculations.length
    ),
    total_allocated: calculations.reduce((sum, c) => sum + c.calculated_salary, 0),
    cheapest_six_total: needsScaling
      ? cheapestSix.reduce((sum, c) => sum + roundToClean(c.calculated_salary * (maxCheapestSix / cheapestSixTotal)), 0)
      : cheapestSixTotal,
    cheapest_six_percentage: needsScaling ? 85.0 : cheapestSixPercentage,
  };

  return { calculations, stats, needsScaling };
}

/**
 * Get example salaries for common rankings
 */
export function getExampleSalaries(): SalaryCalculation[] {
  const exampleRankings = [1, 2, 5, 10, 25, 50, 100, 200, 300];
  return exampleRankings.map(rank =>
    calculateGolferSalary(
      { id: `example-${rank}`, full_name: `Rank #${rank}`, world_ranking: rank },
      100
    )
  );
}
