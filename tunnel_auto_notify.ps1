$subdomain = "labor-system-now"
$port = 8000
$target = "https://${subdomain}.loca.lt"

while ($true) {
    Write-Host "Starting tunnel..."
    
    $process = Start-Process -FilePath "cmd" -ArgumentList "/c .\deno.exe run -A npm:localtunnel --port $port --subdomain $subdomain" -PassThru -RedirectStandardOutput "tunnel.log" -WindowStyle Hidden
    
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
    
    if ($found -and $url -eq $target) {
        Write-Host "Success! Got $url. Tunnel is running."
        $process.WaitForExit()
    } else {
        Write-Host "Failed or got wrong url: $url. Retrying in 5 minutes..."
        if ($process -ne $null -and !$process.HasExited) {
            taskkill /F /PID $process.Id /T
        }
        Start-Sleep -Seconds 300
    }
}


