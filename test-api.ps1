Write-Host "Testing Web App API..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/settings/tournament-background" -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    Write-Host "Background URL: $($content.backgroundUrl)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}