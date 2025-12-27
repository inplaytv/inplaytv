require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkViews() {
  console.log('Checking for database views that might reference tournaments...\n');

  // Query to find all views
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT table_name, view_definition 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND (
        view_definition ILIKE '%tournaments%' 
        OR view_definition ILIKE '%competition_types%'
        OR view_definition ILIKE '%rounds_covered%'
      )
      ORDER BY table_name;
    `
  });

  if (error) {
    // Try alternative query
    console.log('Trying to list all views in public schema...\n');
    const query = `
      SELECT schemaname, viewname 
      FROM pg_views 
      WHERE schemaname = 'public'
      ORDER BY viewname;
    `;
    
    console.log('Please run this SQL in Supabase SQL Editor:');
    console.log('='.repeat(60));
    console.log(query);
    console.log('='.repeat(60));
    console.log('\nThen check each view definition for references to "rounds_covered"');
    console.log('\nTo see a view definition, run:');
    console.log('SELECT pg_get_viewdef(\'view_name_here\', true);');
  } else {
    console.log('Found views:', data);
  }
}

checkViews();
