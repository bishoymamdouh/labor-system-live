$subdomain = "labor-system-live"
$port = 8000
$target = "https://${subdomain}.loca.lt"

$process = Start-Process -FilePath "npx.cmd" -ArgumentList "localtunnel --port $port --subdomain $subdomain" -PassThru -RedirectStandardOutput "tunnel_out2.txt" -RedirectStandardError "tunnel_err2.txt" -WindowStyle Hidden

Start-Sleep -Seconds 5
Get-Content tunnel_out2.txt
Get-Content tunnel_err2.txt
