require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function showExactState() {
  console.log('=== EXACT DATABASE STATE - NO INTERPRETATION ===\n');
  console.log('Current time:', new Date().toISOString());
  console.log('');
  
  const { data: westgate } = await s
    .from('tournament_competitions')
    .select('id, status, start_at, reg_close_at, reg_open_at, competition_types(name)')
    .eq('tournament_id', '3bf785ea-f600-467e-85d0-be711914369a')
    .order('start_at');
    
  console.log('WESTGATE & BIRCHINGTON GOLF CLUB:');
  console.log('Total competitions:', westgate?.length || 0);
  console.log('');
  
  westgate?.forEach(comp => {
    console.log(`${comp.competition_types?.name || 'Unknown'}:`);
    console.log(`  ID: ${comp.id}`);
    console.log(`  status (database field): "${comp.status}"`);
    console.log(`  start_at: ${comp.start_at}`);
    console.log(`  reg_close_at: ${comp.reg_close_at}`);
    console.log(`  reg_open_at: ${comp.reg_open_at}`);
    console.log('');
  });
  
  console.log('=== WHAT STATUS VALUES EXIST ===');
  const uniqueStatuses = [...new Set(westgate?.map(c => c.status))];
  console.log('Status values in use:', uniqueStatuses);
  console.log('');
  
  console.log('=== THE PROBLEM ===');
  console.log('We have MIXED status values:');
  console.log('  - Some use OLD values: "open", "live", "full"');
  console.log('  - Some use NEW values: "registration_open"');
  console.log('');
  console.log('The frontend code expects these STANDARDIZED values:');
  console.log('  - draft');
  console.log('  - upcoming');  
  console.log('  - registration_open (NOT "open" or "reg_open")');
  console.log('  - registration_closed');
  console.log('  - live');
  console.log('  - completed');
  console.log('  - cancelled');
}

showExactState().catch(console.error);
