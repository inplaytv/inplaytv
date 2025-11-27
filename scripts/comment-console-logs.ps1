# ===================================================================
# Comment out console.log statements (keeps console.error)
# ===================================================================

Write-Host "`n🔇 Commenting Out Console Logs" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$apps = @("apps/golf/src", "apps/admin/src", "apps/web/src")
$totalFiles = 0
$modifiedFiles = 0

foreach ($app in $apps) {
    $appPath = Join-Path $PSScriptRoot "..\$app"
    
    if (Test-Path $appPath) {
        Write-Host "`n📁 Processing: $app" -ForegroundColor Yellow
        
        $files = Get-ChildItem -Path $appPath -Recurse -Include *.ts,*.tsx -File
        
        foreach ($file in $files) {
            $totalFiles++
            $content = Get-Content $file.FullName -Raw
            $modified = $false
            
            # Comment out console.log (but NOT console.error)
            if ($content -match '(?<!//\s*)console\.log') {
                $content = $content -replace '(\s*)console\.log', '$1// console.log'
                $modified = $true
            }
            
            # Comment out console.warn
            if ($content -match '(?<!//\s*)console\.warn') {
                $content = $content -replace '(\s*)console\.warn', '$1// console.warn'
                $modified = $true
            }
            
            if ($modified) {
                Set-Content $file.FullName -Value $content
                $modifiedFiles++
                $relativePath = $file.FullName.Replace($PSScriptRoot, "").Replace("\..\", "")
                Write-Host "  ✓ $relativePath" -ForegroundColor Green
            }
        }
    }
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "✅ Complete!" -ForegroundColor Green
Write-Host "   Files scanned: $totalFiles" -ForegroundColor White
Write-Host "   Files modified: $modifiedFiles" -ForegroundColor White
Write-Host "   console.error statements preserved" -ForegroundColor Yellow
Write-Host "`n"
