# Start Clubhouse System
# Launches both admin and user apps

Write-Host "🏌️ Starting Clubhouse System..." -ForegroundColor Cyan
Write-Host ""

# Check if .env.local files exist
$adminEnv = "apps\clubhouse-admin\.env.local"
$userEnv = "apps\clubhouse\.env.local"

if (-not (Test-Path $adminEnv)) {
    Write-Host "❌ Missing $adminEnv" -ForegroundColor Red
    Write-Host "Copy apps\clubhouse-admin\.env.example to .env.local and add your Supabase credentials" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $userEnv)) {
    Write-Host "❌ Missing $userEnv" -ForegroundColor Red
    Write-Host "Copy apps\clubhouse\.env.example to .env.local and add your Supabase credentials" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Environment files found" -ForegroundColor Green
Write-Host ""
Write-Host "Starting servers:" -ForegroundColor Cyan
Write-Host "  📊 Admin:  http://localhost:3004" -ForegroundColor Yellow
Write-Host "  👤 User:   http://localhost:3005" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Gray
Write-Host ""

# Start both servers
$admin = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'apps\clubhouse-admin'; pnpm dev" -PassThru
$user = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'apps\clubhouse'; pnpm dev" -PassThru

# Wait for user to press Ctrl+C
try {
    Write-Host "Servers running... (Ctrl+C to stop)" -ForegroundColor Green
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host "`nStopping servers..." -ForegroundColor Yellow
    Stop-Process -Id $admin.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $user.Id -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Servers stopped" -ForegroundColor Green
}
