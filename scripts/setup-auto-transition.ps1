# Setup Automated Tournament Lifecycle Transitions
# This script creates a Windows Task Scheduler task that runs every 5 minutes
# to automatically transition tournament statuses based on timestamps

$taskName = "InPlayTV-Tournament-Auto-Transition"
$scriptPath = Join-Path $PSScriptRoot "run-auto-transition.ps1"
$logPath = Join-Path $PSScriptRoot "auto-transition.log"

Write-Host "🔄 Setting up automated tournament lifecycle transitions..." -ForegroundColor Cyan

# Check if admin server is configured
$adminPort = 3003
$endpoint = "http://localhost:$adminPort/api/tournament-lifecycle/auto-transition"

Write-Host "Will call endpoint: $endpoint" -ForegroundColor Yellow

# Create the runner script
$runnerScript = @"
# Auto-Transition Runner Script
# Calls the tournament lifecycle auto-transition endpoint

`$logFile = '$logPath'
`$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
`$endpoint = '$endpoint'

# Optional: Set your cron secret token for security
# `$headers = @{ 'Authorization' = 'Bearer YOUR_SECRET_TOKEN_HERE' }

try {
    Write-Output "`n[`$timestamp] Running auto-transition check..."
    
    # Call the endpoint
    `$response = Invoke-RestMethod -Uri `$endpoint -Method POST -Headers @{} -TimeoutSec 30
    
    `$checked = `$response.checked
    `$transitioned = `$response.transitioned
    `$failed = `$response.failed
    
    Write-Output "[`$timestamp] ✅ Success: Checked `$checked tournaments, `$transitioned transitions, `$failed failures"
    
    if (`$response.transitions -and `$response.transitions.Count -gt 0) {
        foreach (`$transition in `$response.transitions) {
            if (`$transition.success) {
                Write-Output "  ✓ `$(`$transition.tournamentName): `$(`$transition.fromStatus) → `$(`$transition.toStatus) (`$(`$transition.reason))"
            } else {
                Write-Output "  ✗ `$(`$transition.tournamentName): Failed - `$(`$transition.error)"
            }
        }
    }
    
} catch {
    Write-Output "[`$timestamp] ❌ Error: `$(`$_.Exception.Message)"
    if (`$_.ErrorDetails) {
        Write-Output "  Details: `$(`$_.ErrorDetails.Message)"
    }
}
"@

# Save the runner script
$runnerScript | Out-File -FilePath $scriptPath -Encoding UTF8
Write-Host "✅ Created runner script: $scriptPath" -ForegroundColor Green

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "⚠️  Task '$taskName' already exists. Removing..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create the scheduled task
Write-Host "Creating scheduled task..." -ForegroundColor Cyan

# Action: Run PowerShell script
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" >> `"$logPath`" 2>&1"

# Trigger: Every 5 minutes
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)

# Settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -MultipleInstances IgnoreNew

# Principal: Run as current user
$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Highest

# Register the task
Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "Automatically transitions InPlayTV tournament statuses based on registration and tournament timestamps" `
    | Out-Null

Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Task Details:" -ForegroundColor Cyan
Write-Host "  Name: $taskName"
Write-Host "  Runs: Every 5 minutes"
Write-Host "  Endpoint: $endpoint"
Write-Host "  Log file: $logPath"
Write-Host ""
Write-Host "🔧 Management Commands:" -ForegroundColor Yellow
Write-Host "  View task:    Get-ScheduledTask -TaskName '$taskName'"
Write-Host "  Run now:      Start-ScheduledTask -TaskName '$taskName'"
Write-Host "  Disable:      Disable-ScheduledTask -TaskName '$taskName'"
Write-Host "  Enable:       Enable-ScheduledTask -TaskName '$taskName'"
Write-Host "  Remove:       Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
Write-Host "  View log:     Get-Content '$logPath' -Tail 50"
Write-Host ""

# Ask if user wants to run it now
$runNow = Read-Host "Do you want to run the task now to test it? (y/n)"
if ($runNow -eq 'y' -or $runNow -eq 'Y') {
    Write-Host "Running task..." -ForegroundColor Cyan
    Start-ScheduledTask -TaskName $taskName
    Start-Sleep -Seconds 3
    
    Write-Host ""
    Write-Host "📄 Log output:" -ForegroundColor Cyan
    if (Test-Path $logPath) {
        Get-Content $logPath -Tail 20
    } else {
        Write-Host "  (Log file not created yet - task may still be running)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Setup complete! Tournament statuses will now transition automatically." -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Make sure your admin app is running on port $adminPort" -ForegroundColor Yellow
Write-Host "   Run: pnpm dev:admin" -ForegroundColor Yellow
Write-Host ""
