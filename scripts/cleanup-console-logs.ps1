# ===================================================================
# Replace console.log with logger utility for production safety
# ===================================================================

Write-Host "`n🔧 Console Log Cleanup Script" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Add logger import to files that use console
function Add-LoggerImport {
    param(
        [string]$FilePath
    )
    
    $content = Get-Content $FilePath -Raw
    
    # Check if logger is already imported
    if ($content -match "import.*logger.*from.*@repo/shared") {
        Write-Host "  ✓ Logger already imported" -ForegroundColor Green
        return $false
    }
    
    # Find the last import statement
    $lines = Get-Content $FilePath
    $lastImportLine = -1
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^import ") {
            $lastImportLine = $i
        }
    }
    
    if ($lastImportLine -ge 0) {
        # Add logger import after last import
        $newContent = @()
        $newContent += $lines[0..$lastImportLine]
        $newContent += "import { logger } from '@repo/shared';"
        if ($lastImportLine + 1 -lt $lines.Count) {
            $newContent += $lines[($lastImportLine + 1)..($lines.Count - 1)]
        }
        
        $newContent | Set-Content $FilePath
        Write-Host "  ✓ Added logger import" -ForegroundColor Green
        return $true
    }
    
    return $false
}

# Replace console calls with logger
function Replace-ConsoleCalls {
    param(
        [string]$FilePath
    )
    
    $content = Get-Content $FilePath -Raw
    $modified = $false
    
    # Replace console.log with logger.log
    if ($content -match 'console\.log') {
        $content = $content -replace 'console\.log', 'logger.log'
        $modified = $true
    }
    
    # Replace console.warn with logger.warn
    if ($content -match 'console\.warn') {
        $content = $content -replace 'console\.warn', 'logger.warn'
        $modified = $true
    }
    
    # Keep console.error as logger.error (always visible)
    if ($content -match 'console\.error') {
        $content = $content -replace 'console\.error', 'logger.error'
        $modified = $true
    }
    
    if ($modified) {
        Set-Content $FilePath -Value $content
        return $true
    }
    
    return $false
}

# Process all TypeScript files in apps
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
            $relativePath = $file.FullName.Replace($PSScriptRoot, "").Replace("\..\", "")
            
            # Check if file contains console calls
            $content = Get-Content $file.FullName -Raw
            if ($content -match 'console\.(log|warn|error)') {
                Write-Host "`n  📄 $relativePath" -ForegroundColor White
                
                # Add logger import
                Add-LoggerImport -FilePath $file.FullName | Out-Null
                
                # Replace console calls
                if (Replace-ConsoleCalls -FilePath $file.FullName) {
                    $modifiedFiles++
                    Write-Host "  ✓ Replaced console calls with logger" -ForegroundColor Green
                }
            }
        }
    }
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "✅ Cleanup Complete!" -ForegroundColor Green
Write-Host "   Files scanned: $totalFiles" -ForegroundColor White
Write-Host "   Files modified: $modifiedFiles" -ForegroundColor White
Write-Host "`n💡 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Review changes with: git diff" -ForegroundColor White
Write-Host "   2. Test in development mode" -ForegroundColor White
Write-Host "   3. Build for production: npm run build" -ForegroundColor White
Write-Host "`n"
