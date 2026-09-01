while ($true) {
    if (Test-Path "tunnel.log") { Remove-Item "tunnel.log" }
    $process = Start-Process -FilePath "cmd" -ArgumentList "/c .\deno.exe run -A npm:localtunnel --port 8000 --subdomain labor-system-live" -PassThru -RedirectStandardOutput "tunnel.log" -WindowStyle Hidden
    
    $url = $null
    for ($i=0; $i -lt 15; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Path "tunnel.log") {
            $log = Get-Content "tunnel.log" -Raw
            if ($log -match "your url is: (https://[a-zA-Z0-9-]+\.loca\.lt)") {
                $url = $matches[1]
                break
            }
        }
    }
    
    if ($url -eq "https://labor-system-live.loca.lt") {
        Write-Host "GOT IT!"
        break
    } else {
        if ($process -ne $null -and !$process.HasExited) {
            taskkill /F /PID $process.Id /T | Out-Null
        }
        Start-Sleep -Seconds 2
    }
}
