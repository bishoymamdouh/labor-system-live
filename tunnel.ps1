$subdomain = "labor-system-live"
$port = 8000
$target = "https://${subdomain}.loca.lt"

while ($true) {
    Write-Host "Starting tunnel..."
    
    # Start npx and redirect output to a file so we can parse it
    $process = Start-Process -FilePath "npx.cmd" -ArgumentList "localtunnel --port $port --subdomain $subdomain" -PassThru -RedirectStandardOutput "tunnel.log" -WindowStyle Hidden
    
    # Wait for the "your url is" line
    $found = $false
    for ($i=0; $i -lt 15; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Path "tunnel.log") {
            $log = Get-Content "tunnel.log" -Raw
            if ($log -match "your url is: (https://[a-zA-Z0-9-]+\.loca\.lt)") {
                $url = $matches[1]
                $found = $true
                break
            }
        }
    }
    
    if ($found) {
        if ($url -eq $target) {
            Write-Host "Success! Got $url"
            $process.WaitForExit()
        } else {
            Write-Host "Failed! Got wrong url: $url. Retrying in 10s..."
            Stop-Process -Name node -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 10
        }
    } else {
        Write-Host "Failed to get url in time. Retrying..."
        Stop-Process -Name node -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 5
    }
}
