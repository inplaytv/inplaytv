/**
 * CLUBHOUSE SMART SALARY CALCULATOR
 * 
 * Implements advanced pricing based on:
 * - 60% World Ranking (OWGR from DataGolf)
 * - 40% Form Score (recent finishes/strokes gained)
 * 
 * Budget: 60,000 for 6 players
 * Target Ranges:
 * - Elite (Top 5): 11,500 – 13,000
 * - Mid-Tier: 9,000 – 11,000
 * - Value/Sleepers: 6,500 – 8,500
 * 
 * Constraints:
 * - Floor: 6,000 (min)
 * - Ceiling: 13,500 (max)
 * - Average: 10,000
 * - Uses Sigmoid (S-curve) for price distribution
 */

require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration
const TOTAL_BUDGET = 60000;
const TEAM_SIZE = 6;
const AVERAGE_SALARY = TOTAL_BUDGET / TEAM_SIZE; // 10,000
const MIN_SALARY = 6000;  // Floor
const MAX_SALARY = 13500; // Ceiling
const SALARY_RANGE = MAX_SALARY - MIN_SALARY; // 7,500

// Weighting
const RANK_WEIGHT = 0.6;  // 60%
const FORM_WEIGHT = 0.4;  // 40%

/**
 * Calculate Rank Score (0-100)
 * Lower rank = higher score
 * Uses logarithmic scale for better distribution
 */
