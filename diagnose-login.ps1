# Login Diagnostic Script
Write-Host "`n=== InPlay TV Login Diagnostic ===" -ForegroundColor Cyan

# Check 1: Environment Variables
Write-Host "`n1. Checking Environment Variables..." -ForegroundColor Yellow
$apps = @("apps\web", "apps\golf", "apps\admin")
foreach ($app in $apps) {
    $envPath = "$app\.env.local"
    if (Test-Path $envPath) {
        $content = Get-Content $envPath -Raw
        $hasUrl = $content -match "NEXT_PUBLIC_SUPABASE_URL"
        $hasKey = $content -match "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        
        Write-Host "  $app`: " -NoNewline
        if ($hasUrl -and $hasKey) {
            Write-Host "✓ Configured" -ForegroundColor Green
        } else {
            Write-Host "✗ Missing variables" -ForegroundColor Red
        }
    } else {
        Write-Host "  $app`: ✗ No .env.local file" -ForegroundColor Red
    }
}

# Check 2: Running Processes
Write-Host "`n2. Checking Running Dev Servers..." -ForegroundColor Yellow
$nextProcesses = Get-Process | Where-Object { $_.ProcessName -like "*node*" -or $_.ProcessName -like "*next*" }
if ($nextProcesses) {
    Write-Host "  ✓ Found $($nextProcesses.Count) Node.js process(es) running" -ForegroundColor Green
} else {
    Write-Host "  ✗ No dev servers running" -ForegroundColor Red
}

# Check 3: Browser Cache Recommendation
Write-Host "`n3. Browser Cache and Cookies..." -ForegroundColor Yellow
Write-Host "  Recommended actions:" -ForegroundColor White
Write-Host "  - Clear browser cache (Ctrl+Shift+Delete)" 
Write-Host "  - Open DevTools (F12) → Application → Clear Storage"
Write-Host "  - Try incognito/private window"

# Check 4: Rate Limiting
Write-Host "`n4. Supabase Rate Limiting..." -ForegroundColor Yellow
Write-Host "  If you see 'rate limit' errors:" -ForegroundColor White
Write-Host "  - Wait 2-5 minutes before trying again"
Write-Host "  - Avoid repeated login attempts"
Write-Host "  - Check Supabase Dashboard → Authentication → Logs"

# Solutions
Write-Host "`n=== Recommended Solutions ===" -ForegroundColor Cyan
Write-Host "`n1. Quick Fix - Restart Dev Server:" -ForegroundColor Green
Write-Host "   cd 'C:\inplaytv - New'"
Write-Host "   # Stop current server (Ctrl+C)"
Write-Host "   pnpm dev:golf  # or dev:web for marketing site"

Write-Host "`n2. Clear Authentication State:" -ForegroundColor Green
Write-Host "   - Open browser DevTools (F12)"
Write-Host "   - Application tab → Storage → Clear site data"
Write-Host "   - Restart browser"

Write-Host "`n3. Check Supabase Status:" -ForegroundColor Green
Write-Host "   - Visit: https://status.supabase.com"
Write-Host "   - Check your project: https://supabase.com/dashboard/project/qemosikbhrnstcormhuz"

Write-Host "`n4. Test Connection:" -ForegroundColor Green
Write-Host "   node test-supabase-connection.js"

Write-Host "`n=== Common Error Messages ===" -ForegroundColor Cyan
Write-Host "  'Invalid login credentials' → Wrong email/password" -ForegroundColor Yellow
Write-Host "  'Email not confirmed' → Check email for verification link" -ForegroundColor Yellow
Write-Host "  'Rate limit reached' → Wait 2-5 minutes" -ForegroundColor Yellow
Write-Host "  'Failed to fetch' → Check internet/Supabase status" -ForegroundColor Yellow

Write-Host "`n"
