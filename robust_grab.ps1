$logFile = "tunnel_$($PID).log"
Write-Host "Starting aggressive reclaim loop..."
while ($true) {
    if (Test-Path $logFile) { Remove-Item $logFile }
    $process = Start-Process -FilePath "cmd" -ArgumentList "/c .\deno.exe run -A npm:localtunnel --port 8000 --subdomain labor-system-live" -PassThru -RedirectStandardOutput $logFile -WindowStyle Hidden
    
    $url = $null
    for ($i=0; $i -lt 5; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Path $logFile) {
            $log = Get-Content $logFile -Raw
            if ($log -match "your url is: (https://[a-zA-Z0-9-]+\.loca\.lt)") {
                $url = $matches[1]
                break
            }
        }
    }
    
    if ($url -eq "https://labor-system-live.loca.lt") {
        Write-Host "GOT IT! URL is: $url"
        break
    } else {
        Write-Host "Got wrong URL: $url - killing and retrying..."
        if ($process -ne $null -and !$process.HasExited) {
            taskkill /F /PID $process.Id /T | Out-Null
        }
        # If it failed to start, just sleep for a moment
        Start-Sleep -Milliseconds 500
    }
}
