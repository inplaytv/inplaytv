require('dotenv').config({ path: './apps/admin/.env.local' });

const adminUrl = 'http://localhost:3002';

async function createTestTournaments() {
  console.log('🏌️ Creating 2 Test Tournaments...\n');

  try {
    // Step 1: Fetch upcoming tournaments
    console.log('1️⃣ Fetching upcoming tournaments...');
    const upcomingRes = await fetch(`${adminUrl}/api/ai/upcoming-tournaments`);
    const upcomingData = await upcomingRes.json();
    
    if (!upcomingData.success || upcomingData.tournaments.length < 2) {
      console.error('❌ Not enough upcoming tournaments available');
      return;
    }
    
    // Select first 2 tournaments
    const tournamentsToCreate = upcomingData.tournaments.slice(0, 2);
    console.log(`✅ Selected ${tournamentsToCreate.length} tournaments:`);
    tournamentsToCreate.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.name} (${t.tour} Tour)`);
    });
    
    // Step 2: Generate AI suggestions and create each tournament
    for (let i = 0; i < tournamentsToCreate.length; i++) {
      const tournament = tournamentsToCreate[i];
      console.log(`\n${i + 1}️⃣ Processing: ${tournament.name}`);
      
      // Generate AI suggestions
      console.log('   🤖 Generating AI suggestions...');
      const generateRes = await fetch(`${adminUrl}/api/ai/generate-tournament`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament }),
      });
      
      const generateData = await generateRes.json();
      
      if (!generateData.success) {
        console.error(`   ❌ Failed to generate suggestions: ${generateData.error}`);
        continue;
      }
      
      console.log(`   ✅ Generated ${generateData.generation.competitions.length} competitions`);
      
      // Create tournament with competitions
      console.log('   💾 Creating tournament...');
      const createRes = await fetch(`${adminUrl}/api/ai/create-tournament`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament: {
            name: tournament.name,
            slug: generateData.generation.slug,
            tour: tournament.tour,
            startDate: tournament.startDate,
            endDate: tournament.endDate,
            location: tournament.location,
            venue: tournament.venue,
            imageUrl: generateData.generation.imageUrl,
          },
          competitions: generateData.generation.competitions,
          golferGroup: generateData.generation.suggestedGolferGroup,
        }),
      });
      
      const createData = await createRes.json();
      
      if (!createData.success) {
        console.error(`   ❌ Failed to create tournament: ${createData.error}`);
        if (createData.details) {
          console.error(`   Details: ${createData.details}`);
        }
        continue;
      }
      
      console.log(`   ✅ Tournament created successfully!`);
      console.log(`      ID: ${createData.tournament.id}`);
      console.log(`      Slug: ${createData.tournament.slug}`);
      console.log(`      Competitions: ${createData.tournament.competitionsCreated}`);
      console.log(`      Golfers: ${createData.tournament.golfersAdded || 0}`);
    }
    
    console.log('\n✅ All tournaments created!');
    console.log('\n📋 Next steps:');
    console.log('   1. Visit http://localhost:3002/tournament-lifecycle');
    console.log('   2. Verify both tournaments appear with status "upcoming"');
    console.log('   3. Check registration dates are set (14 days before start)');
    console.log('   4. Test status transitions by updating dates');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

createTestTournaments();
