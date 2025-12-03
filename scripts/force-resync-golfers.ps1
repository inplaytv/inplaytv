# Force Re-sync Tournament Golfers
# Clears existing golfers and re-syncs from DataGolf

Write-Host "=== Force Re-sync Tournament Golfers ===" -ForegroundColor Cyan

$tournaments = @(
    @{ id = "afa2df75-ee57-488a-aa13-5944b57f9e9c"; name = "Hero World Challenge" },
    @{ id = "88fbe29c-83c0-4be9-b03b-897d3fb2209f"; name = "Nedbank Golf Challenge" },
    @{ id = "f587d8e4-eef0-42c9-b008-6ffbd54e4e67"; name = "Crown Australian Open" }
)

foreach ($t in $tournaments) {
    Write-Host "`nProcessing: $($t.name)" -ForegroundColor Yellow
    
    try {
        # Call manual sync with replace=true to force refresh
        $body = @{
            tour = "pga"
            replace = $true
        } | ConvertTo-Json
        
        $result = Invoke-RestMethod `
            -Uri "http://localhost:3002/api/tournaments/$($t.id)/sync-golfers" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body
        
        if ($result.success) {
            Write-Host "  ✓ Synced: $($result.golfersAdded) golfers" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Error: $($result.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 2
}

Write-Host "`n=== Re-sync Complete ===" -ForegroundColor Cyan
Write-Host "Check team builder now - golfers should be visible" -ForegroundColor White
