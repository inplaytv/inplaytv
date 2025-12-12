# Test Auto-Transition Endpoint
# Quick script to manually trigger the auto-transition check

$endpoint = "http://localhost:3003/api/tournament-lifecycle/auto-transition"

Write-Host "🔄 Testing auto-transition endpoint..." -ForegroundColor Cyan
Write-Host "Endpoint: $endpoint" -ForegroundColor Gray
Write-Host ""

try {
    # GET first to see info
    Write-Host "📋 Endpoint Info:" -ForegroundColor Yellow
    $info = Invoke-RestMethod -Uri $endpoint -Method GET
    $info | ConvertTo-Json -Depth 3 | Write-Host
    
    Write-Host ""
    Write-Host "🚀 Running auto-transition check..." -ForegroundColor Cyan
    
    # POST to trigger transition
    $result = Invoke-RestMethod -Uri $endpoint -Method POST -TimeoutSec 30
    
    Write-Host ""
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "  Timestamp: $($result.timestamp)" -ForegroundColor Gray
    Write-Host "  Tournaments Checked: $($result.checked)" -ForegroundColor Cyan
    Write-Host "  Successful Transitions: $($result.transitioned)" -ForegroundColor Green
    Write-Host "  Failed Transitions: $($result.failed)" -ForegroundColor $(if ($result.failed -gt 0) { 'Yellow' } else { 'Gray' })
    Write-Host ""
    
    if ($result.transitions -and $result.transitions.Count -gt 0) {
        Write-Host "📝 Transition Details:" -ForegroundColor Cyan
        foreach ($transition in $result.transitions) {
            $icon = if ($transition.success) { '✓' } else { '✗' }
            $color = if ($transition.success) { 'Green' } else { 'Yellow' }
            
            Write-Host "  $icon $($transition.tournamentName)" -ForegroundColor $color
            Write-Host "    Status: $($transition.fromStatus) → $($transition.toStatus)" -ForegroundColor Gray
            Write-Host "    Reason: $($transition.reason)" -ForegroundColor Gray
            
            if (-not $transition.success -and $transition.error) {
                Write-Host "    Error: $($transition.error)" -ForegroundColor Red
            }
            Write-Host ""
        }
    } else {
        Write-Host "No transitions needed at this time." -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Error calling endpoint:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails) {
        Write-Host ""
        Write-Host "Details:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message
    }
    
    Write-Host ""
    Write-Host "⚠️  Make sure the admin app is running:" -ForegroundColor Yellow
    Write-Host "   pnpm dev:admin" -ForegroundColor Cyan
}
