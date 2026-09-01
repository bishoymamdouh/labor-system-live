const { spawn } = require("child_process");
const http = require("http");

console.log("Starting Localtunnel monitor...");

function startTunnel() {
    console.log("Attempting to connect localtunnel...");
    const lt = spawn("npx.cmd", ["localtunnel", "--port", "8000", "--subdomain", "labor-system-live"]);
    
    let notified = false;

    lt.stdout.on("data", (data) => {
        const output = data.toString();
        console.log("[LT OUT]", output);
        if (output.includes("your url is: https://labor-system-live.loca.lt") && !notified) {
            notified = true;
            console.log("SUCCESS! Tunnel is up. Waiting 10s to stabilize before pushing...");
            
            setTimeout(() => {
                try {
                    console.log("Sending push notifications...");
                    
                    const postData = JSON.stringify({
                        target: "all",
                        title: "تذكير يومي",
                        message: "برجاء الدخول وتسجيل سراكي العمالة واليوميات الخاصة باليوم في النظام.",
                        url: "https://labor-system-live.loca.lt/"
                    });

                    const options = {
                        hostname: 'localhost',
                        port: 8000,
                        path: '/api/broadcast',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Length': Buffer.byteLength(postData)
                        }
                    };

                    const req = http.request(options, (res) => {
                        let data = '';
                        res.on('data', (chunk) => { data += chunk; });
                        res.on('end', () => { console.log("Push result:", data); });
                    });

                    req.on('error', (e) => {
                        console.error(`Problem with request: ${e.message}`);
                    });

                    req.write(postData);
                    req.end();
                    
                } catch (err) {
                    console.error("Failed to send push:", err);
                }
            }, 10000);
        }
    });

    lt.stderr.on("data", (data) => {
        console.error("[LT ERR]", data.toString());
    });

    lt.on("close", (code) => {
        console.log(`Localtunnel exited with code ${code}. Retrying in 10 seconds...`);
        notified = false;
        setTimeout(startTunnel, 10000);
    });
}

startTunnel();
