require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  console.log('\n=== ALL TOURNAMENTS ===\n');
  
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, slug, name, status')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (!tournaments || tournaments.length === 0) {
    console.log('No tournaments found!');
    return;
  }
  
  tournaments.forEach((t, i) => {
    console.log(`${i+1}. ${t.name}`);
    console.log(`   Slug: ${t.slug}`);
    console.log(`   Status: ${t.status}`);
    console.log('');
  });
  
  // Now check all competition statuses
  console.log('\n=== ALL COMPETITION STATUSES IN DATABASE ===\n');
  
  const { data: allComps } = await supabase
    .from('tournament_competitions')
    .select('status, competition_types(name), tournaments(name)')
    .eq('competition_format', 'inplay')
    .order('created_at', { ascending: false })
    .limit(30);
  
  if (allComps) {
    const statusCounts = {};
    allComps.forEach(c => {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    });
    
    console.log('Status value distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  "${status}": ${count} competitions`);
    });
    
    console.log('\n\nRecent competitions:');
    allComps.slice(0, 15).forEach(c => {
      console.log(`  ${c.tournaments?.name} - ${c.competition_types?.name}: "${c.status}"`);
    });
  }
  
})();
