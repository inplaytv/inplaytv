require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testNotifyLogic() {
  console.log('🧪 Testing notify logic directly...\n');

  const email = 'test@example.com';
  console.log(`Testing with email: ${email}\n`);

  try {
    // Step 1: Look for template
    console.log('1️⃣ Looking for Launch Notification template...');
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', 'Launch Notification')
      .eq('is_active', true)
      .single();

    if (templateError) {
      console.error('❌ Template error:', templateError.message);
      return;
    }

    if (!template) {
      console.error('❌ Template not found');
      return;
    }

    console.log('✅ Template found:', template.name);
    console.log('   Subject:', template.subject);
    console.log('   Content length:', template.content.length, 'characters\n');

    // Step 2: Replace variables
    console.log('2️⃣ Replacing variables...');
    let emailContent = template.content
      .replace(/%%%website_name%%%/g, 'InPlayTV')
      .replace(/%%%email%%%/g, email);

    let emailSubject = template.subject
      .replace(/%%%website_name%%%/g, 'InPlayTV');

    console.log('✅ Variables replaced\n');

    // Step 3: Store in outbox
    console.log('3️⃣ Storing in email_outbox...');
    const { data: outbox, error: outboxError } = await supabase
      .from('email_outbox')
      .insert({
        from_name: 'InPlayTV',
        from_email: 'noreply@inplaytv.com',
        to_email: email,
        subject: emailSubject,
        content: emailContent,
        template_id: template.id,
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .select()
      .single();

    if (outboxError) {
      console.error('❌ Outbox error:', outboxError.message);
      console.error('   Details:', outboxError);
      return;
    }

    console.log('✅ Stored in outbox, ID:', outbox.id, '\n');

    // Step 4: Update waitlist
    console.log('4️⃣ Updating waitlist entry...');
    const { error: waitlistError } = await supabase
      .from('waitlist')
      .update({
        notified: true,
        notified_at: new Date().toISOString()
      })
      .eq('email', email);

    if (waitlistError) {
      console.error('❌ Waitlist error:', waitlistError.message);
      // This might fail if email doesn't exist, which is OK for testing
      console.log('   (This is OK if email not in waitlist)\n');
    } else {
      console.log('✅ Waitlist updated\n');
    }

    // Step 5: Update contact
    console.log('5️⃣ Updating contact...');
    const { error: contactError } = await supabase
      .from('contacts')
      .upsert({
        email: email,
        emails_sent: 1,
        last_contact: new Date().toISOString(),
        tags: ['waitlist', 'launch-notified']
      }, {
        onConflict: 'email'
      });

    if (contactError) {
      console.error('❌ Contact error:', contactError.message);
      console.error('   Details:', contactError);
      return;
    }

    console.log('✅ Contact updated\n');

    console.log('🎉 All steps completed successfully!');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testNotifyLogic().catch(console.error);
