# ============================================================================
# Run Tournament Scoring System Database Migration
# ============================================================================
# This script helps you run the database migration for the scoring system
# ============================================================================

Write-Host "Tournament Scoring System - Database Migration" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (!(Test-Path "apps/admin/.env.local")) {
    Write-Host "Error: apps/admin/.env.local not found!" -ForegroundColor Red
    Write-Host "   Please create .env.local with your Supabase credentials" -ForegroundColor Yellow
    exit 1
}

# Read Supabase URL from .env.local
$envContent = Get-Content "apps/admin/.env.local" -Raw
$supabaseUrl = ($envContent | Select-String -Pattern "NEXT_PUBLIC_SUPABASE_URL=(.+)" -AllMatches).Matches.Groups[1].Value.Trim()
$serviceRoleKey = ($envContent | Select-String -Pattern "SUPABASE_SERVICE_ROLE_KEY=(.+)" -AllMatches).Matches.Groups[1].Value.Trim()

if (!$supabaseUrl -or !$serviceRoleKey) {
    Write-Host "Error: Could not find Supabase credentials in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "Found Supabase configuration" -ForegroundColor Green
Write-Host "   URL: $supabaseUrl" -ForegroundColor Gray
Write-Host ""

# Extract project ID from URL
$projectId = ($supabaseUrl -replace 'https://|.supabase.co', '')

Write-Host "To run the migration:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: $supabaseUrl/project/$projectId/sql/new" -ForegroundColor White
Write-Host ""
Write-Host "2. Copy the SQL from: scripts/create-tournament-round-scores-table.sql" -ForegroundColor White
Write-Host ""
Write-Host "3. Paste into the SQL Editor" -ForegroundColor White
Write-Host ""
Write-Host "4. Click 'Run' button" -ForegroundColor White
Write-Host ""
Write-Host "5. Verify you see: 'Migration completed successfully!'" -ForegroundColor White
Write-Host ""

$openBrowser = Read-Host "Open Supabase SQL Editor in browser? (y/n)"

if ($openBrowser -eq "y") {
    Start-Process "$supabaseUrl/project/$projectId/sql/new"
    Write-Host ""
    Write-Host "Opening browser..." -ForegroundColor Green
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Next Steps After Migration:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Verify tables created:" -ForegroundColor White
Write-Host "   - tournament_round_scores" -ForegroundColor Gray
Write-Host "   - tournament_score_audit_log" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test the sync endpoint:" -ForegroundColor White
Write-Host "   pnpm --filter admin dev" -ForegroundColor Gray
Write-Host "   curl -X POST http://localhost:3002/api/admin/tournaments/[ID]/sync-scores" -ForegroundColor Gray
Write-Host "     -H 'Authorization: Bearer YOUR_CRON_SECRET'" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Read the docs:" -ForegroundColor White
Write-Host "   docs/SCORING-SYSTEM-PHASE-1-README.md" -ForegroundColor Gray
Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
