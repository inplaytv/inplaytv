# Safe Dev Server Start
# Automatically fixes common issues before starting

Write-Host "🚀 Starting InPlayTV Dev Server (Safe Mode)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Quick cleanup
Write-Host "Preparing environment..." -ForegroundColor Yellow

# Kill existing processes
Get-Process | Where-Object { $_.ProcessName -like '*node*' } | Stop-Process -Force -ErrorAction SilentlyContinue

# Free ports
$ports = @(3000, 3002, 3003)
foreach ($port in $ports) {
    try {
        $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        if ($process) {
            Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
        }
    } catch {}
}

Start-Sleep -Seconds 1

Write-Host "✅ Environment ready" -ForegroundColor Green
Write-Host ""
Write-Host "Starting dev servers..." -ForegroundColor Cyan
Write-Host ""

# Start dev server
pnpm dev
