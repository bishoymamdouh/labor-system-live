$targetSubdomain = "labor-system-live"
$targetUrl = "https://$targetSubdomain.loca.lt"

while ($true) {
    Write-Host "Starting localtunnel..."
    $process = Start-Process -FilePath ".\deno.exe" -ArgumentList "run -A npm:localtunnel --port 8000 --subdomain $targetSubdomain" -NoNewWindow -PassThru -RedirectStandardOutput "lt_out.txt"
    
    # Wait for output to populate
    Start-Sleep -Seconds 5
    $out = Get-Content "lt_out.txt" -Raw
    
    if ($out -match $targetUrl) {
        Write-Host "Tunnel established perfectly at $targetUrl"
        $process.WaitForExit()
    } else {
        Write-Host "Got wrong url or no output: $out"
        Write-Host "Killing process and retrying..."
        Stop-Process -Id $process.Id -Force
        Start-Sleep -Seconds 3
    }
}
