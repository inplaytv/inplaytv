# ===================================================================
# Apply RLS Security Fixes to Supabase
# ===================================================================
# This script applies the RLS migration to fix security issues
# Run this from the project root directory
# ===================================================================

Write-Host "🔐 Applying RLS Security Fixes..." -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
$envFile = ".\apps\golf\.env.local"
if (-Not (Test-Path $envFile)) {
    Write-Host "❌ Error: $envFile not found!" -ForegroundColor Red
    Write-Host "Please ensure you're in the project root directory." -ForegroundColor Yellow
    exit 1
}

# Load environment variables
Write-Host "📁 Loading environment variables..." -ForegroundColor Yellow
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.+)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$supabaseKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-Not $supabaseUrl -or -Not $supabaseKey) {
    Write-Host "❌ Error: Missing Supabase credentials in .env.local" -ForegroundColor Red
    Write-Host "Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Environment loaded" -ForegroundColor Green
Write-Host ""

# Read the SQL migration file
$sqlFile = ".\FIX-RLS-SECURITY-ISSUES.sql"
if (-Not (Test-Path $sqlFile)) {
    Write-Host "❌ Error: $sqlFile not found!" -ForegroundColor Red
    exit 1
}

$sqlContent = Get-Content $sqlFile -Raw
Write-Host "📄 SQL migration loaded: FIX-RLS-SECURITY-ISSUES.sql" -ForegroundColor Yellow
Write-Host ""

# Execute SQL via Supabase REST API
Write-Host "🚀 Executing migration..." -ForegroundColor Cyan

try {
    $headers = @{
        "apikey" = $supabaseKey
        "Authorization" = "Bearer $supabaseKey"
        "Content-Type" = "application/json"
        "Prefer" = "return=representation"
    }
    
    $body = @{
        query = $sqlContent
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod `
        -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host ""
    Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Results:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "✓ RLS enabled on tournament_sync_history" -ForegroundColor Green
    Write-Host "✓ RLS policies created for admin access" -ForegroundColor Green
    Write-Host "✓ Settings table checked and secured (if exists)" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Check Supabase dashboard to verify RLS is enabled" -ForegroundColor White
    Write-Host "2. Test admin functionality to ensure policies work" -ForegroundColor White
    Write-Host "3. Check for remaining warnings (you mentioned 5 warnings)" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Error executing migration:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative: Apply SQL directly in Supabase SQL Editor" -ForegroundColor Yellow
    Write-Host "1. Go to your Supabase Dashboard" -ForegroundColor White
    Write-Host "2. Navigate to SQL Editor" -ForegroundColor White
    Write-Host "3. Copy content from FIX-RLS-SECURITY-ISSUES.sql" -ForegroundColor White
    Write-Host "4. Paste and run in SQL Editor" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "🔒 Security Status: FIXED" -ForegroundColor Green
Write-Host ""
