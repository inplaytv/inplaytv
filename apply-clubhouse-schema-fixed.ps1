# Clubhouse System - Apply Database Schema
Write-Host "Clubhouse System - Database Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$schemaPath = ".\scripts\clubhouse\01-create-schema.sql"

if (-not (Test-Path $schemaPath)) {
    Write-Host "ERROR: Schema file not found at $schemaPath" -ForegroundColor Red
    exit 1
}

Write-Host "Reading SQL schema file..." -ForegroundColor Green
$schema = Get-Content $schemaPath -Raw

Write-Host "Schema loaded successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Open your Supabase dashboard" -ForegroundColor White
Write-Host "2. Go to SQL Editor -> New Query" -ForegroundColor White
Write-Host "3. Schema will be copied to clipboard now..." -ForegroundColor White
Write-Host ""

Set-Clipboard -Value $schema
Write-Host "DONE! Schema copied to clipboard!" -ForegroundColor Green
Write-Host "Paste it into Supabase SQL Editor and click RUN" -ForegroundColor Yellow
Write-Host ""
Write-Host "After applying, test at: http://localhost:3003/clubhouse/admin" -ForegroundColor Cyan
