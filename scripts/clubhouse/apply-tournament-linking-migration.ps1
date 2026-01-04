# Apply Tournament Linking Migration to Clubhouse Events
# This enables Option A: Shared sync with InPlay tournaments

Write-Host "=== Clubhouse Tournament Linking Migration ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will add 'linked_tournament_id' column to clubhouse_events table." -ForegroundColor Yellow
Write-Host "This enables linking clubhouse events to InPlay tournaments for automatic golfer sync." -ForegroundColor Yellow
Write-Host ""

$sqlFile = Join-Path $PSScriptRoot "add-linked-tournament.sql"

if (!(Test-Path $sqlFile)) {
    Write-Host "ERROR: Migration file not found: $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "Reading migration file..." -ForegroundColor Gray
$sqlContent = Get-Content $sqlFile -Raw
Write-Host ""
Write-Host "SQL to execute:" -ForegroundColor Cyan
Write-Host $sqlContent -ForegroundColor Gray
Write-Host ""

Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Copy the SQL above" -ForegroundColor White
Write-Host "2. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new" -ForegroundColor White
Write-Host "3. Paste and run the SQL" -ForegroundColor White
Write-Host "4. Verify column added: SELECT linked_tournament_id FROM clubhouse_events LIMIT 1;" -ForegroundColor White
Write-Host ""
Write-Host "SAFETY:" -ForegroundColor Green
Write-Host "- This column is NULLABLE (optional)" -ForegroundColor White
Write-Host "- Existing events will work unchanged (NULL = manual golfer group)" -ForegroundColor White
Write-Host "- No data loss, fully backward compatible" -ForegroundColor White
Write-Host ""

# Open SQL file in default editor
Write-Host "Opening SQL file in default editor..." -ForegroundColor Cyan
Start-Process $sqlFile
