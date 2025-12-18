# InPlayTV Development Helper Script
# This script ensures PATH is correct before running pnpm commands

# Refresh PATH to include Node.js and pnpm
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Add local node_modules to PATH
$env:PATH += ";$PSScriptRoot\node_modules\.bin"

Write-Host "Environment ready. Node: $(node --version), pnpm: $(pnpm --version)" -ForegroundColor Green

# Run pnpm with all arguments
& pnpm @args
