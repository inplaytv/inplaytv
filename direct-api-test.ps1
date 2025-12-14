Write-Host "🔧 DIRECT API TEST..."

# Simple test that should definitely work
try {
    Write-Host "Calling API directly..."
    
    # Create a simple WebClient request
    $web = New-Object System.Net.WebClient
    $web.Headers.Add("User-Agent", "PowerShell Test")
    $result = $web.DownloadString("http://localhost:3000/api/settings/tournament-background")
    
    Write-Host "✅ RAW RESPONSE: $result"
    
    # Try to parse JSON
    $data = $result | ConvertFrom-Json
    Write-Host "📝 Background URL: $($data.backgroundUrl)"
    
    # Check if it matches expected value
    if ($data.backgroundUrl -eq "/main_images/tournaments/inplay_bg-04.png") {
        Write-Host "🎉 PERFECT! Cache fix worked!" -ForegroundColor Green
    } else {
        Write-Host "❌ Still wrong value - expected: /main_images/tournaments/inplay_bg-04.png" -ForegroundColor Red
    }
}
catch {
    Write-Host "💥 Error: $($_.Exception.Message)" -ForegroundColor Red
}