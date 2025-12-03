# Simple Golfer Sync Script
$env:CRON_SECRET = "re7pJ9PekpbvlXqa2QObi6W+SlE9u+2kz8DxDOkyCgk="
$headers = @{
    'Authorization' = "Bearer $env:CRON_SECRET"
    'Content-Type' = 'application/json'
}

Write-Host "Starting sync..." -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri 'http://localhost:3002/api/cron/sync-tournament-golfers' -Method Post -Headers $headers -TimeoutSec 120

Write-Host "`nResults:" -ForegroundColor Green
Write-Host "Synced: $($response.syncedTournaments)"
Write-Host "Skipped: $($response.skippedTournaments)"
Write-Host "Errors: $($response.errors.Count)"

if ($response.details) {
    Write-Host "`nDetails:" -ForegroundColor Cyan
    $response.details | ForEach-Object {
        Write-Host "  $($_.tournamentName): $($_.golfersAdded) golfers"
    }
}
