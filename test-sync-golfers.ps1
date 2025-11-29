# Test sync-golfers endpoint for Hero World Challenge
$tournamentId = "afa2df75-ee57-488a-aa13-5944b57f9e9c"
$url = "http://localhost:3002/api/tournaments/$tournamentId/sync-golfers"

Write-Host "`n🧪 Testing sync-golfers endpoint..." -ForegroundColor Cyan
Write-Host "Tournament: Hero World Challenge" -ForegroundColor Yellow
Write-Host "URL: $url`n" -ForegroundColor Gray

$body = @{
    tour = "pga"
    replace = $true
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ SUCCESS`n" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ ERROR`n" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Message: $($_.Exception.Message)"
    
    if ($_.ErrorDetails.Message) {
        Write-Host "`nResponse Body:"
        $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 5
    }
}
