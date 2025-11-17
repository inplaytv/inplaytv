/**
 * Test script for Enhanced Salary Calculator
 * Run with: ts-node testSalaryCalculator.ts
 */

import { calculateGolferSalary, calculateAllSalaries, getExampleSalaries } from './salaryCalculator';

console.log('🏌️ Enhanced Fantasy Golf Salary Calculator Test\n');
console.log('═'.repeat(70));
console.log('Budget: £60,000 | Team Size: 6 | Salary Range: £5,000 - £12,500');
console.log('═'.repeat(70));

// Test 1: Example Salaries for Key Rankings
console.log('\n📊 Test 1: Example Salaries for Key Rankings\n');
const examples = getExampleSalaries();
console.table(
  examples.map(e => ({
    Rank: `#${e.world_ranking}`,
    'OWGR Factor': e.owgr_factor.toFixed(3),
    'Base Salary': `£${e.base_salary.toLocaleString()}`,
    'Final Salary': `£${e.calculated_salary.toLocaleString()}`,
  }))
);

// Test 2: Form Modifiers
console.log('\n⚡ Test 2: Form Modifiers (Rank #10 Golfer)\n');
const rank10Base = {
  id: 'test-1',
  full_name: 'Test Golfer',
  world_ranking: 10,
};

const formTests = [
  { form: 'excellent' as const, label: 'Excellent (Hot)' },
  { form: 'good' as const, label: 'Good (Solid)' },
  { form: 'average' as const, label: 'Average (Steady)' },
  { form: 'poor' as const, label: 'Poor (Struggling)' },
];

formTests.forEach(({ form, label }) => {
  const result = calculateGolferSalary({ ...rank10Base, form_modifier: form }, 100);
  console.log(`${label}: £${result.calculated_salary.toLocaleString()} (${result.form_modifier}x)`);
});

// Test 3: Field Size Modifiers
console.log('\n🏆 Test 3: Field Size Modifiers (Rank #10 Golfer)\n');
const fieldSizes = [30, 50, 70, 100, 120];

fieldSizes.forEach(size => {
  const result = calculateGolferSalary(rank10Base, size);
  console.log(`${size} players: £${result.calculated_salary.toLocaleString()} (${result.field_size_modifier}x)`);
});

// Test 4: Professional Rounding Examples
console.log('\n🎯 Test 4: Professional Rounding (Clean Endings)\n');
const roundingTests = [1, 3, 5, 15, 30, 50, 100, 150, 200, 250, 300];
console.table(
  roundingTests.map(rank => {
    const result = calculateGolferSalary({ id: `test-${rank}`, full_name: `Rank #${rank}`, world_ranking: rank }, 100);
    const lastDigits = result.calculated_salary % 1000;
    return {
      Rank: `#${rank}`,
      Salary: `£${result.calculated_salary.toLocaleString()}`,
      'Last 3 Digits': lastDigits.toString().padStart(3, '0'),
      'Valid Ending': ['000', '500', '600', '700', '800', '900'].includes(lastDigits.toString().padStart(3, '0')) ? '✅' : '❌',
    };
  })
);

// Test 5: Full Field Calculation with Validation
console.log('\n🏌️ Test 5: Full Field Calculation (50 Golfers)\n');
const testField = Array.from({ length: 50 }, (_, i) => ({
  id: `golfer-${i + 1}`,
  full_name: `Test Golfer ${i + 1}`,
  world_ranking: i + 1,
  form_modifier: 'average' as const,
}));

const { calculations, stats, needsScaling } = calculateAllSalaries(testField, 50);

console.log('📈 Statistics:');
console.log(`   Total Golfers: ${stats.total_golfers}`);
console.log(`   Total Budget: £${stats.total_budget.toLocaleString()}`);
console.log(`   Highest Salary: £${stats.highest_salary.toLocaleString()}`);
console.log(`   Lowest Salary: £${stats.lowest_salary.toLocaleString()}`);
console.log(`   Average Salary: £${stats.average_salary.toLocaleString()}`);
console.log(`   Total Allocated: £${stats.total_allocated.toLocaleString()}`);
console.log(`   Cheapest 6 Total: £${stats.cheapest_six_total.toLocaleString()} (${stats.cheapest_six_percentage.toFixed(1)}%)`);
console.log(`   Needs Scaling: ${needsScaling ? '⚠️ Yes' : '✅ No'}`);

console.log('\n💰 Top 10 Salaries:');
console.table(
  calculations.slice(0, 10).map(c => ({
    Rank: `#${c.world_ranking}`,
    Name: c.full_name,
    'OWGR Factor': c.owgr_factor.toFixed(3),
    'Base Salary': `£${c.base_salary.toLocaleString()}`,
    'Final Salary': `£${c.calculated_salary.toLocaleString()}`,
  }))
);

console.log('\n💷 Cheapest 6 Golfers:');
const cheapest6 = [...calculations].sort((a, b) => a.calculated_salary - b.calculated_salary).slice(0, 6);
console.table(
  cheapest6.map(c => ({
    Rank: `#${c.world_ranking}`,
    Name: c.full_name,
    Salary: `£${c.calculated_salary.toLocaleString()}`,
  }))
);
console.log(`Total: £${cheapest6.reduce((sum, c) => sum + c.calculated_salary, 0).toLocaleString()}`);

// Test 6: Validation Constraint
console.log('\n✅ Test 6: 85% Budget Constraint Validation\n');
const maxAllowedForCheapest6 = 60000 * 0.85;
console.log(`Max allowed for cheapest 6: £${maxAllowedForCheapest6.toLocaleString()}`);
console.log(`Actual cheapest 6 total: £${stats.cheapest_six_total.toLocaleString()}`);
console.log(`Within constraint: ${stats.cheapest_six_total <= maxAllowedForCheapest6 ? '✅ Yes' : '❌ No'}`);

console.log('\n' + '═'.repeat(70));
console.log('✨ All tests completed!');
console.log('═'.repeat(70) + '\n');
