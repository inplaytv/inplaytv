# Trigger DataGolf salary sync API
# Update the tournament_id to match your tournament

$tournamentId = "TOURNAMENT_ID_HERE"  # Replace with actual tournament ID
$url = "http://localhost:3002/api/sync-datagolf-salaries"

Write-Host "Triggering salary sync from DataGolf..." -ForegroundColor Cyan

$body = @{
    tournament_id = $tournamentId
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Sync complete!" -ForegroundColor Green
    Write-Host $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Error syncing salaries:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
