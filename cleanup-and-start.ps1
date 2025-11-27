# InPlay TV - Cleanup and Start Script
# This script stops all node processes and starts fresh

Write-Host "🧹 Cleaning up node processes..." -ForegroundColor Yellow

# Stop all node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "✅ Node processes stopped" -ForegroundColor Green

# Clear .next cache folders
Write-Host "🧹 Clearing Next.js cache..." -ForegroundColor Yellow

$apps = @("golf", "admin", "web")
foreach ($app in $apps) {
    $nextPath = ".\apps\$app\.next"
    if (Test-Path $nextPath) {
        Remove-Item -Recurse -Force $nextPath -ErrorAction SilentlyContinue
        Write-Host "  ✅ Cleared $app cache" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🚀 Starting development servers..." -ForegroundColor Cyan
Write-Host ""

# Start the dev servers
pnpm run dev:golf
