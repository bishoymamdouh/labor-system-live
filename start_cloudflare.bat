@echo off
title Cloudflare Tunnel
echo Starting local server...
start /min cmd /c "deno run -A --unstable-kv server.ts"

echo Starting Cloudflare Tunnel...
.\cloudflared.exe tunnel --url http://localhost:8000
