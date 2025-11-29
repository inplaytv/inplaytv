# Check European tour for BMW Australian PGA
$apiKey = "ac7793fb5f617626ccc418008832"
$baseUrl = "https://feeds.datagolf.com"

Write-Host "`n=== Checking European Tour for BMW ===" -ForegroundColor Cyan

try {
    $url = "$baseUrl/preds/in-play?tour=euro&file_format=json&key=$apiKey"
    Write-Host "Calling: $url" -ForegroundColor Gray
    
    $response = Invoke-RestMethod -Uri $url -Method GET
    
    if ($response.info) {
        Write-Host "`nEvent: $($response.info.event_name)" -ForegroundColor Yellow
        Write-Host "Current Round: $($response.info.current_round)" -ForegroundColor White
        Write-Host "Last Update: $($response.info.last_update)" -ForegroundColor Gray
        
        Write-Host "`nUpdate SQL:" -ForegroundColor Cyan
        Write-Host "UPDATE tournaments SET event_id = '$($response.info.event_name)' WHERE name LIKE '%BMW%Australian%';" -ForegroundColor White
    } else {
        Write-Host "No active European tour event" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== DataGolf API Note ===" -ForegroundColor Yellow
Write-Host "The BMW Australian PGA Championship is on the PGA Tour of Australasia"
Write-Host "DataGolf may not have this tournament in their feed"
Write-Host "Checking their schedule endpoint for event mapping..." -ForegroundColor Gray

# Try the schedule endpoint
try {
    $url = "$baseUrl/preds/pre-tournament?tour=pga&add_position=0&file_format=json&key=$apiKey"
    $schedule = Invoke-RestMethod -Uri $url -Method GET
    Write-Host "`nUpcoming PGA events:" -ForegroundColor Cyan
    $schedule | ForEach-Object { Write-Host "  - $($_.event_name)" -ForegroundColor White }
} catch {
    Write-Host "Could not fetch schedule" -ForegroundColor Red
}
