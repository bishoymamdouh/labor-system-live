@echo off
echo Starting Labor Management System...
echo -----------------------------------
echo Two new windows will open: one for the Backend Server and one for the LocalTunnel.
echo If they close or crash, they will automatically restart themselves!
echo -----------------------------------

start "Backend Server" cmd /c "start_server.bat"
start "LocalTunnel" cmd /c "start_tunnel.bat"

echo System started successfully. You can close this window.
timeout /t 3
exit
