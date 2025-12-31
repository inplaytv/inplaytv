require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkSentEmails() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('\n=== Recent Sent Emails (Last 10) ===\n');
  
  const { data: emails, error } = await supabase
    .from('email_outbox')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  if (!emails || emails.length === 0) {
    console.log('No emails found in outbox.');
    return;
  }
  
  console.log(`Found ${emails.length} recent email(s):\n`);
  
  emails.forEach((email, index) => {
    console.log(`${index + 1}. Email ID: ${email.id}`);
    console.log(`   From: ${email.sent_by_email}`);
    console.log(`   To: ${email.recipients.join(', ')}`);
    console.log(`   Subject: ${email.subject}`);
    console.log(`   Status: ${email.status}`);
    console.log(`   Sent At: ${email.sent_at}`);
    console.log(`   Delivered At: ${email.delivered_at || 'N/A'}`);
    console.log('   ---');
  });
  
  console.log('\n=== Email Address Analysis ===\n');
  const uniqueRecipients = [...new Set(emails.flatMap(e => e.recipients))];
  console.log('All recipient addresses:');
  uniqueRecipients.forEach(email => {
    const hasTyro = email.includes('gmial.com');
    console.log(`  • ${email} ${hasTyro ? '⚠️  TYPO! Should be gmail.com' : '✓'}`);
  });
  
  console.log('\n=== Sender Address Analysis ===\n');
  const uniqueSenders = [...new Set(emails.map(e => e.sent_by_email))];
  uniqueSenders.forEach(email => {
    const wrongDomain = email.includes('inplaytv.com');
    console.log(`  • ${email} ${wrongDomain ? '⚠️  Wrong domain! Should be inplay.tv' : '✓'}`);
  });
}

checkSentEmails().catch(console.error);
