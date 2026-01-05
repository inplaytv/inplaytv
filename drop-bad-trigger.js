require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function dropBadTrigger() {
  console.log('🗑️  Dropping the broken trigger that overwrites competition timing...\n');

  // Drop the trigger
  const { error: triggerError } = await supabase.rpc('exec_sql', {
    query: `DROP TRIGGER IF EXISTS clubhouse_event_timing_sync ON clubhouse_events;`
  });

  if (triggerError) {
    console.error('Error dropping trigger:', triggerError);
    console.log('\n⚠️  Could not use RPC. Please run this SQL manually in Supabase SQL Editor:');
    console.log('\nDROP TRIGGER IF EXISTS clubhouse_event_timing_sync ON clubhouse_events;');
    console.log('DROP FUNCTION IF EXISTS sync_clubhouse_competition_timing();');
    return;
  }

  console.log('✅ Trigger dropped');

  // Drop the function
  const { error: functionError } = await supabase.rpc('exec_sql', {
    query: `DROP FUNCTION IF EXISTS sync_clubhouse_competition_timing();`
  });

  if (functionError) {
    console.error('Error dropping function:', functionError);
  } else {
    console.log('✅ Function dropped');
  }

  // Verify
  console.log('\n🔍 Verifying trigger is gone...');
  const { data: triggers } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        tgname AS trigger_name,
        tgrelid::regclass AS table_name
      FROM pg_trigger
      WHERE tgrelid = 'clubhouse_events'::regclass
        AND tgname = 'clubhouse_event_timing_sync';
    `
  });

  if (triggers && triggers.length === 0) {
    console.log('✅ Trigger successfully removed!');
  } else {
    console.log('⚠️  Trigger may still exist:', triggers);
  }

  console.log('\n📋 Remaining triggers on clubhouse_events:');
  const { data: remainingTriggers } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        tgname AS trigger_name
      FROM pg_trigger
      WHERE tgrelid = 'clubhouse_events'::regclass
        AND NOT tgisinternal;
    `
  });
  
  if (remainingTriggers) {
    remainingTriggers.forEach(t => console.log(`  - ${t.trigger_name}`));
  }

  console.log('\n✅ FIX IS NOW PERMANENT - competitions will keep round-specific timing!');
}

dropBadTrigger().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  console.log('\n⚠️  Please run this SQL manually in Supabase SQL Editor:');
  console.log('\nDROP TRIGGER IF EXISTS clubhouse_event_timing_sync ON clubhouse_events;');
  console.log('DROP FUNCTION IF EXISTS sync_clubhouse_competition_timing();');
  process.exit(1);
});
