# Installation script with retry logic
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "Starting installation..." -ForegroundColor Cyan
Write-Host "This may take 5-10 minutes with retries..." -ForegroundColor Yellow

$maxAttempts = 3
$attempt = 1

while ($attempt -le $maxAttempts) {
    Write-Host "`nAttempt $attempt of $maxAttempts..." -ForegroundColor Yellow
    
    & pnpm install --network-concurrency 3 --fetch-retry-mintimeout 20000 --fetch-retry-maxtimeout 120000
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nInstallation successful!" -ForegroundColor Green
        exit 0
    }
    
    Write-Host "`nAttempt $attempt failed. Waiting 10 seconds before retry..." -ForegroundColor Red
    Start-Sleep 10
    $attempt++
}

Write-Host "`nInstallation failed after $maxAttempts attempts." -ForegroundColor Red
Write-Host "You can try running: pnpm install --force" -ForegroundColor Yellow
exit 1
