# InPlayTV Workspace Backup Script
# Creates a timestamped backup of the entire workspace

param(
    [string]$BackupPath = "C:\Backups\inplaytv"
)

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupName = "inplaytv-backup-$timestamp"
$fullBackupPath = Join-Path $BackupPath $backupName

Write-Host "InPlayTV Workspace Backup" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Create backup directory if it doesn't exist
if (!(Test-Path $BackupPath)) {
    Write-Host "Creating backup directory: $BackupPath" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
}

Write-Host "Backup location: $fullBackupPath" -ForegroundColor Green
Write-Host ""

# Get current directory
$sourceDir = Get-Location

Write-Host "Backing up workspace from: $sourceDir" -ForegroundColor Cyan
Write-Host "This may take a few minutes..." -ForegroundColor Yellow
Write-Host ""

try {
    # Create the backup using robocopy (faster than Copy-Item)
    # Excludes: node_modules, .next, .turbo, .git, .vercel
    $excludeDirs = @("node_modules", ".next", ".turbo", ".git", ".vercel", "dist", "build")
    $excludeFiles = @("*.log", "pnpm-lock.yaml")
    
    $robocopyArgs = @(
        "`"$sourceDir`"",
        "`"$fullBackupPath`"",
        "/E",  # Copy subdirectories including empty ones
        "/XD"
    ) + $excludeDirs + @(
        "/XF"
    ) + $excludeFiles + @(
        "/MT:8",  # Multi-threaded (8 threads)
        "/NFL",  # No file list
        "/NDL",  # No directory list
        "/NJH",  # No job header
        "/NJS",  # No job summary
        "/NC",  # No class
        "/NS",  # No size
        "/NP"   # No progress
    )
    
    Write-Host "Running backup (excluding node_modules, .next, .git, etc.)..." -ForegroundColor Yellow
    
    # Build the command string for Invoke-Expression
    $cmd = "robocopy `"$sourceDir`" `"$fullBackupPath`" /E"
    foreach ($dir in $excludeDirs) {
        $cmd += " /XD `"$dir`""
    }
    foreach ($file in $excludeFiles) {
        $cmd += " /XF `"$file`""
    }
    $cmd += " /MT:8 /NFL /NDL /NJH /NJS /NC /NS /NP"
    
    Write-Host "Command: $cmd" -ForegroundColor Gray
    Invoke-Expression $cmd
    
    # Robocopy exit codes: 0-7 are success, 8+ are errors
    if ($LASTEXITCODE -lt 8) {
        Write-Host ""
        Write-Host "[SUCCESS] Backup completed successfully!" -ForegroundColor Green
        Write-Host "Backup saved to: $fullBackupPath" -ForegroundColor Cyan
        
        # Get backup size
        $backupSize = (Get-ChildItem $fullBackupPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Host "Backup size: $([math]::Round($backupSize, 2)) MB" -ForegroundColor Cyan
    } else {
        throw "Robocopy failed with exit code: $LASTEXITCODE"
    }
    
    # List recent backups
    Write-Host ""
    Write-Host "Recent backups:" -ForegroundColor Cyan
    Get-ChildItem $BackupPath -Directory | 
        Sort-Object CreationTime -Descending | 
        Select-Object -First 5 |
        ForEach-Object {
            $age = (Get-Date) - $_.CreationTime
            $sizeGB = (Get-ChildItem $_.FullName -Recurse | Measure-Object -Property Length -Sum).Sum / 1GB
            $sizeText = "{0:N2}" -f $sizeGB
            $hoursText = [math]::Round($age.TotalHours, 1)
            Write-Host "  - $($_.Name) (${sizeText} GB, ${hoursText} hours ago)" -ForegroundColor Gray
        }
}
catch {
    Write-Host ""
    Write-Host "[ERROR] Backup failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
