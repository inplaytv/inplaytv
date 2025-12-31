Write-Host "`n=== Email Deliverability Check for inplay.tv ===`n" -ForegroundColor Cyan

# Check SPF Record
Write-Host "1. Checking SPF Record..." -ForegroundColor Yellow
try {
    $spf = Resolve-DnsName -Name inplay.tv -Type TXT -ErrorAction SilentlyContinue | Where-Object { $_.Strings -like "*spf*" }
    if ($spf) {
        Write-Host "   SPF Record Found:" -ForegroundColor Green
        $spf.Strings | ForEach-Object { Write-Host "     $_" -ForegroundColor Gray }
    } else {
        Write-Host "   NO SPF Record Found!" -ForegroundColor Red
        Write-Host "     You need to add a TXT record with:" -ForegroundColor Yellow
        Write-Host "     v=spf1 include:mail.inplay.tv ~all" -ForegroundColor Gray
    }
} catch {
    Write-Host "   Error checking SPF: $_" -ForegroundColor Red
}

# Check MX Records
Write-Host "`n2. Checking MX Records..." -ForegroundColor Yellow
try {
    $mx = Resolve-DnsName -Name inplay.tv -Type MX -ErrorAction SilentlyContinue
    if ($mx) {
        Write-Host "   MX Records Found:" -ForegroundColor Green
        $mx | ForEach-Object { 
            $priority = $_.Preference
            $exchange = $_.NameExchange
            Write-Host "     Priority ${priority}: ${exchange}" -ForegroundColor Gray 
        }
    } else {
        Write-Host "   NO MX Records Found!" -ForegroundColor Red
    }
} catch {
    Write-Host "   Error checking MX records: $_" -ForegroundColor Red
}

# Check DKIM
Write-Host "`n3. Checking DKIM Record..." -ForegroundColor Yellow
try {
    $dkim = Resolve-DnsName -Name "default._domainkey.inplay.tv" -Type TXT -ErrorAction SilentlyContinue
    if ($dkim) {
        Write-Host "   DKIM Record Found:" -ForegroundColor Green
        $dkim.Strings | ForEach-Object { Write-Host "     $_" -ForegroundColor Gray }
    } else {
        Write-Host "   NO DKIM Record Found" -ForegroundColor Red
        Write-Host "     Contact your hosting provider to set up DKIM" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   DKIM not found" -ForegroundColor Yellow
}

# Check DMARC
Write-Host "`n4. Checking DMARC Record..." -ForegroundColor Yellow
try {
    $dmarc = Resolve-DnsName -Name "_dmarc.inplay.tv" -Type TXT -ErrorAction SilentlyContinue
    if ($dmarc) {
        Write-Host "   DMARC Record Found:" -ForegroundColor Green
        $dmarc.Strings | ForEach-Object { Write-Host "     $_" -ForegroundColor Gray }
    } else {
        Write-Host "   NO DMARC Record Found!" -ForegroundColor Red
        Write-Host "     Add TXT record at _dmarc.inplay.tv:" -ForegroundColor Yellow
        Write-Host "     v=DMARC1; p=none; rua=mailto:admin@inplay.tv" -ForegroundColor Gray
    }
} catch {
    Write-Host "   Error checking DMARC: $_" -ForegroundColor Red
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Gmail requires proper email authentication to avoid spam filtering." -ForegroundColor White
Write-Host "Contact your hosting provider and ask them to:" -ForegroundColor White
Write-Host "  1. Set up SPF record for inplay.tv" -ForegroundColor Gray
Write-Host "  2. Enable DKIM signing for admin@inplay.tv" -ForegroundColor Gray
Write-Host "  3. Add DMARC policy" -ForegroundColor Gray
Write-Host "`nAlternatively, use SendGrid or Mailgun for better deliverability.`n" -ForegroundColor Yellow
