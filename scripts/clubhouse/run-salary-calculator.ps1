# Run Clubhouse Smart Salary Calculator
# Implements 60% Rank + 40% Form formula with sigmoid distribution

Write-Host "`n🏆 CLUBHOUSE SMART SALARY CALCULATOR" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "Formula: Salary = Base + (60% Rank Score + 40% Form Score) × Scaling" -ForegroundColor Cyan
Write-Host "Budget: £600.00 for 6 players" -ForegroundColor Yellow
Write-Host "Ranges:" -ForegroundColor Yellow
Write-Host "  Elite: £115.00 - £135.00" -ForegroundColor Yellow
Write-Host "  Mid:   £90.00 - £115.00" -ForegroundColor Yellow
Write-Host "  Value: £65.00 - £85.00" -ForegroundColor Yellow
Write-Host ""

# Check if Node.js is available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if script exists
$scriptPath = Join-Path $PSScriptRoot "calculate-smart-salaries.js"
if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Script not found: $scriptPath" -ForegroundColor Red
    exit 1
}

# Run the calculator
try {
    node $scriptPath $args
} catch {
    Write-Host "`n❌ Error running calculator: $_" -ForegroundColor Red
    exit 1
}
