const apiKey = 'ac7793fb5f617626ccc418008832';

async function checkDataGolfRankings() {
  console.log('=== DataGolf Rankings Endpoint ===\n');
  
  const url = `https://feeds.datagolf.com/preds/get-dg-rankings?file_format=json&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  
  console.log('Total Players in Rankings:', data.rankings?.length);
  console.log('\n--- Sample Player Data (First 3) ---');
  data.rankings.slice(0, 3).forEach(p => {
    console.log(JSON.stringify(p, null, 2));
  });
  
  console.log('\n--- Available Fields ---');
  console.log(Object.keys(data.rankings[0]));
  
  console.log('\n--- Sample Players with OWGR ---');
  data.rankings.slice(0, 10).forEach(p => {
    console.log(`  ${p.player_name.padEnd(25)} | OWGR: ${String(p.owgr_rank).padStart(4)} | DG Skill: ${p.dg_skill_estimate?.toFixed(2)}`);
  });
}

checkDataGolfRankings();
