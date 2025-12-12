#!/usr/bin/env pwsh

# ===================================================================
# EMERGENCY RATE LIMIT RECOVERY SCRIPT
# Clears local caches and waits for Supabase rate limit to reset
# ===================================================================

Write-Host "🚨 EMERGENCY RATE LIMIT RECOVERY" -ForegroundColor Red
Write-Host "=================================" -ForegroundColor Red
Write-Host ""

# Step 1: Kill all running dev servers
Write-Host "1️⃣  Stopping all dev servers..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "   ✓ Dev servers stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Clean all Next.js caches
Write-Host "2️⃣  Cleaning Next.js build caches..." -ForegroundColor Yellow
Remove-Item -Path "apps/admin/.next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "apps/golf/.next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "apps/web/.next" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "   ✓ Build caches cleaned" -ForegroundColor Green
Write-Host ""

# Step 3: Information
Write-Host "3️⃣  Supabase Rate Limit Info:" -ForegroundColor Yellow
Write-Host "   • Rate limits reset after 60 seconds" -ForegroundColor Cyan
Write-Host "   • Each user has separate rate limit counter" -ForegroundColor Cyan
Write-Host "   • Auth API limit: ~10 requests per second" -ForegroundColor Cyan
Write-Host ""

# Step 4: Wait countdown
Write-Host "4️⃣  Waiting for rate limit to reset..." -ForegroundColor Yellow
Write-Host "   Countdown: " -NoNewline -ForegroundColor Cyan

for ($i = 60; $i -gt 0; $i--) {
    Write-Host "$i " -NoNewline -ForegroundColor Cyan
    Start-Sleep -Seconds 1
}
Write-Host ""
Write-Host "   ✓ Rate limit window reset!" -ForegroundColor Green
Write-Host ""

# Step 5: Manual browser steps
Write-Host "5️⃣  MANUAL STEPS - Do these in your browsers:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   For ADMIN (localhost:3002):" -ForegroundColor Cyan
Write-Host "   1. Press F12 to open DevTools" -ForegroundColor White
Write-Host "   2. Go to Application tab" -ForegroundColor White
Write-Host "   3. Clear Storage > Clear site data" -ForegroundColor White
Write-Host "   4. Close and reopen browser" -ForegroundColor White
Write-Host ""
Write-Host "   For GOLF APP (localhost:3003):" -ForegroundColor Cyan
Write-Host "   1. Press F12 to open DevTools" -ForegroundColor White
Write-Host "   2. Go to Application tab" -ForegroundColor White
Write-Host "   3. Clear Storage > Clear site data" -ForegroundColor White
Write-Host "   4. Close and reopen browser" -ForegroundColor White
Write-Host ""

# Step 6: Restart
Write-Host "6️⃣  Ready to restart servers!" -ForegroundColor Yellow
Write-Host ""
Write-Host "   To start admin: " -NoNewline -ForegroundColor White
Write-Host "pnpm dev:admin" -ForegroundColor Cyan
Write-Host "   To start golf:  " -NoNewline -ForegroundColor White
Write-Host "pnpm dev:golf" -ForegroundColor Cyan
Write-Host ""

Write-Host "=================================" -ForegroundColor Green
Write-Host "✅ RECOVERY COMPLETE" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Clear browser storage (see manual steps above)" -ForegroundColor White
Write-Host "2. Close and reopen all browser windows" -ForegroundColor White
Write-Host "3. Restart dev servers" -ForegroundColor White
Write-Host "4. Try logging in again" -ForegroundColor White
Write-Host ""
