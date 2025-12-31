require('dotenv').config({ path: './apps/admin/.env.local' });
const nodemailer = require('nodemailer');

console.log('\n=== GMAIL DELIVERY DIAGNOSTIC ===\n');

async function testGmailDelivery() {
  const transporter = nodemailer.createTransport({
    host: 'mail.inplay.tv',
    port: 465,
    secure: true,
    auth: {
      user: 'contact@inplay.tv',
      pass: process.env.SMTP_PASSWORD,
    },
    debug: true, // Enable detailed logging
    logger: true,
  });

  console.log('📧 Sending test email to Gmail with full logging...\n');

  try {
    const info = await transporter.sendMail({
      from: '"InPlayTV" <contact@inplay.tv>',
      to: 'leroylive@gmail.com',
      subject: 'Test Email - ' + new Date().toISOString(),
      html: `
        <h1>Test Email</h1>
        <p>This is a test email sent at ${new Date().toLocaleString()}</p>
        <p>If you receive this, Gmail delivery is working!</p>
      `,
      text: 'This is a test email. If you receive this, Gmail delivery is working!',
    });

    console.log('\n✅ EMAIL SENT SUCCESSFULLY');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('Accepted:', info.accepted);
    console.log('Rejected:', info.rejected);
    console.log('Pending:', info.pending);
    
    console.log('\n🔍 ANALYSIS:');
    if (info.rejected && info.rejected.length > 0) {
      console.log('❌ Gmail REJECTED the email at SMTP level');
      console.log('Rejected addresses:', info.rejected);
    } else if (info.accepted && info.accepted.length > 0) {
      console.log('✅ Gmail ACCEPTED the email at SMTP level');
      console.log('Accepted addresses:', info.accepted);
      console.log('\n💡 If email not in inbox, it might be:');
      console.log('   1. In Spam folder');
      console.log('   2. In All Mail (bypassed inbox)');
      console.log('   3. Filtered by Gmail rules');
      console.log('   4. Delayed (can take 5-15 minutes)');
      console.log('\n🔎 Search Gmail for: from:contact@inplay.tv');
    }
    
  } catch (error) {
    console.log('\n❌ EMAIL SENDING FAILED');
    console.log('Error:', error.message);
    console.log('Code:', error.code);
    console.log('Command:', error.command);
    console.log('Response:', error.response);
  }
}

testGmailDelivery();
