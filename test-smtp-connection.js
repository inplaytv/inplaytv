// Test SMTP Connection
// Run: cd apps/admin && node ../../test-smtp-connection.js

require('dotenv').config({ path: './apps/admin/.env.local' });

// Try to require nodemailer from admin app
let nodemailer;
try {
  nodemailer = require('./apps/admin/node_modules/nodemailer');
} catch {
  try {
    nodemailer = require('nodemailer');
  } catch {
    console.error('❌ nodemailer not found. Run: cd apps/admin && pnpm install');
    process.exit(1);
  }
}

console.log('🧪 Testing SMTP Connection...\n');

console.log('Configuration:');
console.log('  Host:', process.env.SMTP_HOST);
console.log('  Port:', process.env.SMTP_PORT);
console.log('  User:', process.env.SMTP_USER);
console.log('  Secure:', process.env.SMTP_SECURE);
console.log('  Password:', process.env.SMTP_PASSWORD ? '***' + process.env.SMTP_PASSWORD.slice(-4) : 'NOT SET');
console.log('');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true' || true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

console.log('Verifying SMTP connection...');

transporter.verify((error, success) => {
  if (error) {
    console.error('\n❌ SMTP connection FAILED\n');
    console.error('Error details:', error.message);
    console.error('\nPossible issues:');
    console.error('  1. Wrong SMTP host or port');
    console.error('  2. Incorrect username or password');
    console.error('  3. Firewall blocking port 465');
    console.error('  4. SMTP server not reachable');
    console.error('  5. SSL/TLS configuration mismatch');
    process.exit(1);
  } else {
    console.log('\n✅ SMTP connection SUCCESSFUL!\n');
    console.log('Your email server is ready to send emails.');
    console.log('You can now send emails from the admin panel.');
    console.log('\nTest it by:');
    console.log('  1. Go to http://localhost:3002/waitlist');
    console.log('  2. Click "Notify" next to any email');
    console.log('  3. Check the recipient\'s inbox');
    process.exit(0);
  }
});
