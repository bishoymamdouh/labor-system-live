const port = 8000;
const targetSubdomain = "labor-system-live3";
const targetUrl = `https://${targetSubdomain}.loca.lt`;

while (true) {
    console.log("Starting localtunnel...");
    const command = new Deno.Command("deno", {
        args: ["run", "-A", "npm:localtunnel", "--port", port.toString(), "--subdomain", targetSubdomain],
        stdout: "piped",
        stderr: "piped",
    });
    
    const process = command.spawn();
    
    const reader = process.stdout.getReader();
    const decoder = new TextDecoder();
    
    let urlFound = false;
    let outString = "";
    
    // Read the first chunk to get the URL
    const { value, done } = await reader.read();
    if (value) {
        outString = decoder.decode(value);
        console.log("Localtunnel output:", outString);
        if (outString.includes(targetUrl)) {
            console.log("Tunnel established perfectly at", targetUrl);
            urlFound = true;
        }
    }
    
    if (urlFound) {
        // Wait for it to exit
        await process.status;
        console.log("Localtunnel exited, restarting...");
    } else {
        console.log("Got wrong url. Killing process and retrying in 5 seconds...");
        process.kill("SIGTERM");
        await new Promise(r => setTimeout(r, 5000));
    }
}
