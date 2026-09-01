const { spawn } = require("child_process");

console.log("Starting Localtunnel monitor...");

function startTunnel() {
    console.log("Attempting to connect localtunnel...");
    const lt = spawn("npx.cmd", ["localtunnel", "--port", "8000", "--subdomain", "labor-system-live"]);
    
    let notified = false;

    lt.stdout.on("data", async (data) => {
        const output = data.toString();
        console.log("[LT OUT]", output);
        if (output.includes("your url is: https://labor-system-live.loca.lt") && !notified) {
            notified = true;
            console.log("SUCCESS! Tunnel is up. Waiting 10s to stabilize before pushing...");
            
            // Wait 10 seconds to ensure the tunnel is fully stabilized
            setTimeout(async () => {
                try {
                    console.log("Sending push notifications...");
                    const res = await fetch("http://localhost:8000/api/broadcast", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            target: "all",
                            title: "تذكير يومي",
                            message: "برجاء الدخول وتسجيل سراكي العمالة واليوميات في النظام.",
                            url: "https://labor-system-live.loca.lt/"
                        })
                    });
                    const json = await res.json();
                    console.log("Push result:", json);
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
        setTimeout(startTunnel, 10000);
    });
}

startTunnel();
