@echo off
title Backend Server
:loop
echo Starting Deno Server...
.\deno.exe run -A --unstable-kv server.ts
echo Server stopped. Restarting in 2 seconds...
timeout /t 2
goto loop
