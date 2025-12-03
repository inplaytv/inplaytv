# Emergency Golfer Sync Script
Write-Host '🚨 EMERGENCY GOLFER SYNC - Starting...' -ForegroundColor Red

$ADMIN_URL = 'http://localhost:3000'
$CRON_SECRET = if ($env:CRON_SECRET) { $env:CRON_SECRET } else { 'default-cron-secret' }

Write-Host '🔄 Triggering automated golfer sync...' -ForegroundColor Cyan

try {
    $headers = @{
        'Authorization' = "Bearer $CRON_SECRET"
        'Content-Type' = 'application/json'
    }
    
    $response = Invoke-RestMethod -Uri "$ADMIN_URL/api/cron/sync-tournament-golfers" -Method Post -Headers $headers -TimeoutSec 120
    
    Write-Host '✅ SYNC COMPLETE!' -ForegroundColor Green
    Write-Host "Tournaments Synced: $($response.syncedTournaments)"
    Write-Host "Tournaments Skipped: $($response.skippedTournaments)"
    Write-Host "Errors: $($response.errors.Count)"
    
    if ($response.details) {
        Write-Host ''
        Write-Host 'Details:' -ForegroundColor Cyan
        foreach ($detail in $response.details) {
            Write-Host "  $($detail.tournamentName): $($detail.status) - $($detail.golfersAdded) golfers"
        }
    }
} catch {
    Write-Host '❌ ERROR: Failed to sync golfers' -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)"
    Write-Host ''
    Write-Host 'Troubleshooting:' -ForegroundColor Yellow
    Write-Host '  1. Make sure admin app is running: pnpm run dev:admin'
    Write-Host '  2. Check CRON_SECRET environment variable'
    Write-Host '  3. Verify DATAGOLF_API_KEY is set'
    exit 1
}
