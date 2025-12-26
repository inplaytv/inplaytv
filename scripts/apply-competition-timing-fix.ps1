Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fix Competition Timing Issue" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This will:" -ForegroundColor Yellow
Write-Host "1. Fix Final Strike competition to use correct Round 4 timing"
Write-Host "2. Create database trigger to prevent this issue in future"
Write-Host ""

$continue = Read-Host "Continue? (y/n)"
if ($continue -ne 'y') {
    Write-Host "Cancelled" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Opening Supabase SQL Editor..." -ForegroundColor Green
Write-Host ""
Write-Host "STEP 1: Copy and run this SQL:" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Get-Content "scripts\fix-final-strike-timing.sql" | Write-Host -ForegroundColor White
Write-Host ""
Write-Host "STEP 2: Then copy and run this SQL:" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "(This creates the trigger to prevent future issues)" -ForegroundColor Yellow
Write-Host ""
Get-Content "scripts\create-competition-sync-trigger.sql" | Write-Host -ForegroundColor White
Write-Host ""
Write-Host "Opening Supabase..." -ForegroundColor Green
Start-Process "https://supabase.com/dashboard/project/_/sql/new"
