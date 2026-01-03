# Verify Clubhouse System Files
# Checks that all required files exist

Write-Host "Clubhouse System - File Verification" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$files = @{
    "User Pages" = @(
        "apps\golf\src\app\clubhouse\events\page.tsx",
        "apps\golf\src\app\clubhouse\events\[id]\page.tsx",
        "apps\golf\src\app\clubhouse\wallet\page.tsx",
        "apps\golf\src\app\clubhouse\build-team\[competitionId]\page.tsx",
        "apps\golf\src\app\clubhouse\build-team\[competitionId]\build-team.module.css"
    )
    "Admin Pages" = @(
        "apps\golf\src\app\clubhouse\admin\page.tsx",
        "apps\golf\src\app\clubhouse\admin\events\page.tsx",
        "apps\golf\src\app\clubhouse\admin\events\create\page.tsx",
        "apps\golf\src\app\clubhouse\admin\credits\page.tsx"
    )
    "API Routes" = @(
        "apps\golf\src\app\api\clubhouse\events\route.ts",
        "apps\golf\src\app\api\clubhouse\events\[id]\route.ts",
        "apps\golf\src\app\api\clubhouse\credits\grant\route.ts",
        "apps\golf\src\app\api\clubhouse\entries\route.ts",
        "apps\golf\src\app\api\clubhouse\users\route.ts"
    )
    "Database" = @(
        "scripts\clubhouse\01-create-schema.sql",
        "apply-clubhouse-schema.ps1"
    )
    "Documentation" = @(
        "CLUBHOUSE-BUILD-COMPLETE.md",
        "CLUBHOUSE-SYSTEM-PLAN.md",
        "SYSTEMATIC-FIX-PLAN.md"
    )
}

$allGood = $true

foreach ($category in $files.Keys) {
    Write-Host "$category" -ForegroundColor Yellow
    Write-Host ("-" * 50) -ForegroundColor DarkGray
    
    foreach ($file in $files[$category]) {
        $exists = Test-Path $file
        $status = if ($exists) { "✓" } else { "✗"; $allGood = $false }
        $color = if ($exists) { "Green" } else { "Red" }
        
        Write-Host "  $status $file" -ForegroundColor $color
    }
    
    Write-Host ""
}

if ($allGood) {
    Write-Host "SUCCESS: All files present! ✅" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run: .\apply-clubhouse-schema.ps1" -ForegroundColor White
    Write-Host "2. Apply schema in Supabase SQL Editor" -ForegroundColor White
    Write-Host "3. Start dev: pnpm dev:golf" -ForegroundColor White
    Write-Host "4. Test: http://localhost:3003/clubhouse/admin" -ForegroundColor White
} else {
    Write-Host "WARNING: Some files missing!" -ForegroundColor Red
    Write-Host "Check above for missing files." -ForegroundColor Yellow
}

Write-Host ""
