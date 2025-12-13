# Script to organize root directory files into proper folders
# This script creates organized folders and moves test/check/temp files

Write-Host "🧹 Organizing root directory files..." -ForegroundColor Cyan

# Create organized folders
$folders = @{
    "temp-tests" = "Temporary test scripts"
    "temp-checks" = "Temporary check/diagnostic scripts"
    "temp-sql" = "Temporary SQL scripts"
    "archive-docs" = "Documentation that should be archived"
}

foreach ($folder in $folders.Keys) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder | Out-Null
        Write-Host "✅ Created folder: $folder - $($folders[$folder])" -ForegroundColor Green
    }
}

# Move test files
Write-Host "`n📦 Moving test files..." -ForegroundColor Yellow
$testFiles = Get-ChildItem -Path . -Filter "test-*.js" -File
$testFilesPs1 = Get-ChildItem -Path . -Filter "test-*.ps1" -File
$allTestFiles = $testFiles + $testFilesPs1

foreach ($file in $allTestFiles) {
    Move-Item -Path $file.FullName -Destination "temp-tests\" -Force
    Write-Host "  Moved: $($file.Name)" -ForegroundColor Gray
}

# Move check files
Write-Host "`n📦 Moving check files..." -ForegroundColor Yellow
$checkFiles = Get-ChildItem -Path . -Filter "check-*.js" -File
$checkFilesPs1 = Get-ChildItem -Path . -Filter "check-*.ps1" -File
$checkFilesSql = Get-ChildItem -Path . -Filter "check-*.sql" -File
$checkFilesCheck = Get-ChildItem -Path . -Filter "CHECK-*.sql" -File
$allCheckFiles = $checkFiles + $checkFilesPs1 + $checkFilesSql + $checkFilesCheck

foreach ($file in $allCheckFiles) {
    Move-Item -Path $file.FullName -Destination "temp-checks\" -Force
    Write-Host "  Moved: $($file.Name)" -ForegroundColor Gray
}

# Move diagnostic/temporary SQL files
Write-Host "`n📦 Moving temporary SQL files..." -ForegroundColor Yellow
$tempSqlPatterns = @("diagnose-*.sql", "DELETE-*.sql", "FIND-*.sql", "INVESTIGATE-*.sql", "PREVENT-*.sql", "SIMPLE-*.sql", "COMPLETE-*.sql", "fix-*.sql", "FIX-*.sql", "clear-*.sql", "delete-*.sql", "make-*.sql")
$tempSqlFiles = @()
foreach ($pattern in $tempSqlPatterns) {
    $tempSqlFiles += Get-ChildItem -Path . -Filter $pattern -File -ErrorAction SilentlyContinue
}

foreach ($file in $tempSqlFiles) {
    Move-Item -Path $file.FullName -Destination "temp-sql\" -Force
    Write-Host "  Moved: $($file.Name)" -ForegroundColor Gray
}

# Move diagnostic JS files
Write-Host "`n📦 Moving diagnostic files..." -ForegroundColor Yellow
$diagFiles = @("diagnose-*.js", "find-*.js", "clear-*.js", "quick-*.js")
$allDiagFiles = @()
foreach ($pattern in $diagFiles) {
    $allDiagFiles += Get-ChildItem -Path . -Filter $pattern -File -ErrorAction SilentlyContinue
}

foreach ($file in $allDiagFiles) {
    Move-Item -Path $file.FullName -Destination "temp-checks\" -Force
    Write-Host "  Moved: $($file.Name)" -ForegroundColor Gray
}

Write-Host "`n✅ Root directory organization complete!" -ForegroundColor Green
Write-Host "`n📁 Organized folders:" -ForegroundColor Cyan
Write-Host "  temp-tests/  - Temporary test scripts (test-*.js, test-*.ps1)" -ForegroundColor White
Write-Host "  temp-checks/ - Diagnostic and check scripts (check-*, diagnose-*, find-*)" -ForegroundColor White
Write-Host "  temp-sql/    - Temporary SQL scripts (FIX-*, DELETE-*, etc.)" -ForegroundColor White
Write-Host "  archive-docs/ - Documentation to be archived later" -ForegroundColor White
Write-Host "`n💡 You can safely delete these folders once you've verified everything works." -ForegroundColor Yellow
