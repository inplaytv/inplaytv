import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../apps/golf/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkPlayerData() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const playerId = 'e114ccbc-79fe-48d6-bc70-9876e37cbbee';
  
  console.log('🔍 Checking player data for ID:', playerId);
  console.log('');
  
  // Check golfers table
  console.log('1. Checking golfers table...');
  const { data: golfer, error: golferError } = await supabase
    .from('golfers')
    .select('*')
    .eq('id', playerId)
    .single();
  
  console.log('Golfer:', golfer);
  console.log('Error:', golferError);
  console.log('');
  
  // Check player_sg_averages
  console.log('2. Checking player_sg_averages...');
  const { data: sgAvg, error: sgError } = await supabase
    .from('player_sg_averages')
    .select('*')
    .eq('golfer_id', playerId)
    .single();
  
  console.log('SG Averages:', sgAvg);
  console.log('Error:', sgError);
  console.log('');
  
  // Check player_round_stats
  console.log('3. Checking player_round_stats...');
  const { data: rounds, error: roundsError } = await supabase
    .from('player_round_stats')
    .select('*')
    .eq('golfer_id', playerId)
    .order('event_date', { ascending: false })
    .limit(5);
  
  console.log(`Found ${rounds?.length || 0} rounds`);
  console.log('Error:', roundsError);
  if (rounds && rounds.length > 0) {
    console.log('Sample round:', rounds[0]);
  }
}

checkPlayerData().catch(console.error);
