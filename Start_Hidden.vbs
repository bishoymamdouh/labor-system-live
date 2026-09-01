Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c .\deno.exe run -A --unstable-kv server.ts", 0, False
WshShell.Run "cmd /c .\deno.exe run -A tunnel.ts", 0, False
Set WshShell = Nothing
