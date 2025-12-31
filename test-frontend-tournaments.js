const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3003,
  path: '/api/tournaments',
  method: 'GET',
  headers: {
    'Cache-Control': 'no-cache'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('=== FRONTEND TOURNAMENTS API TEST ===\n');
      console.log(`Total tournaments returned: ${json.tournaments ? json.tournaments.length : 0}\n`);
      
      if (json.tournaments && json.tournaments.length > 0) {
        json.tournaments.forEach((t, idx) => {
          console.log(`\n${idx + 1}. ${t.name}`);
          console.log(`   Slug: ${t.slug}`);
          console.log(`   Status: ${t.status}`);
          console.log(`   Competitions: ${t.competitions ? t.competitions.length : 0}`);
          
          if (t.competitions && t.competitions.length > 0) {
            t.competitions.forEach(c => {
              const typeName = c.competition_types?.name || 'Unknown';
              console.log(`      - ${typeName} (${c.status})`);
            });
          }
        });
      } else {
        console.log('❌ NO TOURNAMENTS RETURNED!');
        console.log('\nFull response:', JSON.stringify(json, null, 2));
      }
    } catch (e) {
      console.error('Error parsing response:', e.message);
      console.log('Raw data:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
