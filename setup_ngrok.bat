@echo off
if not exist ngrok.exe (
    echo Downloading Ngrok...
    curl -L -o ngrok.zip "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip"
    powershell Expand-Archive -Path ngrok.zip -DestinationPath . -Force
    del ngrok.zip
)
ngrok config add-authtoken 3I88SWus5ECFaH6VFaRJJisq5UI_4d9NHxRq6DN6Me3shqoW9
echo Authtoken configured!
