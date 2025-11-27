# ===================================================================
# Add Supabase Credentials to .env.local Files
# Run: .\scripts\add-supabase-env.ps1 -Url "your-url" -AnonKey "your-key"
# ===================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$Url,
    
    [Parameter(Mandatory=$true)]
    [string]$AnonKey,
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceRoleKey
)

Write-Host "`n🔧 Adding Supabase Credentials" -ForegroundColor Cyan
Write-Host "==============================`n" -ForegroundColor Cyan

$apps = @("apps/golf", "apps/admin", "apps/web")

foreach ($app in $apps) {
    $envFile = "$app\.env.local"
    
    Write-Host "📁 $app" -ForegroundColor Yellow
    
    if (Test-Path $envFile) {
        $content = Get-Content $envFile -Raw
        
        # Remove existing Supabase vars if present
        $content = $content -replace "NEXT_PUBLIC_SUPABASE_URL=.*\r?\n?", ""
        $content = $content -replace "NEXT_PUBLIC_SUPABASE_ANON_KEY=.*\r?\n?", ""
        $content = $content -replace "SUPABASE_SERVICE_ROLE_KEY=.*\r?\n?", ""
        
        # Add new vars
        $content = $content.TrimEnd()
        $content += "`n`n# Supabase Configuration"
        $content += "`nNEXT_PUBLIC_SUPABASE_URL=$Url"
        $content += "`nNEXT_PUBLIC_SUPABASE_ANON_KEY=$AnonKey"
        
        if ($ServiceRoleKey) {
            $content += "`nSUPABASE_SERVICE_ROLE_KEY=$ServiceRoleKey"
        }
        
        Set-Content $envFile -Value $content
        Write-Host "  ✓ Updated" -ForegroundColor Green
    } else {
        # Create new file
        $content = "# Supabase Configuration"
        $content += "`nNEXT_PUBLIC_SUPABASE_URL=$Url"
        $content += "`nNEXT_PUBLIC_SUPABASE_ANON_KEY=$AnonKey"
        
        if ($ServiceRoleKey) {
            $content += "`nSUPABASE_SERVICE_ROLE_KEY=$ServiceRoleKey"
        }
        
        Set-Content $envFile -Value $content
        Write-Host "  ✓ Created" -ForegroundColor Green
    }
}

Write-Host "`n==============================" -ForegroundColor Cyan
Write-Host "✅ Supabase credentials added!" -ForegroundColor Green
Write-Host "`nNext step: Restart your dev server" -ForegroundColor Yellow
Write-Host "  turbo dev`n" -ForegroundColor Gray
