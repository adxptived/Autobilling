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

echo Opening browser extensions page...
call npm run open:extensions

echo.
echo In your browser:
echo 1. Open extensions page if it did not open automatically
echo    Chrome: chrome://extensions
echo    Edge: edge://extensions
echo    Brave: brave://extensions
echo    Opera: opera://extensions
echo    Firefox 142+: about:debugging#/runtime/this-firefox
echo 2. Enable Developer mode if needed
echo 3. Click Load unpacked / Load Temporary Add-on
echo 4. Select this folder for Chrome/Edge/Brave/Opera:
echo %cd%\dist
echo    Or select this manifest for Firefox:
echo %cd%\dist-firefox\manifest.json
echo.
pause
