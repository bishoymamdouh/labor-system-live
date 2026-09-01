@echo off
echo ========================================================
echo PLEASE WAIT... A browser window will open automatically.
echo Click "Authorize" in the browser to deploy the app.
echo ========================================================
.\deno.exe run -A jsr:@deno/deployctl deploy --project=examples-hello-world --prod server.ts
pause
