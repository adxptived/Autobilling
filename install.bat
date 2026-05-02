@echo off
setlocal

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install it from https://nodejs.org and run this file again.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm is not available. Reinstall Node.js and run this file again.
  pause
  exit /b 1
)

echo Installing dependencies...
call npm install
if errorlevel 1 (
  echo npm install failed.
  pause
  exit /b 1
)

echo Building extension...
call npm run build
if errorlevel 1 (
  echo Build failed.
  pause
  exit /b 1
)

echo Opening Chrome extensions page...
call npm run open:chrome

echo.
echo In Chrome:
echo 1. Enable Developer mode
echo 2. Click Load unpacked
echo 3. Select this folder:
echo %cd%\dist
echo.
pause
