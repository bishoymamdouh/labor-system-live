const { execSync } = require('child_process');
try {
    execSync('node -c index.html 2>&1');
    console.log("Syntax OK");
} catch(e) {
    console.log(e.stdout ? e.stdout.toString() : e.message);
}
