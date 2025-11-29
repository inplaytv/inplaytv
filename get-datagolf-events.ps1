# Fetch current and recent tournaments from DataGolf API
$apiKey = "ac7793fb5f617626ccc418008832"
$baseUrl = "https://feeds.datagolf.com"

Write-Host "`n=== Fetching DataGolf Tournament Schedule ===" -ForegroundColor Cyan

try {
    # Try getting in-play predictions which shows current/live tournaments
    $url = "$baseUrl/preds/in-play?tour=pga&file_format=json&key=$apiKey"
    Write-Host "`nTrying in-play endpoint: $url" -ForegroundColor Gray
    
    $response = Invoke-RestMethod -Uri $url -Method GET
    
    Write-Host "`nIn-Play Data Structure:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "`nError with in-play:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`n`n=== Trying field-updates endpoint ===" -ForegroundColor Cyan

try {
    # Get field updates (current and upcoming tournaments)
    $url = "$baseUrl/field-updates?tour=pga&file_format=json&key=$apiKey"
    Write-Host "`nCalling: $url" -ForegroundColor Gray
    
    $response = Invoke-RestMethod -Uri $url -Method GET
    
    Write-Host "`nFound $($response.Count) tournaments:" -ForegroundColor Green
    
    foreach ($event in $response) {
        $status = if ($event.event_completed) { "COMPLETED" } 
                 elseif ($event.rounds_completed -gt 0) { "LIVE" } 
                 else { "UPCOMING" }
        
        Write-Host "`n[$status] $($event.event_name)" -ForegroundColor Yellow
        Write-Host "  Event ID: $($event.event_id)" -ForegroundColor White
        Write-Host "  Calendar Year: $($event.calendar_year)" -ForegroundColor Gray
        Write-Host "  Rounds Completed: $($event.rounds_completed)/4" -ForegroundColor Gray
        
        # Highlight if it's the BMW Australian PGA
        if ($event.event_name -like "*BMW*" -or $event.event_name -like "*Australian*PGA*") {
            Write-Host "  >>> THIS IS THE BMW TOURNAMENT! <<<" -ForegroundColor Green
        }
    }
    
    Write-Host "`n=== Looking for BMW Australian PGA Championship ===" -ForegroundColor Cyan
    $bmwEvent = $response | Where-Object { $_.event_name -like "*BMW*" -or $_.event_name -like "*Australian*PGA*" }
    
    if ($bmwEvent) {
        Write-Host "`nFound BMW Tournament!" -ForegroundColor Green
        Write-Host "Event ID: $($bmwEvent.event_id)" -ForegroundColor Yellow
        Write-Host "Event Name: $($bmwEvent.event_name)" -ForegroundColor Yellow
        Write-Host "`nUpdate SQL:" -ForegroundColor Cyan
        Write-Host "UPDATE tournaments SET event_id = '$($bmwEvent.event_id)' WHERE name LIKE '%BMW%Australian%PGA%';" -ForegroundColor White
    } else {
        Write-Host "`nBMW tournament not found in current schedule." -ForegroundColor Yellow
        Write-Host "It may have completed or not yet started. Check the list above." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "`nError:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody"
    }
}
