# ============================================================================
# Apply £60,000 Salary Cap Migration
# ============================================================================
# This script guides you through applying the database migration

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "£60,000 Salary Cap Migration" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 What this does:" -ForegroundColor Yellow
Write-Host "  • Recalculates all golfer salaries from £100 → £5k-£15k"
Write-Host "  • Based on world_ranking (Top 10 get highest salaries)"
Write-Host "  • Updates both salary_pennies and salary columns"
Write-Host "  • Creates DraftKings-style strategic team building"
Write-Host ""

Write-Host "⚠️  IMPORTANT:" -ForegroundColor Red
Write-Host "  • This will CHANGE ALL golfer salaries in database"
Write-Host "  • Old entries will reference old salaries (pre-migration)"
Write-Host "  • Cannot be auto-reversed (backup is in temp table)"
Write-Host ""

$confirm = Read-Host "Ready to proceed? Type 'YES' to continue"

if ($confirm -ne 'YES') {
    Write-Host "❌ Migration cancelled" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🔧 Opening Supabase SQL Editor..." -ForegroundColor Green
Write-Host ""

# Get project URL from env file
$envPath = "apps/golf/.env.local"
if (Test-Path $envPath) {
    $supabaseUrl = (Get-Content $envPath | Where-Object { $_ -match '^NEXT_PUBLIC_SUPABASE_URL=' }) -replace 'NEXT_PUBLIC_SUPABASE_URL=', ''
    
    if ($supabaseUrl) {
        # Extract project ID from URL (https://[project-id].supabase.co)
        $projectId = $supabaseUrl -replace 'https://', '' -replace '\.supabase\.co.*', ''
        $sqlEditorUrl = "https://supabase.com/dashboard/project/$projectId/sql/new"
        
        Write-Host "📂 SQL file location: scripts/recalculate-golfer-salaries.sql" -ForegroundColor Cyan
        Write-Host "🌐 Opening SQL Editor: $sqlEditorUrl" -ForegroundColor Cyan
        Write-Host ""
        
        # Open SQL editor in browser
        Start-Process $sqlEditorUrl
        
        Write-Host "📋 Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Copy contents of: scripts/recalculate-golfer-salaries.sql"
        Write-Host "  2. Paste into SQL Editor (browser window that just opened)"
        Write-Host "  3. Click 'Run' button"
        Write-Host "  4. Verify results show salary distribution"
        Write-Host ""
        Write-Host "✅ Expected output:" -ForegroundColor Green
        Write-Host "   GOLFER SALARIES RECALCULATED"
        Write-Host "   Min Salary: £5,000 (500,000p)"
        Write-Host "   Max Salary: £15,000 (1,500,000p)"
        Write-Host "   Avg Salary: £9,500 (950,000p)"
        Write-Host ""
    } else {
        Write-Host "⚠️  Could not find Supabase URL in .env.local" -ForegroundColor Yellow
        Write-Host "📂 Manually open: https://supabase.com/dashboard" -ForegroundColor Cyan
        Write-Host "📂 SQL file: scripts/recalculate-golfer-salaries.sql" -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠️  Could not find apps/golf/.env.local" -ForegroundColor Yellow
    Write-Host "📂 Manually open: https://supabase.com/dashboard" -ForegroundColor Cyan
    Write-Host "📂 SQL file: scripts/recalculate-golfer-salaries.sql" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📖 Full guide: SALARY-CAP-60K-IMPLEMENTATION.md" -ForegroundColor Cyan
Write-Host ""

# Wait for user confirmation they ran the migration
Read-Host "Press Enter after running the SQL migration..."

Write-Host ""
Write-Host "🧪 Testing code changes..." -ForegroundColor Green

# Verify code files were updated
$files = @(
    "apps/golf/src/app/build-team/[competitionId]/page.tsx",
    "apps/golf/src/app/clubhouse/build-team/[eventId]/page.tsx",
    "apps/golf/src/lib/competition-rules.ts"
)

$allGood = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match "6000000") {
            Write-Host "  ✅ $file" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $file (missing 6000000)" -ForegroundColor Red
            $allGood = $false
        }
    } else {
        Write-Host "  ⚠️  $file (not found)" -ForegroundColor Yellow
    }
}

Write-Host ""

if ($allGood) {
    Write-Host "✅ All code files updated!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Ready to test! Run: pnpm dev:golf" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "✅ Success Checklist:" -ForegroundColor Yellow
    Write-Host "  □ Team builder shows £60,000 budget"
    Write-Host "  □ Golfers show salaries £5k-£15k range"
    Write-Host "  □ Can select 4-5 golfers (not all 6)"
    Write-Host "  □ Budget remaining updates correctly"
    Write-Host "  □ Salary filters work (Premium/Mid/Value)"
} else {
    Write-Host "⚠️  Some code files may need updates" -ForegroundColor Yellow
    Write-Host "📖 Check: SALARY-CAP-60K-IMPLEMENTATION.md" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
