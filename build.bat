@echo off
setlocal
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python 3.10 or later is required to rebuild the archive.
  echo The existing index.html can be opened without Python.
  pause
  exit /b 1
)
python scripts\build.py
if errorlevel 1 (
  echo Build failed. Please check the message above.
  pause
  exit /b 1
)
echo Done. Open index.html in your browser.
pause
