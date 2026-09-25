@echo off
setlocal
cd /d "%~dp0"
echo Industry Archive - data update
echo Refreshing SEC financial statements and filing history, then rebuilding HTML.
echo Company research narratives are preserved and flagged for review when needed.
echo.
where python >nul 2>nul
if errorlevel 1 (
  echo Python 3.10 or later is required. Existing 3. Industry Study.html still works without Python.
  pause
  exit /b 1
)
python scripts\update.py %*
set "archiveUpdateExit=%errorlevel%"
echo.
if "%archiveUpdateExit%"=="0" (
  echo Completed. Reopen 3. Industry Study.html to see the updated archive.
) else (
  echo Some updates failed or require review. Previous available data was preserved.
  echo Read data\update-status.json for the exact update results.
)
pause
exit /b %archiveUpdateExit%
