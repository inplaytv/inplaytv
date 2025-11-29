# Tournament Scoring System - Database Migration Helper

Write-Host "Tournament Scoring System - Database Migration" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (!(Test-Path "apps/admin/.env.local")) {
    Write-Host "Error: apps/admin/.env.local not found!" -ForegroundColor Red
    exit 1
}

# Read Supabase URL
$envContent = Get-Content "apps/admin/.env.local" -Raw
$supabaseUrl = ($envContent | Select-String -Pattern "NEXT_PUBLIC_SUPABASE_URL=(.+)" -AllMatches).Matches.Groups[1].Value.Trim()

if (!$supabaseUrl) {
    Write-Host "Error: Could not find Supabase URL in .env.local" -ForegroundColor Red
    exit 1
}

# Extract project ID
$projectId = ($supabaseUrl -replace 'https://|.supabase.co', '')

Write-Host "Found Supabase configuration" -ForegroundColor Green
Write-Host "URL: $supabaseUrl" -ForegroundColor Gray
Write-Host ""
Write-Host "To run the migration:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Opening Supabase SQL Editor..." -ForegroundColor White
Write-Host "2. Copy contents of: scripts/create-tournament-round-scores-table.sql" -ForegroundColor White
Write-Host "3. Paste into SQL Editor" -ForegroundColor White
Write-Host "4. Click Run" -ForegroundColor White
Write-Host ""

# Open browser
Start-Process "$supabaseUrl/project/$projectId/sql/new"

Write-Host "Browser opened! Complete the steps above." -ForegroundColor Green
Write-Host ""
Write-Host "After migration:" -ForegroundColor Cyan
Write-Host "- Test sync: pnpm --filter admin dev" -ForegroundColor Gray
Write-Host "- Read docs: docs/SCORING-SYSTEM-PHASE-1-README.md" -ForegroundColor Gray
