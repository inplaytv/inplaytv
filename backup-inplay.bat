@echo off
echo ========================================
echo   BACKING UP INPLAYTV TO I: DRIVE
echo ========================================
echo.
echo Starting backup...
echo.

robocopy "C:\inplaytv - New" "I:\inplaytv_backup" /MIR /R:3 /W:5 /MT:8 /XD node_modules .next .turbo dist build .git

echo.
echo ========================================
echo   BACKUP COMPLETE
echo ========================================
echo.
pause
