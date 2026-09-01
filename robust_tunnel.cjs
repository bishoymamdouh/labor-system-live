const localtunnel = require('localtunnel');

const SUBDOMAIN = 'labor-system-live';
const PORT = 8000;
let tunnel = null;

async function startTunnel() {
    console.log("Requesting Localtunnel for " + SUBDOMAIN + "...");
    try {
        tunnel = await localtunnel({ port: PORT, subdomain: SUBDOMAIN });

        console.log(`[LT] your url is: ${tunnel.url}`);

        if (tunnel.url !== `https://${SUBDOMAIN}.loca.lt`) {
            console.error(`ERROR: Got wrong URL ${tunnel.url}. Subdomain locked! Retrying in 15 seconds...`);
            tunnel.close();
            setTimeout(startTunnel, 15000);
        } else {
            console.log("SUCCESS! Tunnel secured.");
            tunnel.on('close', () => {
                console.log("Tunnel closed. Restarting in 5 seconds...");
                setTimeout(startTunnel, 5000);
            });
            tunnel.on('error', (err) => {
                console.error("Tunnel error:", err);
                tunnel.close();
            });
        }
    } catch (err) {
        console.error("Error creating tunnel:", err);
        setTimeout(startTunnel, 5000);
    }
}

startTunnel();
