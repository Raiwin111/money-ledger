@echo off
setlocal
cd /d "%~dp0"
title Money Ledger - local server

where python >nul 2>nul
if errorlevel 1 goto nopython

echo Starting Money Ledger on http://localhost:4173/
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:4173/'"
python -m http.server 4173 --bind 127.0.0.1
goto end

:nopython
echo.
echo Python was not found on this computer.
echo Install Python, or open index.html directly (offline features still work,
echo but installing the app and the service worker require a local server).
echo.
pause

:end
endlocal
