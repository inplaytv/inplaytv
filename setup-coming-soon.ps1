# Setup and Preview Coming Soon Page
# This script creates the waitlist table and starts the web server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  InPlay.TV Coming Soon Page Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is available
$supabaseCli = Get-Command supabase -ErrorAction SilentlyContinue

if ($supabaseCli) {
    Write-Host "✓ Supabase CLI found" -ForegroundColor Green
    Write-Host ""
    Write-Host "Creating waitlist table..." -ForegroundColor Yellow
    
    # Run the migration
    supabase db execute -f CREATE-WAITLIST-TABLE.sql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Waitlist table created successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠ Migration may have failed. Check Supabase console." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ Supabase CLI not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please run this SQL manually in Supabase SQL Editor:" -ForegroundColor Yellow
    Write-Host "  File: CREATE-WAITLIST-TABLE.sql" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or install Supabase CLI:" -ForegroundColor Yellow
    Write-Host "  npm install -g supabase" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Web Server..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if port 3000 is in use
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($port3000) {
    Write-Host "⚠ Port 3000 is already in use" -ForegroundColor Yellow
    Write-Host "  Killing existing process..." -ForegroundColor Yellow
    
    $proc = $port3000 | Select-Object -First 1 -ExpandProperty OwningProcess
    Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
    
    Start-Sleep -Seconds 2
    Write-Host "✓ Port cleared" -ForegroundColor Green
}

Write-Host "Starting web dev server on port 3000..." -ForegroundColor Cyan
Write-Host ""

# Start the web server
pnpm dev:web

# Note: This will run in foreground. Press Ctrl+C to stop.
