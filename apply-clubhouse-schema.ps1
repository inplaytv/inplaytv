# Clubhouse System - Apply Database Schema
# Run this to set up the clubhouse tables in Supabase

Write-Host "Clubhouse System - Database Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
$envPath = ".\apps\golf\.env.local"
if (-not (Test-Path $envPath)) {
    Write-Host "Error: $envPath not found!" -ForegroundColor Red
    Write-Host "Please ensure you have environment variables configured." -ForegroundColor Yellow
    exit 1
}

Write-Host "Reading SQL schema file..." -ForegroundColor Green
$schemaPath = ".\scripts\clubhouse\01-create-schema.sql"

if (-not (Test-Path $schemaPath)) {
    Write-Host "Error: Schema file not found at $schemaPath" -ForegroundColor Red
    exit 1
}

$schema = Get-Content $schemaPath -Raw

Write-Host ""
Write-Host "Schema loaded successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Open your Supabase dashboard: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Go to SQL Editor" -ForegroundColor White
Write-Host "3. Copy the contents from: $schemaPath" -ForegroundColor White
Write-Host "4. Paste and run the SQL to create tables" -ForegroundColor White
Write-Host ""
Write-Host "OR" -ForegroundColor Yellow
Write-Host ""
Write-Host "Copy the schema to clipboard? (Y/N): " -NoNewline -ForegroundColor Green
$response = Read-Host

if ($response -eq 'Y' -or $response -eq 'y') {
    Set-Clipboard -Value $schema
    Write-Host ""
    Write-Host "✓ Schema copied to clipboard!" -ForegroundColor Green
    Write-Host "Paste it into Supabase SQL Editor and run." -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Schema file location: $schemaPath" -ForegroundColor White
}

Write-Host ""
Write-Host "After applying schema, test with:" -ForegroundColor Cyan
Write-Host "  http://localhost:3003/clubhouse/admin" -ForegroundColor White
Write-Host ""
