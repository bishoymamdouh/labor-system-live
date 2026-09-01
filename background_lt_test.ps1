$subdomain = "labor-system-live"
$port = 8000
$target = "https://${subdomain}.loca.lt"

while ($true) {
    if (Test-Path "tunnel.log") { Remove-Item "tunnel.log" }
    Write-Host "Testing localtunnel..."
    
    $process = Start-Process -FilePath "cmd" -ArgumentList "/c .\deno.exe run -A npm:localtunnel --port $port --subdomain $subdomain" -PassThru -RedirectStandardOutput "tunnel.log" -WindowStyle Hidden
    
    $found = $false
    for ($i=0; $i -lt 30; $i++) {
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
        Write-Host "Success! Got $url."
        Set-Content -Path "TUNNEL_SUCCESS.txt" -Value "SUCCESS"
        break
    } else {
        Write-Host "Failed. Retrying in 5 minutes..."
        if ($process -ne $null -and !$process.HasExited) {
            taskkill /F /PID $process.Id /T
        }
        Start-Sleep -Seconds 300
    }
}
