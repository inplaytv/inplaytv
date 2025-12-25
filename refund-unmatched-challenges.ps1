# ===================================================================
# REFUND UNMATCHED ONE 2 ONE CHALLENGES
# ===================================================================
# This script manually triggers the cleanup/refund process for
# unmatched ONE 2 ONE challenges from completed tournaments
# ===================================================================

Write-Host "💰 Processing Refunds for Unmatched ONE 2 ONE Challenges..." -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
$envFile = ".\apps\golf\.env.local"
if (-Not (Test-Path $envFile)) {
    Write-Host "❌ Error: $envFile not found!" -ForegroundColor Red
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

$cronSecret = $env:CRON_SECRET

if (-Not $cronSecret) {
    Write-Host "⚠️  Warning: CRON_SECRET not found in .env.local" -ForegroundColor Yellow
    Write-Host "Creating a temporary secret for this run..." -ForegroundColor Yellow
    $cronSecret = "temp-manual-trigger"
    [Environment]::SetEnvironmentVariable("CRON_SECRET", $cronSecret, "Process")
}

Write-Host "✅ Environment loaded" -ForegroundColor Green
Write-Host ""

# Execute the cron job
Write-Host "🚀 Triggering cleanup/refund process..." -ForegroundColor Cyan
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $cronSecret"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod `
        -Uri "http://localhost:3003/api/one-2-one/cron/cancel-unfilled" `
        -Method Post `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host ""
    Write-Host "✅ Cleanup Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "📊 Results:" -ForegroundColor Cyan
    Write-Host ""
    
    if ($response.deletedPending -gt 0) {
        Write-Host "  🗑️  Abandoned Challenges Deleted: $($response.deletedPending)" -ForegroundColor Yellow
    }
    
    if ($response.cancelledFromEndedTournaments -gt 0) {
        Write-Host "  🏆 Challenges from Ended Tournaments: $($response.cancelledFromEndedTournaments)" -ForegroundColor Magenta
        Write-Host "  💰 Users Refunded (Ended Tournaments): $($response.refundedFromEndedTournaments)" -ForegroundColor Green
    }
    
    if ($response.cancelledOpen -gt 0) {
        Write-Host "  ⏰ Expired Challenges Cancelled: $($response.cancelledOpen)" -ForegroundColor Yellow
        Write-Host "  💰 Users Refunded (Expired): $($response.refunded)" -ForegroundColor Green
    }
    
    if ($response.deletedPending -eq 0 -and $response.cancelledFromEndedTournaments -eq 0 -and $response.cancelledOpen -eq 0) {
        Write-Host "  ✓ No unmatched challenges found - all clean!" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "💡 What Happened:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "✓ Abandoned team builders deleted (no refund needed)" -ForegroundColor White
    Write-Host "✓ Unmatched challenges from ended tournaments cancelled" -ForegroundColor White
    Write-Host "✓ Users automatically refunded to wallet" -ForegroundColor White
    Write-Host "✓ Wallet transaction records created" -ForegroundColor White
    Write-Host ""
    Write-Host "🔄 This process runs automatically via cron job" -ForegroundColor Cyan
    Write-Host "   Set up Vercel Cron or similar to call:" -ForegroundColor White
    Write-Host "   POST /api/one-2-one/cron/cancel-unfilled" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Error triggering cleanup:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Make sure:" -ForegroundColor Yellow
    Write-Host "1. Development server is running (pnpm dev:golf)" -ForegroundColor White
    Write-Host "2. CRON_SECRET is set in .env.local" -ForegroundColor White
    Write-Host "3. Database connection is working" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "✅ Refund Process Complete" -ForegroundColor Green
Write-Host ""
