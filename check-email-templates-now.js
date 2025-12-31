// Check Email Templates Status
require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTemplates() {
  console.log('🔍 Checking all email templates...\n');
  
  const { data: templates, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!templates || templates.length === 0) {
    console.log('⚠️  NO TEMPLATES FOUND IN DATABASE!\n');
    console.log('The SQL script may have deleted all templates.');
    console.log('Run: scripts/restore-email-templates.sql to restore them.\n');
    return;
  }

  console.log(`✅ Found ${templates.length} template(s):\n`);
  
  templates.forEach((t, i) => {
    console.log(`${i + 1}. ${t.name}`);
    console.log(`   ID: ${t.id}`);
    console.log(`   Subject: ${t.subject}`);
    console.log(`   Category: ${t.category}`);
    console.log(`   Active: ${t.is_active}`);
    console.log(`   Created: ${new Date(t.created_at).toLocaleString()}`);
    console.log('');
  });
}

checkTemplates();
