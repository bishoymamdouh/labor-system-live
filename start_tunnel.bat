@echo off
title Permanent Link Tunnel
echo Starting Localtunnel...
:loop
npx localtunnel --port 8000 --subdomain labor-system-live
echo Restarting tunnel in 5 seconds...
timeout /t 5 >nul
goto loop

