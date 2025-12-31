const dns = require('dns').promises;

console.log('\n=== CURRENT DNS STATUS CHECK ===\n');

async function verifyDNS() {
  const domain = 'inplay.tv';
  
  // Check SPF
  console.log('🔍 Checking SPF Record:');
  try {
    const txtRecords = await dns.resolveTxt(domain);
    const spfRecords = txtRecords.filter(record => 
      record.join('').includes('v=spf1')
    );
    
    if (spfRecords.length === 0) {
      console.log('❌ No SPF record found');
    } else if (spfRecords.length > 1) {
      console.log('❌ DUPLICATE SPF RECORDS STILL EXIST:');
      spfRecords.forEach((record, i) => {
        console.log(`   ${i + 1}. ${record.join('')}`);
      });
      console.log('\n⚠️  DNS hasn\'t propagated yet - wait another hour');
    } else {
      const spf = spfRecords[0].join('');
      console.log('✅ SPF Record (Single):', spf);
      
      if (spf.includes('ip4:50.87.169.236')) {
        console.log('✅ Contains Bluehost IP');
      } else {
        console.log('❌ Missing Bluehost IP (ip4:50.87.169.236)');
      }
    }
  } catch (error) {
    console.log('❌ Error checking SPF:', error.message);
  }
  
  // Check DKIM
  console.log('\n🔍 Checking DKIM Record:');
  try {
    const dkimRecords = await dns.resolveTxt('default._domainkey.' + domain);
    if (dkimRecords.length > 0) {
      const dkim = dkimRecords[0].join('');
      if (dkim.includes('v=DKIM1')) {
        console.log('✅ DKIM exists and is valid');
      } else {
        console.log('❌ DKIM record exists but is malformed');
      }
    }
  } catch (error) {
    console.log('❌ No DKIM record found');
  }
  
  // Check DMARC
  console.log('\n🔍 Checking DMARC Record:');
  try {
    const dmarcRecords = await dns.resolveTxt('_dmarc.' + domain);
    if (dmarcRecords.length > 0) {
      const dmarc = dmarcRecords[0].join('');
      console.log('✅ DMARC Record:', dmarc);
      
      if (dmarc.includes('p=none')) {
        console.log('⚠️  DMARC policy is "none" - Gmail might ignore failures');
        console.log('   Recommended: p=quarantine or p=reject');
      }
    }
  } catch (error) {
    console.log('❌ No DMARC record found');
  }
  
  // Check MX
  console.log('\n🔍 Checking MX Records:');
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (mxRecords.length > 0) {
      console.log('✅ MX Records:');
      mxRecords.forEach(mx => {
        console.log(`   Priority ${mx.priority}: ${mx.exchange}`);
      });
    }
  } catch (error) {
    console.log('❌ No MX records found');
  }
  
  console.log('\n═══════════════════════════════════════════════════\n');
  console.log('📋 DIAGNOSIS:\n');
  
  console.log('If SPF still shows duplicates:');
  console.log('  → DNS not fully propagated (wait 1-2 more hours)\n');
  
  console.log('If SPF is correct but Gmail still fails:');
  console.log('  1. Check Gmail Spam folder');
  console.log('  2. Search Gmail for: from:contact@inplay.tv');
  console.log('  3. Check Gmail Settings → Filters for auto-delete rules');
  console.log('  4. Try sending TO a different Gmail account');
  console.log('  5. Update DMARC to p=quarantine\n');
  
  console.log('If all records look correct:');
  console.log('  → Gmail might be silently rejecting due to:');
  console.log('     - IP reputation (new sender)');
  console.log('     - Content-based filtering');
  console.log('     - Recipient-specific filters\n');
}

verifyDNS();