function calculateRankScore(rank, totalPlayers) {
  if (!rank || rank <= 0) return 0;
  
  // Logarithmic scale: #1 gets 100, #150 gets ~1
  // log(1) = 0, log(totalPlayers) = max
  const logRank = Math.log(rank);
  const logMax = Math.log(totalPlayers || 150);
  
  // Invert so lower rank = higher score
  const score = 100 * (1 - (logRank / logMax));
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate Form Score (0-100)
 * Based on recent tournament finishes
 * 
 * @param {number} avgFinish - Average finish position in last 5 tournaments
 * @param {number} strokesGained - Average strokes gained (if available)
 */
function calculateFormScore(avgFinish, strokesGained = null) {
  // If we have strokes gained, use that (more accurate)
  if (strokesGained !== null) {
    // SG typically ranges from -5 to +5 per round
    // +5 = 100 points, -5 = 0 points
    return Math.max(0, Math.min(100, (strokesGained + 5) * 10));
  }
  
  // Otherwise use finish position
  // Win = 100 pts, Top 10 = 80 pts, Made Cut (Top 70) = 40 pts
  if (!avgFinish || avgFinish <= 0) return 50; // Default to average
  
  if (avgFinish === 1) return 100; // Win
  if (avgFinish <= 5) return 90;   // Top 5
  if (avgFinish <= 10) return 80;  // Top 10
  if (avgFinish <= 20) return 65;  // Top 20
  if (avgFinish <= 30) return 55;  // Top 30
  if (avgFinish <= 50) return 45;  // Made cut
  return 30; // Missed cut or worse
}

/**
 * Sigmoid function (S-curve) for smooth price distribution
 * Ensures larger gaps at the top, smaller gaps at bottom
 * 
 * @param {number} x - Input value (0-1)
 * @param {number} steepness - How steep the curve is (default 6)
 * @returns {number} - Sigmoid output (0-1)
 */
function sigmoid(x, steepness = 6) {
  // Center around 0.5 for symmetry
  const centered = (x - 0.5) * steepness;
  return 1 / (1 + Math.exp(-centered));
}

/**
 * Calculate final salary using the smart formula
 * 
 * @param {number} worldRank - OWGR ranking
 * @param {number} avgFinish - Average recent finish
 * @param {number} strokesGained - Average strokes gained (optional)
 * @param {number} totalPlayers - Total players in field
 * @returns {number} - Final salary
 */
function calculateSmartSalary(worldRank, avgFinish, strokesGained, totalPlayers) {
  // Step 1: Calculate individual scores
  const rankScore = calculateRankScore(worldRank, totalPlayers);
  const formScore = calculateFormScore(avgFinish, strokesGained);
  
  // Step 2: Weighted Player Value Score (PVS)
  const pvs = (rankScore * RANK_WEIGHT) + (formScore * FORM_WEIGHT);
  
  // Step 3: Normalize to 0-1 range
  const normalized = pvs / 100;
  
  // Step 4: Apply sigmoid for S-curve distribution
  const sigmoidValue = sigmoid(normalized);
  
  // Step 5: Map to salary range (relative value)
  const relativeValue = sigmoidValue * SALARY_RANGE;
  
  // Step 6: Add base price
  const salary = MIN_SALARY + relativeValue;
  
  // Step 7: Apply floor and ceiling
  const clamped = Math.max(MIN_SALARY, Math.min(MAX_SALARY, salary));
  
  // Step 8: Round to nearest 100
  return Math.round(clamped / 100) * 100;
}

/**
 * Ensure field has proper distribution even with small fields
 * Prevents "all stars" scenario
 */
function adjustForFieldSize(salaries, totalPlayers) {
  if (totalPlayers >= 50) return salaries; // Large field, no adjustment needed
  
  // For small fields, enforce more spread
  const scaleFactor = Math.max(0.7, totalPlayers / 50);
  
  return salaries.map(s => {
    const distanceFromAvg = s - AVERAGE_SALARY;
    const scaled = AVERAGE_SALARY + (distanceFromAvg * scaleFactor);
    return Math.round(Math.max(MIN_SALARY, Math.min(MAX_SALARY, scaled)) / 100) * 100;
  });
}

/**
 * Main calculation function
 */
async function calculateClubhouseSalaries(eventId = null) {
  console.log('\n🏆 CLUBHOUSE SMART SALARY CALCULATOR\n');
  console.log('📊 Configuration:');
  console.log(`   Budget: £${(TOTAL_BUDGET / 100).toFixed(2)}`);
  console.log(`   Team Size: ${TEAM_SIZE} players`);
  console.log(`   Average: £${(AVERAGE_SALARY / 100).toFixed(2)}`);
  console.log(`   Range: £${(MIN_SALARY / 100).toFixed(2)} - £${(MAX_SALARY / 100).toFixed(2)}`);
  console.log(`   Weights: ${RANK_WEIGHT * 100}% Rank, ${FORM_WEIGHT * 100}% Form\n`);
  
  // Get golfers (with optional event filter)
  let query = supabase
    .from('golfers')
    .select('id, full_name, world_rank, form_rating')
    .not('world_rank', 'is', null)
    .order('world_rank', { ascending: true });
  
  const { data: golfers, error } = await query;
  
  if (error) {
    console.error('❌ Failed to fetch golfers:', error.message);
    return;
  }
  
  if (!golfers || golfers.length === 0) {
    console.error('❌ No golfers found with rankings');
    return;
  }
  
  const totalPlayers = golfers.length;
  console.log(`✅ Found ${totalPlayers} golfers with rankings\n`);
  
  // Calculate salaries
  console.log('🧮 Calculating salaries...\n');
  const calculations = golfers.map(g => {
    // For now, use form_rating as proxy for recent form
    // TODO: Connect to DataGolf strokes gained API
    const avgFinish = g.form_rating ? (50 - g.form_rating * 5) : 25; // Estimate
    const salary = calculateSmartSalary(g.world_rank, avgFinish, null, totalPlayers);
    
    return {
      id: g.id,
      name: g.full_name,
      rank: g.world_rank,
      form: g.form_rating,
      salary: salary,
    };
  });
  
  // Apply field size adjustment if needed
  const adjustedSalaries = adjustForFieldSize(
    calculations.map(c => c.salary),
    totalPlayers
  );
  
  calculations.forEach((c, i) => {
    c.salary = adjustedSalaries[i];
  });
  
  // Show distribution
  console.log('📈 SALARY DISTRIBUTION:\n');
  
  const elite = calculations.filter(c => c.salary >= 11500);
  const mid = calculations.filter(c => c.salary >= 9000 && c.salary < 11500);
  const value = calculations.filter(c => c.salary < 9000);
  
  console.log(`Elite (≥£115): ${elite.length} players`);
  console.log(`Mid (£90-£115): ${mid.length} players`);
  console.log(`Value (<£90): ${value.length} players\n`);
  
  // Show top 10 and bottom 10
  console.log('🌟 TOP 10 HIGHEST SALARIES:');
  calculations.slice(0, 10).forEach((c, i) => {
    console.log(`${i + 1}. ${c.name.padEnd(30)} Rank #${String(c.rank).padEnd(4)} → £${(c.salary / 100).toFixed(2)}`);
  });
  
  console.log('\n💰 TOP 10 VALUE PICKS:');
  calculations.slice(-10).reverse().forEach((c, i) => {
    console.log(`${i + 1}. ${c.name.padEnd(30)} Rank #${String(c.rank).padEnd(4)} → £${(c.salary / 100).toFixed(2)}`);
  });
  
  // Stats
  const salaries = calculations.map(c => c.salary);
  const avg = salaries.reduce((a, b) => a + b, 0) / salaries.length;
  const min = Math.min(...salaries);
  const max = Math.max(...salaries);
  
  console.log('\n📊 STATISTICS:');
  console.log(`   Average: £${(avg / 100).toFixed(2)}`);
  console.log(`   Min: £${(min / 100).toFixed(2)}`);
  console.log(`   Max: £${(max / 100).toFixed(2)}`);
  console.log(`   Cheapest 6: £${(salaries.slice(-6).reduce((a, b) => a + b, 0) / 100).toFixed(2)}`);
  
  // Update database (optional)
  console.log('\n💾 Apply these salaries to database? (y/n)');
  process.stdin.once('data', async (data) => {
    const answer = data.toString().trim().toLowerCase();
    if (answer === 'y' || answer === 'yes') {
      console.log('\n🔄 Updating database...');
      
      for (const calc of calculations) {
        const { error } = await supabase
          .from('golfers')
          .update({ 
            salary_pennies: calc.salary
          })
          .eq('id', calc.id);
        
        if (error) {
          console.error(`❌ Failed to update ${calc.name}:`, error.message);
        }
      }
      
      console.log('✅ Database updated!');
    } else {
      console.log('❌ Cancelled - no changes made');
    }
    
    process.exit(0);
  });
}

// Run
const eventId = process.argv[2]; // Optional event ID filter
calculateClubhouseSalaries(eventId);
