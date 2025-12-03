# Check Tournament Golfers Status
# Verifies if golfers exist and are properly linked to tournaments

$env:CRON_SECRET = "re7pJ9PekpbvlXqa2QObi6W+SlE9u+2kz8DxDOkyCgk="

Write-Host "`n=== Checking Tournament Golfers ===" -ForegroundColor Cyan

# Get tournament data
$response = Invoke-RestMethod -Uri "http://localhost:3002/api/tournament-lifecycle" -Method GET
$regOpen = $response.tournaments | Where-Object { $_.status -eq 'registration_open' }

foreach ($tournament in $regOpen) {
    Write-Host "`n$($tournament.name):" -ForegroundColor Yellow
    Write-Host "  Tournament ID: $($tournament.id)" -ForegroundColor Gray
    Write-Host "  Golfer Count (API): $($tournament.golfer_count)" -ForegroundColor White
    Write-Host "  Start Date: $($tournament.start_date)" -ForegroundColor White
    Write-Host "  Status: $($tournament.status)" -ForegroundColor Green
    
    # Try to get golfers for a competition in this tournament
    if ($tournament.competition_count -gt 0) {
        Write-Host "  Checking team builder availability..." -ForegroundColor Cyan
    } else {
        Write-Host "  ⚠️ NO COMPETITIONS CREATED YET" -ForegroundColor Red
    }
}

Write-Host "`n=== Recommendation ===" -ForegroundColor Magenta
Write-Host "If golfers show in lifecycle manager but not in team builder:" -ForegroundColor White
Write-Host "1. Clear tournament_golfers for these 3 tournaments" -ForegroundColor Gray
Write-Host "2. Re-run golfer sync with replace=true" -ForegroundColor Gray
Write-Host "3. This will fetch fresh golfer data from DataGolf" -ForegroundColor Gray
