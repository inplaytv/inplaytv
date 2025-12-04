const http = require('http');

// Nedbank Full Course competition ID
const competitionId = '48d02519-7cba-4d3d-9dc7-0908e6ed626d';

http.get(`http://localhost:3001/api/competitions/${competitionId}/golfers`, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const golfers = JSON.parse(data);
      
      console.log('\n🏌️ NEDBANK GOLF CHALLENGE - Team Builder Golfers\n');
      console.log(`Total golfers: ${golfers.length}\n`);
      console.log('First 15 golfers (should be sorted by world ranking):');
      console.log('='.repeat(70));
      
      golfers.slice(0, 15).forEach((g, i) => {
        const rank = g.world_ranking ? String(g.world_ranking).padStart(4) : ' N/A';
        const name = g.full_name.padEnd(25);
        const salary = `£${g.salary.toLocaleString()}`.padStart(10);
        console.log(`${String(i + 1).padStart(2)}. ${name} | Rank: ${rank} | Salary: ${salary}`);
      });
      
      console.log('='.repeat(70));
      console.log('\nLast 5 golfers:');
      console.log('='.repeat(70));
      
      golfers.slice(-5).forEach((g, i) => {
        const rank = g.world_ranking ? String(g.world_ranking).padStart(4) : ' N/A';
        const name = g.full_name.padEnd(25);
        const salary = `£${g.salary.toLocaleString()}`.padStart(10);
        const actualIndex = golfers.length - 5 + i;
        console.log(`${String(actualIndex + 1).padStart(2)}. ${name} | Rank: ${rank} | Salary: ${salary}`);
      });
      
      console.log('='.repeat(70));
      
      // Check if salaries are in descending order
      console.log('\n💰 Salary Analysis:');
      const sortedBySalary = [...golfers].sort((a, b) => b.salary - a.salary);
      const isSortedBySalary = JSON.stringify(golfers) === JSON.stringify(sortedBySalary);
      console.log(`Sorted by salary (descending)? ${isSortedBySalary ? '✅ YES' : '❌ NO'}`);
      
      // Check if rankings are in ascending order
      const withRank = golfers.filter(g => g.world_ranking !== null);
      const sortedByRank = [...withRank].sort((a, b) => a.world_ranking - b.world_ranking);
      const isSortedByRank = JSON.stringify(withRank) === JSON.stringify(sortedByRank);
      console.log(`Sorted by ranking (ascending)? ${isSortedByRank ? '✅ YES' : '❌ NO'}`);
      
      if (!isSortedByRank) {
        console.log('\n⚠️ RANKING ORDER ISSUES DETECTED:');
        golfers.slice(0, 15).forEach((g, i) => {
          if (i > 0) {
            const prev = golfers[i - 1];
            if (g.world_ranking && prev.world_ranking && g.world_ranking < prev.world_ranking) {
              console.log(`  Position ${i}: ${g.full_name} (Rank ${g.world_ranking}) is better than ${prev.full_name} (Rank ${prev.world_ranking})`);
            }
          }
        });
      }
      
      console.log('\n');
      
    } catch (error) {
      console.error('Error parsing JSON:', error);
      console.log('Raw data:', data);
    }
  });
}).on('error', (err) => {
  console.error('Error fetching data:', err);
});
