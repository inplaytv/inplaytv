const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/golf/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addGolfersToFinalStrike() {
  console.log('🏌️ Adding RSM Classic golfers to Final Strike competition...\n');

  // 1. Get the Final Strike competition ID
  const { data: competition, error: compError } = await supabase
    .from('tournament_competitions')
    .select(`
      id, 
      tournament_id,
      competition_types!inner (
        name,
        slug
      )
    `)
    .eq('competition_types.slug', 'final-strike')
    .single();

  if (compError || !competition) {
    console.error('❌ Could not find Final Strike competition:', compError);
    process.exit(1);
  }

  console.log(`✅ Found competition: ${competition.competition_types.name} (${competition.id})`);

  // 2. Get all RSM Classic golfers from tournament_golfers
  const { data: tournamentGolfers, error: tgError } = await supabase
    .from('tournament_golfers')
    .select(`
      golfer_id,
      total_score,
      position,
      golfers (
        id,
        name,
        country
      )
    `)
    .eq('tournament_id', competition.tournament_id)
    .order('total_score', { ascending: true });

  if (tgError) {
    console.error('❌ Error fetching tournament golfers:', tgError);
    process.exit(1);
  }

  console.log(`📊 Found ${tournamentGolfers.length} golfers in RSM Classic\n`);

  // 3. Assign salaries based on position (better players = higher salary)
  // Top tier: 10000-12000, Mid tier: 7000-9000, Lower tier: 5000-6000
  const golfersWithSalaries = tournamentGolfers.map((tg, index) => {
    let salary;
    const golfer = tg.golfers;
    
    // Top 5 players
    if (index < 5) {
      salary = 12000 - (index * 500); // 12000, 11500, 11000, 10500, 10000
    }
    // Next 10 players
    else if (index < 15) {
      salary = 9000 - ((index - 5) * 200); // 9000 down to 7200
    }
    // Remaining players
    else {
      salary = 6500 - ((index - 15) * 150); // 6500 down to 5000
    }

    return {
      competition_id: competition.id,
      golfer_id: tg.golfer_id,
      salary: Math.max(5000, salary), // Minimum 5000
      name: golfer.name,
      total_score: tg.total_score,
      position: tg.position
    };
  });

  // 4. Check which golfers already exist in competition_golfers
  const { data: existing, error: existError } = await supabase
    .from('competition_golfers')
    .select('golfer_id')
    .eq('competition_id', competition.id);

  if (existError) {
    console.error('❌ Error checking existing golfers:', existError);
    process.exit(1);
  }

  const existingIds = new Set(existing?.map(g => g.golfer_id) || []);
  const newGolfers = golfersWithSalaries.filter(g => !existingIds.has(g.golfer_id));

  console.log(`📋 ${existingIds.size} golfers already in competition`);
  console.log(`➕ Adding ${newGolfers.length} new golfers\n`);

  if (newGolfers.length === 0) {
    console.log('✅ All golfers already added to Final Strike!');
    return;
  }

  // 5. Insert new golfers
  const insertData = newGolfers.map(g => ({
    competition_id: g.competition_id,
    golfer_id: g.golfer_id,
    salary: g.salary
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('competition_golfers')
    .insert(insertData)
    .select();

  if (insertError) {
    console.error('❌ Error inserting golfers:', insertError);
    process.exit(1);
  }

  console.log('✅ Successfully added golfers to Final Strike!\n');
  console.log('📊 Summary by salary tier:\n');

  // Show summary grouped by salary range
  const top5 = newGolfers.slice(0, 5);
  const mid10 = newGolfers.slice(5, 15);
  const lower = newGolfers.slice(15);

  if (top5.length > 0) {
    console.log('💎 Top Tier ($10,000 - $12,000):');
    top5.forEach(g => {
      console.log(`   ${g.name.padEnd(25)} - $${g.salary.toLocaleString()} (${g.position}, ${g.total_score})`);
    });
    console.log('');
  }

  if (mid10.length > 0) {
    console.log('⭐ Mid Tier ($7,000 - $9,000):');
    mid10.forEach(g => {
      console.log(`   ${g.name.padEnd(25)} - $${g.salary.toLocaleString()} (${g.position}, ${g.total_score})`);
    });
    console.log('');
  }

  if (lower.length > 0) {
    console.log('🏌️ Value Tier ($5,000 - $6,500):');
    lower.forEach(g => {
      console.log(`   ${g.name.padEnd(25)} - $${g.salary.toLocaleString()} (${g.position}, ${g.total_score})`);
    });
    console.log('');
  }

  console.log(`\n🎯 Total: ${inserted.length} golfers added to Final Strike competition`);
  console.log('✅ Ready for team building!');
}

addGolfersToFinalStrike().catch(console.error);
