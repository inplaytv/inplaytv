# Apply Clubhouse Entry Picks RLS Policies
# This script helps apply DELETE and UPDATE policies so users can edit their entries

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Clubhouse RLS Policies Application Helper   " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Read the SQL file
$sqlFile = ".\scripts\clubhouse\add-entry-picks-delete-policy.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "Error: SQL file not found: $sqlFile" -ForegroundColor Red
    exit 1
}

$sql = Get-Content $sqlFile -Raw
Write-Host "Loaded SQL from: $sqlFile" -ForegroundColor Cyan
Write-Host ""

Write-Host "To apply these policies:" -ForegroundColor Yellow
Write-Host "1. Open Supabase SQL Editor" -ForegroundColor White
Write-Host "2. Copy and paste the SQL below" -ForegroundColor White
Write-Host "3. Click Run" -ForegroundColor White
Write-Host ""
Write-Host "SQL to apply:" -ForegroundColor Cyan
Write-Host "---------------------------------------------" -ForegroundColor Gray
Write-Host $sql -ForegroundColor White
Write-Host "---------------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "This will allow users to:" -ForegroundColor Green
Write-Host "  - DELETE their own entry picks" -ForegroundColor White
Write-Host "  - UPDATE their own entry picks" -ForegroundColor White
Write-Host ""
