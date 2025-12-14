Write-Host "Testing Tournament Background API..."
try {
    Start-Sleep -Seconds 2
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/settings/tournament-background" -UseBasicParsing -TimeoutSec 10
    $content = $response.Content | ConvertFrom-Json
    Write-Host "SUCCESS! Background URL: $($content.backgroundUrl)"
    Write-Host "Expected: /main_images/tournaments/inplay_bg-04.png"
    
    if ($content.backgroundUrl -eq "/main_images/tournaments/inplay_bg-04.png") {
        Write-Host "✅ CORRECT VALUE!" -ForegroundColor Green
    } else {
        Write-Host "❌ WRONG VALUE!" -ForegroundColor Red
    }
} catch {
    Write-Host "Error connecting: $($_.Exception.Message)"
    Write-Host "Web app might not be ready yet..."
}