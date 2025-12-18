# InPlayTV Quick Start Script
# Run this anytime you open a new PowerShell terminal

Write-Host "`n=== InPlayTV Development Environment ===" -ForegroundColor Cyan

# Step 1: Set PATH
Write-Host "Setting up environment..." -ForegroundColor Yellow
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
$env:PATH += ";$PSScriptRoot\node_modules\.bin"

# Step 2: Verify installations  
Write-Host "`nVerifying tools..." -ForegroundColor Yellow
try {
    $nodeVersion = & node --version 2>&1
    $pnpmVersion = & pnpm --version 2>&1
    $turboVersion = & turbo --version 2>&1 | Select-String -Pattern '\d+\.\d+\.\d+' | ForEach-Object { $_.Matches[0].Value }
    
    Write-Host "  ✓ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "  ✓ pnpm: $pnpmVersion" -ForegroundColor Green
    Write-Host "  ✓ turbo: $turboVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Error: Some tools are not installed" -ForegroundColor Red
    exit 1
}

# Step 3: Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "`n⚠ Dependencies not installed!" -ForegroundColor Yellow
    Write-Host "Run: pnpm install`n" -ForegroundColor Cyan
    exit 0
}

# Ready!
Write-Host "`n✓ Environment ready!" -ForegroundColor Green
Write-Host "`nAvailable commands:" -ForegroundColor Cyan
Write-Host "  pnpm dev          - Run all apps"
Write-Host "  pnpm dev:golf     - Run golf app (port 3003)"
Write-Host "  pnpm dev:admin    - Run admin app (port 3002)"
Write-Host "  pnpm dev:web      - Run web app (port 3000)"
Write-Host "  pnpm kill:ports   - Kill stuck processes"
Write-Host ""
