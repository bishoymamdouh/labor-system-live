const localtunnel = require('localtunnel');

async function startTunnel() {
    let success = false;
    while (!success) {
        try {
            const tunnel = await localtunnel({ port: 8000, subdomain: 'labor-system-live' });
            if (tunnel.url.includes('labor-system-live')) {
                console.log('Successfully acquired ' + tunnel.url);
                success = true;
                
                tunnel.on('close', () => {
                    console.log('Tunnel closed! Reconnecting in 5s...');
                    setTimeout(startTunnel, 5000);
                });
            } else {
                console.log('Got wrong subdomain: ' + tunnel.url + '. Retrying in 10s...');
                tunnel.close();
                await new Promise(r => setTimeout(r, 10000));
            }
        } catch (err) {
            console.log('Error: ' + err.message);
            await new Promise(r => setTimeout(r, 10000));
        }
    }
}
startTunnel();
