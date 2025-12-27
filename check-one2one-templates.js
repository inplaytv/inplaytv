require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('Checking ONE 2 ONE competitions...\n');

  // Get all one2one competitions
  const { data: comps, error } = await supabase
    .from('tournament_competitions')
    .select('id, competition_format, template_id, instance_number, status, tournament_id')
    .eq('competition_format', 'one2one')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  console.log(`Found ${comps?.length || 0} ONE 2 ONE competitions:\n`);

  for (const comp of comps || []) {
    console.log(`Competition ID: ${comp.id}`);
    console.log(`  Instance #: ${comp.instance_number}`);
    console.log(`  Status: ${comp.status}`);
    console.log(`  Template ID: ${comp.template_id || '❌ NULL'}`);
    console.log(`  Tournament ID: ${comp.tournament_id}`);

    // Check if template exists
    if (comp.template_id) {
      const { data: template, error: tErr } = await supabase
        .from('competition_templates')
        .select('*')
        .eq('id', comp.template_id)
        .single();

      if (tErr) {
        console.log(`  ❌ Template query error: ${tErr.message}`);
      } else if (!template) {
        console.log(`  ❌ Template NOT FOUND in database`);
      } else {
        console.log(`  ✅ Template exists: ${template.name}`);
      }
    }
    console.log('');
  }

  // Check templates table
  console.log('\n--- Available Templates ---');
  const { data: templates } = await supabase
    .from('competition_templates')
    .select('*')
    .order('name');

  if (templates) {
    templates.forEach(t => {
      console.log(`- ${t.name} (${t.short_name}): ID=${t.id}, Rounds=${JSON.stringify(t.rounds_covered)}`);
    });
  }

})().catch(console.error);
