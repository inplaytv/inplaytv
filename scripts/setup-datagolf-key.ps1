# ===================================================================
# DataGolf API Key Setup Script
# Adds your API key to all .env.local files
# ===================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

Write-Host "`n🏌️ DataGolf API Key Setup" -ForegroundColor Cyan
Write-Host "========================`n" -ForegroundColor Cyan

# Validate API key format
if (-not $ApiKey.StartsWith("dg-")) {
    Write-Host "⚠️  Warning: API key doesn't start with 'dg-'" -ForegroundColor Yellow
    Write-Host "   DataGolf keys typically start with 'dg-'" -ForegroundColor Yellow
    $confirm = Read-Host "`n   Continue anyway? (y/n)"
    if ($confirm -ne "y") {
        Write-Host "`n❌ Setup cancelled`n" -ForegroundColor Red
        exit 1
    }
}

# Apps to update
$apps = @(
    "apps/golf",
    "apps/admin",
    "apps/web"
)

Write-Host "📝 Adding API key to .env.local files...`n" -ForegroundColor White

foreach ($app in $apps) {
    $appPath = Join-Path $PSScriptRoot "..\$app"
    $envFile = Join-Path $appPath ".env.local"
    
    if (Test-Path $appPath) {
        Write-Host "  📁 $app" -ForegroundColor Yellow
        
        # Check if .env.local exists
        if (Test-Path $envFile) {
            $content = Get-Content $envFile -Raw
            
            # Check if DATAGOLF_API_KEY already exists
            if ($content -match "DATAGOLF_API_KEY=") {
                # Replace existing key
                $content = $content -replace "DATAGOLF_API_KEY=.*", "DATAGOLF_API_KEY=$ApiKey"
                Set-Content $envFile -Value $content
                Write-Host "     ✓ Updated existing API key" -ForegroundColor Green
            } else {
                # Append new key
                Add-Content $envFile "`nDATAGOLF_API_KEY=$ApiKey"
                Write-Host "     ✓ Added API key" -ForegroundColor Green
            }
        } else {
            # Create new .env.local file
            "DATAGOLF_API_KEY=$ApiKey" | Set-Content $envFile
            Write-Host "     ✓ Created .env.local with API key" -ForegroundColor Green
        }
    } else {
        Write-Host "     ⚠️  Directory not found: $appPath" -ForegroundColor Yellow
    }
}

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "📋 Next steps:`n" -ForegroundColor Yellow
Write-Host "  1. Test the connection:" -ForegroundColor White
Write-Host "     node scripts/test-datagolf-connection.js`n" -ForegroundColor Gray

Write-Host "  2. Restart your development server:" -ForegroundColor White
Write-Host "     turbo dev`n" -ForegroundColor Gray

Write-Host "  3. Add to production environment:" -ForegroundColor White
Write-Host "     - Go to your deployment platform (Vercel/Netlify)" -ForegroundColor Gray
Write-Host "     - Add environment variable: DATAGOLF_API_KEY" -ForegroundColor Gray
Write-Host "     - Value: $ApiKey" -ForegroundColor Gray
Write-Host "     - Redeploy your apps`n" -ForegroundColor Gray

Write-Host "  4. Verify in Admin Panel:" -ForegroundColor White
Write-Host "     - Go to Admin → AI Tournament Creator" -ForegroundColor Gray
Write-Host "     - Click 'Fetch Upcoming Tournaments'" -ForegroundColor Gray
Write-Host "     - Should see real DataGolf data`n" -ForegroundColor Gray

Write-Host "🔒 Security Note:" -ForegroundColor Yellow
Write-Host "   .env.local files are in .gitignore (not committed to git)" -ForegroundColor White
Write-Host "   Your API key is safe!`n" -ForegroundColor White
