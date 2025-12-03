const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'apps', 'golf', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkHeroGolferScores() {
  console.log('🔍 Checking Hero World Challenge golfer scores...\n');

  const { data: hero } = await supabase
    .from('tournaments')
    .select('id')
    .ilike('name', '%hero%')
    .single();

  if (!hero) {
    console.log('❌ Hero World Challenge not found');
    return;
  }

  const { data: golfers } = await supabase
    .from('tournament_golfers')
    .select(`
      golfer_id,
      r1_score,
      r2_score,
      r3_score,
      r4_score,
      total_score,
      position,
      golfers (
        name
      )
    `)
    .eq('tournament_id', hero.id)
    .order('golfers(name)');

  console.log(`Found ${golfers?.length} golfers in Hero World Challenge\n`);

  let golfersWithScores = 0;
  let golfersWithoutScores = 0;

  for (const g of golfers || []) {
    const hasAnyScore = g.r1_score !== null || g.r2_score !== null || g.r3_score !== null || g.r4_score !== null;
    
    if (hasAnyScore) {
      golfersWithScores++;
      console.log(`✅ ${g.golfers.name} HAS SCORES:`);
      console.log(`   R1: ${g.r1_score !== null ? g.r1_score : 'N/A'}`);
      console.log(`   R2: ${g.r2_score !== null ? g.r2_score : 'N/A'}`);
      console.log(`   R3: ${g.r3_score !== null ? g.r3_score : 'N/A'}`);
      console.log(`   R4: ${g.r4_score !== null ? g.r4_score : 'N/A'}`);
      console.log(`   Total: ${g.total_score || 'N/A'}`);
      console.log('');
    } else {
      golfersWithoutScores++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Golfers WITH scores: ${golfersWithScores}`);
  console.log(`   Golfers WITHOUT scores: ${golfersWithoutScores}`);
  
  if (golfersWithScores > 0) {
    console.log(`\n⚠️  WARNING: ${golfersWithScores} golfers have scores in the database!`);
    console.log(`   These need to be cleared if they're not real tournament results.`);
  }
}

checkHeroGolferScores().catch(console.error);
