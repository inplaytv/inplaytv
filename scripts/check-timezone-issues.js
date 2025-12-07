require('dotenv').config({ path: require('path').join(__dirname, '..', 'apps', 'admin', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Timezone offset mapping (in hours from UTC)
const TIMEZONE_OFFSETS = {
  'America/New_York': -5,  // EST (winter)
  'America/Los_Angeles': -8, // PST (winter)
  'Europe/London': 0,      // GMT (winter)
  'Australia/Sydney': 11,  // AEDT (summer)
  'Asia/Dubai': 4,
  'Africa/Johannesburg': 2
};

(async () => {
  console.log('=== CHECKING ALL TOURNAMENT TEE TIMES ===\n');
  
  const { data: tournaments } = await client
    .from('tournaments')
    .select('id, name, slug, timezone, round_1_start, round_2_start, round_3_start, round_4_start, status')
    .in('status', ['live', 'registration_open', 'registration_closed', 'upcoming'])
    .order('round_4_start');
  
  const issues = [];
  
  for (const t of tournaments) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📍 ${t.name}`);
    console.log(`   Timezone: ${t.timezone}`);
    
    // Check if round times look like they're in local time (not UTC)
    // If the timezone is Australia/Sydney (+11), the UTC times should be 11 hours EARLIER than local
    const offset = TIMEZONE_OFFSETS[t.timezone] || 0;
    
    console.log(`   UTC Offset: ${offset > 0 ? '+' : ''}${offset} hours`);
    console.log(`   Round 4 in DB: ${t.round_4_start}`);
    
    if (t.round_4_start) {
      const dbTime = new Date(t.round_4_start);
      const hour = dbTime.getUTCHours();
      
      // If it's an Australian tournament and the time is between 6-9 AM UTC,
      // it's likely stored as local time instead of UTC
      if (t.timezone === 'Australia/Sydney' && hour >= 6 && hour <= 9) {
        console.log(`   ⚠️  LIKELY WRONG - Time looks like local time, not UTC!`);
        console.log(`   📅 Local interpretation: ${dbTime.toUTCString()}`);
        
        // Calculate what it should be in UTC
        const correctUTC = new Date(dbTime.getTime() - (offset * 60 * 60 * 1000));
        console.log(`   ✅ Should be (UTC): ${correctUTC.toISOString()}`);
        
        const now = new Date();
        const hoursUntil = (correctUTC - now) / 1000 / 60 / 60;
        console.log(`   ⏰ Hours until tee: ${hoursUntil.toFixed(2)}`);
        
        issues.push({
          id: t.id,
          name: t.name,
          slug: t.slug,
          timezone: t.timezone,
          current_r4: t.round_4_start,
          correct_r4: correctUTC.toISOString(),
          hours_until: hoursUntil
        });
      } else {
        console.log(`   ✅ Looks correct (or outside suspicious range)`);
        const now = new Date();
        const hoursUntil = (dbTime - now) / 1000 / 60 / 60;
        console.log(`   ⏰ Hours until tee: ${hoursUntil.toFixed(2)}`);
      }
    }
  }
  
  if (issues.length > 0) {
    console.log(`\n${'='.repeat(60)}`);
    console.log('❌ TIMEZONE ISSUES FOUND');
    console.log(`${'='.repeat(60)}`);
    console.table(issues.map(i => ({
      Tournament: i.name.substring(0, 30),
      Current: i.current_r4,
      Correct: i.correct_r4,
      'Hours Until': i.hours_until.toFixed(2)
    })));
    
    const fs = require('fs');
    fs.writeFileSync(
      require('path').join(__dirname, 'timezone-issues.json'),
      JSON.stringify(issues, null, 2)
    );
    console.log('\n💾 Issues saved to: scripts/timezone-issues.json');
  }
})().catch(console.error);
