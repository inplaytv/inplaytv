require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTemplates() {
  console.log('🔍 Checking email templates...\n');

  const { data: templates, error } = await supabase
    .from('email_templates')
    .select('id, name, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching templates:', error.message);
    return;
  }

  if (!templates || templates.length === 0) {
    console.log('❌ No email templates found in database!');
    console.log('\n📝 Run this to create templates:');
    console.log('   scripts/fix-waitlist-email-templates.sql');
    return;
  }

  console.log(`✅ Found ${templates.length} email template(s):\n`);
  
  templates.forEach(t => {
    console.log(`  ${t.is_active ? '✅' : '❌'} ${t.name}`);
    console.log(`     ID: ${t.id}`);
    console.log(`     Created: ${new Date(t.created_at).toLocaleString()}\n`);
  });

  // Check for required templates
  const requiredTemplates = ['Coming Soon Waitlist', 'Launch Notification'];
  const missingTemplates = requiredTemplates.filter(
    req => !templates.find(t => t.name === req && t.is_active)
  );

  if (missingTemplates.length > 0) {
    console.log('\n⚠️  Missing required templates:');
    missingTemplates.forEach(t => console.log(`   - ${t}`));
    console.log('\n📝 Run this SQL to create missing templates:');
    console.log('   scripts/fix-waitlist-email-templates.sql');
  } else {
    console.log('✅ All required templates exist and are active!');
  }
}

checkTemplates().catch(console.error);
