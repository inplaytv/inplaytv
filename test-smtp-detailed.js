require('dotenv').config({ path: './apps/admin/.env.local' });
const nodemailer = require('nodemailer');

console.log('\n=== SMTP CONFIGURATION DIAGNOSTIC ===\n');

// Show configuration (hiding password)
console.log('📧 Configuration from .env.local:');
console.log('  SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
console.log('  SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
console.log('  SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
console.log('  SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '***' + process.env.SMTP_PASSWORD.slice(-4) : 'NOT SET');
console.log('  SMTP_SECURE:', process.env.SMTP_SECURE || 'NOT SET');

console.log('\n📊 Attempting connection with these settings...\n');

// Test 1: Port 465 with SSL (current config)
async function testPort465SSL() {
  console.log('🔍 TEST 1: Port 465 with SSL (secure: true)');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.inplay.tv',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    debug: true, // Enable debug output
    logger: true, // Enable logging
  });

  try {
    await transporter.verify();
    console.log('✅ SUCCESS: Connection verified!\n');
    return true;
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    console.log('   Error Code:', error.code);
    console.log('   Command:', error.command);
    console.log('');
    return false;
  }
}

// Test 2: Port 587 with STARTTLS
async function testPort587TLS() {
  console.log('🔍 TEST 2: Port 587 with STARTTLS (secure: false)');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.inplay.tv',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    debug: true,
    logger: true,
  });

  try {
    await transporter.verify();
    console.log('✅ SUCCESS: Connection verified!\n');
    return true;
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    console.log('   Error Code:', error.code);
    console.log('   Command:', error.command);
    console.log('');
    return false;
  }
}

// Test 3: Port 25 (basic SMTP)
async function testPort25() {
  console.log('🔍 TEST 3: Port 25 (standard SMTP)');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.inplay.tv',
    port: 25,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    debug: true,
    logger: true,
  });

  try {
    await transporter.verify();
    console.log('✅ SUCCESS: Connection verified!\n');
    return true;
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    console.log('   Error Code:', error.code);
    console.log('');
    return false;
  }
}

// Test 4: Try without auth to see if server responds
async function testNoAuth() {
  console.log('🔍 TEST 4: Connection without authentication (server response test)');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.inplay.tv',
    port: 465,
    secure: true,
    auth: false,
    debug: true,
    logger: true,
  });

  try {
    await transporter.verify();
    console.log('✅ Server responded (but auth would fail for sending)\n');
    return true;
  } catch (error) {
    console.log('❌ Server connection failed:', error.message);
    console.log('   Error Code:', error.code);
    console.log('');
    return false;
  }
}

// Run all tests
(async () => {
  console.log('═══════════════════════════════════════════════════\n');
  
  const test1 = await testPort465SSL();
  if (test1) {
    console.log('🎉 Port 465 SSL works! This is the recommended configuration.');
    process.exit(0);
  }
  
  const test2 = await testPort587TLS();
  if (test2) {
    console.log('🎉 Port 587 TLS works! Update your config to use port 587.');
    process.exit(0);
  }
  
  const test3 = await testPort25();
  if (test3) {
    console.log('🎉 Port 25 works! Update your config to use port 25.');
    process.exit(0);
  }
  
  const test4 = await testNoAuth();
  
  console.log('═══════════════════════════════════════════════════');
  console.log('\n❌ ALL TESTS FAILED\n');
  console.log('📋 Possible Issues:');
  console.log('1. SMTP credentials are incorrect');
  console.log('2. Email account admin@inplay.tv doesn\'t exist in Bluehost');
  console.log('3. Bluehost requires different SMTP settings');
  console.log('4. Firewall blocking outbound SMTP ports');
  console.log('5. mail.inplay.tv DNS not pointing to Bluehost mail servers');
  console.log('\n🔧 Next Steps:');
  console.log('1. Log into Bluehost cPanel → Email Accounts');
  console.log('2. Verify admin@inplay.tv exists and password is correct');
  console.log('3. Check "Email Configuration" in cPanel for correct SMTP settings');
  console.log('4. Look for "Manual Settings" or "Mail Client Manual Settings"');
  console.log('5. Bluehost might use: mail.yourdomain.com or box####.bluehost.com');
  console.log('');
})();
