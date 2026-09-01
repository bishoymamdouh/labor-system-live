const { spawn } = require('child_process');
const https = require('https');

const SUBDOMAIN = 'labor-system-live';
const TARGET_URL = `https://${SUBDOMAIN}.loca.lt`;
let ltProcess = null;
let pingInterval = null;

function startTunnel() {
    console.log("Starting Localtunnel...");
    ltProcess = spawn('npx', ['localtunnel', '--port', '8000', '--subdomain', SUBDOMAIN], { shell: true });

    ltProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        console.log(`[LT] ${output}`);
        
        if (output.includes('your url is:')) {
            const url = output.split('your url is:')[1].trim();
            if (url !== TARGET_URL) {
                console.error(`ERROR: Got wrong URL ${url}. Localtunnel server has locked our subdomain! Retrying in 15 seconds...`);
                killTunnel(15000);
            } else {
                console.log(`SUCCESS: Tunnel secured at ${TARGET_URL}. Starting health checks...`);
                startHealthCheck();
            }
        }
    });

    ltProcess.stderr.on('data', (data) => {
        console.error(`[LT ERR] ${data}`);
    });

    ltProcess.on('close', (code) => {
        console.log(`Localtunnel exited with code ${code}. Restarting in 5 seconds...`);
        cleanup();
        setTimeout(startTunnel, 5000);
    });
}

function killTunnel(restartDelay = 5000) {
    if (ltProcess) {
        ltProcess.removeAllListeners('close');
        ltProcess.on('close', () => {
            cleanup();
            setTimeout(startTunnel, restartDelay);
        });
        ltProcess.kill('SIGKILL');
        ltProcess = null;
    } else {
        setTimeout(startTunnel, restartDelay);
    }
}

function cleanup() {
    if (pingInterval) clearInterval(pingInterval);
    pingInterval = null;
}

function startHealthCheck() {
    cleanup();
    pingInterval = setInterval(() => {
        https.get(TARGET_URL, (res) => {
            if (res.statusCode === 504 || res.statusCode === 503) {
                console.error(`Health check failed with ${res.statusCode}. Restarting tunnel...`);
                killTunnel();
            } else {
                console.log(`Health check OK (${res.statusCode})`);
            }
        }).on('error', (err) => {
            console.error(`Health check network error: ${err.message}. Restarting tunnel...`);
            killTunnel();
        });
    }, 60000);
}

startTunnel();
