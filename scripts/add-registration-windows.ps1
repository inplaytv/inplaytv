# PowerShell script to add registration window columns to tournaments table
# Run this script from the project root: .\scripts\add-registration-windows.ps1

Write-Host "Adding registration window columns to tournaments table..." -ForegroundColor Cyan

# SQL to execute
$sql = @"
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS registration_opens_at timestamptz,
ADD COLUMN IF NOT EXISTS registration_closes_at timestamptz;

COMMENT ON COLUMN tournaments.registration_opens_at IS 'When registration opens for this tournament';
COMMENT ON COLUMN tournaments.registration_closes_at IS 'When registration closes for this tournament';

CREATE INDEX IF NOT EXISTS idx_tournaments_registration_windows 
ON tournaments(registration_opens_at, registration_closes_at) 
WHERE registration_opens_at IS NOT NULL;
"@

Write-Host "`nSQL to execute:" -ForegroundColor Yellow
Write-Host $sql -ForegroundColor Gray

Write-Host "`n=== MANUAL STEPS ===" -ForegroundColor Magenta
Write-Host "1. Go to: https://gozhtmfqiszwxnclvbkx.supabase.co/project/gozhtmfqiszwxnclvbkx/sql/new" -ForegroundColor White
Write-Host "2. Copy the SQL above" -ForegroundColor White
Write-Host "3. Paste it into the SQL Editor" -ForegroundColor White
Write-Host "4. Click 'Run' to execute" -ForegroundColor White
Write-Host "5. Verify columns were added successfully" -ForegroundColor White

Write-Host "`nPress any key to open Supabase SQL Editor..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "https://gozhtmfqiszwxnclvbkx.supabase.co/project/gozhtmfqiszwxnclvbkx/sql/new"

Write-Host "`nSQL Editor opened in browser." -ForegroundColor Green
