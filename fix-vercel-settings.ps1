# Fix Vercel deployment settings for Golf and Admin projects

Write-Host "Configuring Vercel projects..." -ForegroundColor Cyan

# Get auth token from Vercel CLI config
$vercelConfigPath = "$env:APPDATA\com.vercel.cli\auth.json"
if (Test-Path $vercelConfigPath) {
    $authConfig = Get-Content $vercelConfigPath | ConvertFrom-Json
    $token = $authConfig.token
} else {
    Write-Host "Error: Not logged in to Vercel CLI" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Project configurations
$projects = @(
    @{
        name = "inplaygolf"
        rootDirectory = "apps/golf"
        buildCommand = "cd ../.. && pnpm run build --filter=golf"
        installCommand = "pnpm install"
    },
    @{
        name = "inplaytv-admin"
        rootDirectory = "apps/admin"
        buildCommand = "cd ../.. && pnpm run build --filter=admin"
        installCommand = "pnpm install"
    }
)

foreach ($project in $projects) {
    Write-Host ""
    Write-Host "Updating $($project.name)..." -ForegroundColor Yellow
    
    $body = @{
        buildCommand = $project.buildCommand
        installCommand = $project.installCommand
        rootDirectory = $project.rootDirectory
        framework = "nextjs"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "https://api.vercel.com/v9/projects/$($project.name)" `
            -Method PATCH `
            -Headers $headers `
            -Body $body

        Write-Host "Success: Updated $($project.name)" -ForegroundColor Green
        Write-Host "  Root Directory: $($project.rootDirectory)"
        Write-Host "  Build Command: $($project.buildCommand)"
    }
    catch {
        Write-Host "Error: Failed to update $($project.name)" -ForegroundColor Red
        Write-Host $_.Exception.Message
    }
}

Write-Host ""
Write-Host "Vercel configuration complete!" -ForegroundColor Green
