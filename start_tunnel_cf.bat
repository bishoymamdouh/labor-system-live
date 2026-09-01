@echo off
title Cloudflare Link Tunnel
echo Starting Cloudflare Tunnel...
:loop
cloudflared.exe tunnel --url http://localhost:8000
echo Restarting tunnel in 5 seconds...
timeout /t 5 >nul
goto loop
