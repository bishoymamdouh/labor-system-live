@echo off
title Labor Management System
echo Starting Database Server...
start /min cmd /c ".\deno.exe run -A --unstable-kv server.ts"

echo Starting Permanent Link and Auto-Notifier...
start /min cmd /c "powershell -ExecutionPolicy Bypass -File tunnel_auto_notify.ps1"

echo ===================================================
echo SYSTEM IS RUNNING ONLINE!
echo.
echo Your Link: 
echo https://labor-system-live.loca.lt
echo.
echo You can now minimize this window.
echo ===================================================
pause
