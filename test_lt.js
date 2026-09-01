const localtunnel = require('localtunnel');

(async () => {
    try {
        const tunnel = await localtunnel({ port: 8000, subdomain: 'labor-system-live' });
        console.log("Tunnel URL:", tunnel.url);

        tunnel.on('close', () => {
            console.log("Tunnel closed");
        });
        
        tunnel.on('error', (err) => {
            console.error("Tunnel error:", err);
        });
    } catch (err) {
        console.error("Caught error:", err);
    }
})();
