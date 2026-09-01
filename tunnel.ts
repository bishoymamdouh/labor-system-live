import localtunnel from 'npm:localtunnel';

let currentTunnel;

async function startTunnel() {
  try {
      currentTunnel = await localtunnel({ port: 8000, subdomain: 'labor-live-2026' });
      console.log(`Tunnel URL: ${currentTunnel.url}`);
      
      currentTunnel.on('close', () => {
        setTimeout(startTunnel, 5000);
      });
      currentTunnel.on('error', (err) => {
        currentTunnel.close();
      });
  } catch (err) {
      setTimeout(startTunnel, 10000);
  }
}

["SIGINT", "SIGBREAK"].forEach((sig) => {
    try {
        Deno.addSignalListener(sig as Deno.Signal, () => {
            if (currentTunnel) currentTunnel.close();
            Deno.exit(0);
        });
    } catch (e) {}
});

startTunnel();
