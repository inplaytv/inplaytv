const dns = require('dns').promises;

console.log('\n=== EMAIL DNS RECORDS CHECK ===\n');
console.log('Checking inplay.tv email DNS configuration...\n');

async function checkDNS() {
  const domain = 'inplay.tv';
  
  // Check MX Records
  console.log('📧 MX Records (Mail Server):');
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (mxRecords.length > 0) {
      console.log('✅ MX records found:');
      mxRecords.forEach(mx => {
        console.log(`   Priority ${mx.priority}: ${mx.exchange}`);
      });
    } else {
      console.log('❌ No MX records found');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Check SPF Record
  console.log('\n🛡️ SPF Record (Sender Policy Framework):');
  try {
    const txtRecords = await dns.resolveTxt(domain);
    const spfRecord = txtRecords.find(record => 
      record.join('').includes('v=spf1')
    );
    if (spfRecord) {
      console.log('✅ SPF record found:');
      console.log('   ', spfRecord.join(''));
    } else {
      console.log('❌ No SPF record found');
      console.log('   You need to add a TXT record:');
      console.log('   v=spf1 include:mail.inplay.tv ~all');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Check DMARC Record
  console.log('\n🔒 DMARC Record:');
  try {
    const dmarcRecords = await dns.resolveTxt('_dmarc.' + domain);
    const dmarcRecord = dmarcRecords.find(record => 
      record.join('').includes('v=DMARC1')
    );
    if (dmarcRecord) {
      console.log('✅ DMARC record found:');
      console.log('   ', dmarcRecord.join(''));
    } else {
      console.log('❌ No DMARC record found');
      console.log('   You need to add a TXT record at _dmarc.inplay.tv:');
      console.log('   v=DMARC1; p=quarantine; rua=mailto:admin@inplay.tv');
    }
  } catch (error) {
    console.log('❌ No DMARC record found');
    console.log('   You need to add a TXT record at _dmarc.inplay.tv:');
    console.log('   v=DMARC1; p=quarantine; rua=mailto:admin@inplay.tv');
  }
  
  // Check mail server resolves
  console.log('\n🌐 Mail Server DNS:');
  try {
    const addresses = await dns.resolve4('mail.inplay.tv');
    console.log('✅ mail.inplay.tv resolves to:');
    addresses.forEach(addr => console.log('   ', addr));
  } catch (error) {
    console.log('❌ mail.inplay.tv does not resolve');
    console.log('   Error:', error.message);
  }
  
  console.log('\n═══════════════════════════════════════════════════\n');
  console.log('📋 DIAGNOSIS:\n');
  console.log('If MX records exist: ✅ Domain can receive email');
  console.log('If SPF missing: ⚠️ Sent emails may go to spam');
  console.log('If DMARC missing: ⚠️ Email authentication incomplete');
  console.log('If mail.inplay.tv resolves: ✅ SMTP server is reachable\n');
  
  console.log('🔧 NEXT STEPS:\n');
  console.log('1. Log into Vercel Dashboard → inplay.tv → DNS');
  console.log('2. Check if these records exist:');
  console.log('   - TXT record: v=spf1 include:mail.inplay.tv ~all');
  console.log('   - TXT record at _dmarc: v=DMARC1; p=quarantine; rua=mailto:admin@inplay.tv');
  console.log('3. If missing, add them in Vercel DNS settings');
  console.log('4. Wait 1-24 hours for DNS propagation');
  console.log('5. Meanwhile, check Gmail spam folder for test email');
  console.log('6. Bluehost might provide DKIM keys in cPanel → Email → Authentication\n');
  
  console.log('💡 TIP: Emails can take 5-30 minutes to arrive on first send');
  console.log('    Check spam folder in Gmail while waiting for DNS to propagate\n');
}

checkDNS();
