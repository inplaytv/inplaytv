const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://mtlmjypmwdqrbvxgdpcn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bG1qeXBtd2RxcmJ2eGdkcGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMTg5NzIsImV4cCI6MjA0OTg5NDk3Mn0.JzNTGzOp9H7KT-cOa2jt9G19Vh-DLkP_7Bl0Ri8z-Fw'
);

async function checkCompetitions() {
  const { data, error } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      status,
      reg_open_at,
      reg_close_at,
      start_at,
      competition_types!inner (
        name,
        slug
      ),
      tournaments!inner (
        slug,
        name
      )
    `)
    .eq('tournaments.slug', 'alfred-dunhill-championship-2024')
    .order('competition_types.name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📊 Alfred Dunhill Championship Competitions:\n');
  data.forEach(comp => {
    console.log(`\n${comp.competition_types.name} (${comp.competition_types.slug}):`);
    console.log(`  Status in DB: ${comp.status}`);
    console.log(`  Reg Open:  ${comp.reg_open_at || 'Not set'}`);
    console.log(`  Reg Close: ${comp.reg_close_at || 'Not set'}`);
    console.log(`  Start At:  ${comp.start_at || 'Not set'}`);
    
    const now = new Date();
    const regClose = comp.reg_close_at ? new Date(comp.reg_close_at) : null;
    const regOpen = comp.reg_open_at ? new Date(comp.reg_open_at) : null;
    
    console.log(`  Current Time: ${now.toISOString()}`);
    if (regClose) {
      console.log(`  Is Past Close Time? ${now >= regClose ? '✅ YES (should be closed)' : '❌ NO (should be open)'}`);
    }
    if (regOpen) {
      console.log(`  Is Past Open Time? ${now >= regOpen ? '✅ YES' : '❌ NO'}`);
    }
  });
}

checkCompetitions();
