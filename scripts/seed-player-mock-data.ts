/**
 * Mock Data Generator for Player Performance Deep Dive
 * 
 * Generates realistic historical round data for testing the Player Deep Dive feature
 * without requiring DataGolf Scratch PLUS upgrade
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from golf app
config({ path: resolve(__dirname, '../apps/golf/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface MockPlayerRound {
  golfer_id: string;
  tournament_id: string;
  round_number: number;
  event_date: string;
  score: number;
  to_par: number;
  course_par: number;
  sg_total: number;
  sg_ott: number;
  sg_app: number;
  sg_arg: number;
  sg_putt: number;
  sg_t2g: number;
  driving_dist: number;
  driving_acc: number;
  gir: number;
  scrambling: number;
  birdies: number;
  bogies: number;
  pars: number;
  eagles_or_better: number;
  doubles_or_worse: number;
}

// Helper to generate realistic SG values based on player skill level
function generateSGValues(skillLevel: 'elite' | 'good' | 'average' | 'struggling'): {
  sg_total: number;
  sg_ott: number;
  sg_app: number;
  sg_arg: number;
  sg_putt: number;
} {
  const baseValues = {
    elite: { total: 2.5, ott: 0.6, app: 0.9, arg: 0.5, putt: 0.5 },
    good: { total: 1.2, ott: 0.3, app: 0.4, arg: 0.3, putt: 0.2 },
    average: { total: 0.0, ott: 0.0, app: 0.0, arg: 0.0, putt: 0.0 },
    struggling: { total: -1.5, ott: -0.4, app: -0.5, arg: -0.3, putt: -0.3 },
  };

  const base = baseValues[skillLevel];
  const variance = 0.8; // Random variance to make data realistic

  return {
    sg_total: +(base.total + (Math.random() - 0.5) * variance * 2).toFixed(3),
    sg_ott: +(base.ott + (Math.random() - 0.5) * variance * 0.5).toFixed(3),
    sg_app: +(base.app + (Math.random() - 0.5) * variance * 0.6).toFixed(3),
    sg_arg: +(base.arg + (Math.random() - 0.5) * variance * 0.4).toFixed(3),
    sg_putt: +(base.putt + (Math.random() - 0.5) * variance * 0.5).toFixed(3),
  };
}

function generateRoundStats(sgValues: any, par: number = 72): {
  score: number;
  birdies: number;
  bogies: number;
  pars: number;
  eagles_or_better: number;
  doubles_or_worse: number;
} {
  // Estimate score from SG total (roughly -4 strokes per +1 SG)
  const estimatedScore = par - Math.round(sgValues.sg_total * 3.5);
  const score = Math.max(65, Math.min(80, estimatedScore + Math.floor(Math.random() * 3 - 1)));
  const to_par = score - par;

  // Generate realistic scoring distribution
  const eagles_or_better = to_par < -8 ? Math.floor(Math.random() * 2) + 1 : Math.floor(Math.random() * 2);
  const birdies = Math.max(1, Math.min(9, Math.floor((par - score + eagles_or_better * 2) / 1) + eagles_or_better));
  const bogies = Math.max(0, Math.min(6, to_par > 0 ? Math.floor(to_par * 0.7) + Math.floor(Math.random() * 2) : Math.floor(Math.random() * 3)));
  const doubles_or_worse = to_par > 3 ? Math.floor(Math.random() * 2) : 0;
  const pars = 18 - birdies - bogies - eagles_or_better - doubles_or_worse;

  return {
    score,
    birdies,
    bogies,
    pars,
    eagles_or_better,
    doubles_or_worse,
  };
}

async function generateMockDataForPlayer(
  playerId: string,
  playerName: string,
  numRounds: number = 40,
  skillLevel: 'elite' | 'good' | 'average' | 'struggling' = 'good',
  tournaments: any[]
) {
  console.log(`Generating ${numRounds} rounds for ${playerName} (${skillLevel})...`);

  const rounds: MockPlayerRound[] = [];
  const startDate = new Date('2024-01-15');
  let currentDate = new Date(startDate);

  // Simulate form trends (hot/cold streaks)
  let formTrend = 0; // -1 = cold, 0 = neutral, 1 = hot
  let trendDuration = 0;

  for (let i = 0; i < numRounds; i++) {
    // Update form trend occasionally
    if (trendDuration === 0) {
      const rand = Math.random();
      formTrend = rand < 0.3 ? -1 : rand < 0.7 ? 0 : 1;
      trendDuration = Math.floor(Math.random() * 8) + 4; // 4-12 rounds
    }
    trendDuration--;

    // Adjust skill level based on form
    let adjustedSkillLevel = skillLevel;
    if (formTrend === 1 && skillLevel === 'good') adjustedSkillLevel = 'elite';
    if (formTrend === 1 && skillLevel === 'average') adjustedSkillLevel = 'good';
    if (formTrend === -1 && skillLevel === 'good') adjustedSkillLevel = 'average';
    if (formTrend === -1 && skillLevel === 'elite') adjustedSkillLevel = 'good';

    const sgValues = generateSGValues(adjustedSkillLevel);
    const tournament = tournaments[i % tournaments.length];
    const roundNumber = (i % 4) + 1;
    const roundStats = generateRoundStats(sgValues, tournament.par || 72);

    // Advance date every 4 rounds (tournament)
    if (roundNumber === 1 && i > 0) {
      currentDate = new Date(currentDate.getTime() + (7 + Math.floor(Math.random() * 14)) * 24 * 60 * 60 * 1000);
    }

    rounds.push({
      golfer_id: playerId,
      tournament_id: tournament.id,
      round_number: roundNumber,
      event_date: currentDate.toISOString().split('T')[0],
      score: roundStats.score,
      to_par: roundStats.score - (tournament.par || 72),
      course_par: tournament.par || 72,
      sg_total: sgValues.sg_total,
      sg_ott: sgValues.sg_ott,
      sg_app: sgValues.sg_app,
      sg_arg: sgValues.sg_arg,
      sg_putt: sgValues.sg_putt,
      sg_t2g: +(sgValues.sg_ott + sgValues.sg_app + sgValues.sg_arg).toFixed(3),
      driving_dist: +(290 + Math.random() * 30).toFixed(1),
      driving_acc: +(55 + Math.random() * 20).toFixed(1),
      gir: +(60 + Math.random() * 20).toFixed(1),
      scrambling: +(50 + Math.random() * 30).toFixed(1),
      birdies: roundStats.birdies,
      bogies: roundStats.bogies,
      pars: roundStats.pars,
      eagles_or_better: roundStats.eagles_or_better,
      doubles_or_worse: roundStats.doubles_or_worse,
    });
  }

  return rounds;
}

async function seedDatabase() {
  console.log('🌱 Starting mock data seeding...\n');

  // Get some real tournaments from database
  const { data: tournaments, error: tournamentsError } = await supabase
    .from('tournaments')
    .select('id, name')
    .limit(10);

  if (tournamentsError || !tournaments || tournaments.length === 0) {
    console.error('❌ Error fetching tournaments:', tournamentsError);
    console.log('Creating mock tournament IDs...');
    // Generate UUIDs for mock tournaments
    const mockTournaments = [
      { name: 'The Masters', par: 72, id: crypto.randomUUID() },
      { name: 'PGA Championship', par: 71, id: crypto.randomUUID() },
      { name: 'U.S. Open', par: 70, id: crypto.randomUUID() },
      { name: 'The Open Championship', par: 72, id: crypto.randomUUID() },
      { name: 'Players Championship', par: 72, id: crypto.randomUUID() },
      { name: 'Genesis Invitational', par: 71, id: crypto.randomUUID() },
      { name: 'Arnold Palmer Invitational', par: 72, id: crypto.randomUUID() },
      { name: 'Memorial Tournament', par: 72, id: crypto.randomUUID() },
      { name: 'BMW Championship', par: 72, id: crypto.randomUUID() },
      { name: 'Tour Championship', par: 70, id: crypto.randomUUID() },
    ];
    
    // Get some real players from the database
    const { data: players, error: playersError } = await supabase
      .from('golfers')
      .select('*')
      .limit(10);

    if (playersError || !players || players.length === 0) {
      console.error('❌ Error fetching players:', playersError);
      return;
    }

    await generateDataForPlayers(players, mockTournaments);
  } else {
    const tournamentsWithPar = tournaments.map((t, i) => ({
      ...t,
      par: [72, 71, 70, 72, 72, 71, 72, 72, 72, 70][i] || 72
    }));

    // Get some real players from the database
    const { data: players, error: playersError } = await supabase
      .from('golfers')
      .select('*')
      .limit(10);

    if (playersError || !players || players.length === 0) {
      console.error('❌ Error fetching players:', playersError);
      return;
    }

    await generateDataForPlayers(players, tournamentsWithPar);
  }

  // Refresh materialized view after all data is inserted
  console.log('📊 Refreshing player_sg_averages materialized view...');
  const { error: refreshError } = await supabase.rpc('refresh_player_sg_averages');
  if (refreshError) {
    console.error('❌ Error refreshing view:', refreshError.message);
  } else {
    console.log('✅ Materialized view refreshed!');
  }

  console.log('\n🎉 Mock data seeding complete!\n');
}

async function generateDataForPlayers(players: any[], tournaments: any[]) {
  console.log(`Found ${players.length} players to generate data for`);
  console.log('Sample player:', players[0]);
  console.log('');

  // Generate data for each player based on their ranking
  for (const player of players) {
    const rank = player.datagolf_rank || player.dg_rank || 100;
    let skillLevel: 'elite' | 'good' | 'average' | 'struggling';

    if (rank <= 10) skillLevel = 'elite';
    else if (rank <= 30) skillLevel = 'good';
    else if (rank <= 60) skillLevel = 'average';
    else skillLevel = 'struggling';

    const rounds = await generateMockDataForPlayer(
      player.id,
      player.name,
      40, // 40 rounds = ~10 tournaments
      skillLevel,
      tournaments
    );

    // Insert rounds in batches
    const batchSize = 20;
    for (let i = 0; i < rounds.length; i += batchSize) {
      const batch = rounds.slice(i, i + batchSize);
      const { error } = await supabase.from('player_round_stats').insert(batch);

      if (error) {
        console.error(`❌ Error inserting batch for ${player.name}:`, error.message);
      } else {
        console.log(`✅ Inserted rounds ${i + 1}-${Math.min(i + batchSize, rounds.length)} for ${player.name}`);
      }
    }

    // Calculate and store aggregates
    console.log(`✅ All rounds inserted for ${player.name}`);
    console.log('');
  }
}

// Remove the calculatePlayerAggregates function - not needed with materialized view

// Run the seeder
seedDatabase().catch(console.error);
