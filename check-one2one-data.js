require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOne2OneData() {
  console.log('=== CHECKING ONE 2 ONE CHALLENGE DATA ===\n');

  // Check competition_instances
  const { data: instances, error: instError } = await supabase
    .from('competition_instances')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (instError) {
    console.error('❌ Error fetching instances:', instError);
  } else {
    console.log(`📋 Competition Instances: ${instances?.length || 0}`);
    if (instances && instances.length > 0) {
      instances.forEach(inst => {
        console.log(`  - ${inst.name} (${inst.status}) - Rounds: ${inst.rounds_covered?.length || 0}`);
      });
    }
  }

  console.log('\n');

  // Check entries with instance_id
  const { data: entries, error: entryError } = await supabase
    .from('competition_entries')
    .select('*, profiles(username, display_name)')
    .not('instance_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (entryError) {
    console.error('❌ Error fetching entries:', entryError);
  } else {
    console.log(`📝 Entries with instance_id: ${entries?.length || 0}`);
    if (entries && entries.length > 0) {
      entries.forEach(entry => {
        console.log(`  - User: ${entry.profiles?.display_name || 'Unknown'} - Instance: ${entry.instance_id} - Status: ${entry.status}`);
      });
    }
  }

  console.log('\n');

  // Count total instances by status
  const { data: statusCounts, error: countError } = await supabase
    .from('competition_instances')
    .select('status');

  if (!countError && statusCounts) {
    const counts = statusCounts.reduce((acc, inst) => {
      acc[inst.status] = (acc[inst.status] || 0) + 1;
      return acc;
    }, {});
    console.log('📊 Instances by Status:');
    Object.entries(counts).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });
  }

  console.log('\n');

  // Check for orphaned entries (instance_id that doesn't exist)
  const { data: orphans, error: orphanError } = await supabase
    .rpc('check_orphaned_instance_entries');

  if (!orphanError && orphans !== null) {
    console.log(`🔍 Orphaned entries (instance_id doesn't exist): ${orphans}`);
  } else if (orphanError) {
    // Function might not exist, do manual check
    const { data: allEntries } = await supabase
      .from('competition_entries')
      .select('instance_id')
      .not('instance_id', 'is', null);
    
    if (allEntries) {
      const instanceIds = [...new Set(allEntries.map(e => e.instance_id))];
      
      for (const instId of instanceIds.slice(0, 5)) {
        const { data: instCheck } = await supabase
          .from('competition_instances')
          .select('id')
          .eq('id', instId)
          .single();
        
        if (!instCheck) {
          console.log(`⚠️ Entry has instance_id ${instId} but instance doesn't exist!`);
        }
      }
    }
  }
}

checkOne2OneData().then(() => {
  console.log('✅ Check complete');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
