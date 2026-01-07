# Fix Dev Server - Comprehensive Solution
# This script fixes common issues causing exit code 1

Write-Host "🔧 InPlayTV Dev Server Fix" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill all Node processes
Write-Host "1️⃣  Killing all Node processes..." -ForegroundColor Yellow
try {
    Get-Process | Where-Object { $_.ProcessName -like '*node*' } | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Node processes killed" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  No Node processes to kill" -ForegroundColor Gray
}

Start-Sleep -Seconds 2

# Step 2: Kill processes on specific ports
Write-Host ""
Write-Host "2️⃣  Freeing up ports 3000, 3002, 3003..." -ForegroundColor Yellow

$ports = @(3000, 3002, 3003)
foreach ($port in $ports) {
    try {
        $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        if ($process) {
            Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
            Write-Host "  ✅ Port $port freed" -ForegroundColor Green
        } else {
            Write-Host "  ℹ️  Port $port already free" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  ℹ️  Port $port already free" -ForegroundColor Gray
    }
}

Start-Sleep -Seconds 2

# Step 3: Clear Turbo cache
Write-Host ""
Write-Host "3️⃣  Clearing Turbo cache..." -ForegroundColor Yellow
if (Test-Path ".turbo") {
    Remove-Item -Path ".turbo" -Recurse -Force
    Write-Host "✅ Turbo cache cleared" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No Turbo cache to clear" -ForegroundColor Gray
}

# Step 4: Clear Next.js cache in all apps
Write-Host ""
Write-Host "4️⃣  Clearing Next.js cache..." -ForegroundColor Yellow

$nextCachePaths = @(
    "apps/web/.next",
    "apps/golf/.next",
    "apps/admin/.next"
)

foreach ($path in $nextCachePaths) {
    if (Test-Path $path) {
        Remove-Item -Path $path -Recurse -Force
        Write-Host "  ✅ Cleared $path" -ForegroundColor Green
    }
}

# Step 5: Check for TypeScript errors
Write-Host ""
Write-Host "5️⃣  Checking for TypeScript errors..." -ForegroundColor Yellow
Write-Host "  (This may take a moment...)" -ForegroundColor Gray

$tsErrors = $false
$apps = @("web", "golf", "admin")

foreach ($app in $apps) {
    $tscOutput = & pnpm --filter=$app run typecheck 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ⚠️  TypeScript errors in $app" -ForegroundColor Red
        $tsErrors = $true
    } else {
        Write-Host "  ✅ No errors in $app" -ForegroundColor Green
    }
}

if ($tsErrors) {
    Write-Host ""
    Write-Host "⚠️  TypeScript errors found. Fix these before running dev server." -ForegroundColor Red
    Write-Host "   Run: pnpm typecheck" -ForegroundColor Yellow
}

# Step 6: Verify environment files
Write-Host ""
Write-Host "6️⃣  Checking environment files..." -ForegroundColor Yellow

$envFiles = @(
    "apps/web/.env.local",
    "apps/golf/.env.local",
    "apps/admin/.env.local"
)

foreach ($envFile in $envFiles) {
    if (Test-Path $envFile) {
        Write-Host "  ✅ Found $envFile" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Missing $envFile" -ForegroundColor Red
    }
}

# Step 7: Check node_modules health
Write-Host ""
Write-Host "7️⃣  Checking node_modules..." -ForegroundColor Yellow

if (Test-Path "node_modules") {
    $nodeModulesSize = (Get-ChildItem "node_modules" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "  ℹ️  node_modules size: $([math]::Round($nodeModulesSize, 2)) MB" -ForegroundColor Gray
    Write-Host "  ✅ node_modules exists" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  node_modules missing - run: pnpm install" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🎉 Cleanup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: pnpm dev" -ForegroundColor White
Write-Host "     OR for single app: pnpm dev:golf" -ForegroundColor White
Write-Host ""
Write-Host "If problems persist:" -ForegroundColor Yellow
Write-Host "  • Run: pnpm install --force" -ForegroundColor White
Write-Host "  • Check TypeScript errors: pnpm typecheck" -ForegroundColor White
Write-Host "  • Restart your terminal/VS Code" -ForegroundColor White
Write-Host ""
