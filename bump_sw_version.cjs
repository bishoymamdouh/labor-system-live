const fs = require('fs');
let sw = fs.readFileSync('sw.js', 'utf8');
const versionRegex = /const CACHE_NAME = 'labor-app-v(\d+)';/;
const match = sw.match(versionRegex);
if (match) {
    const newVersion = parseInt(match[1]) + 1;
    sw = sw.replace(versionRegex, `const CACHE_NAME = 'labor-app-v${newVersion}';`);
    fs.writeFileSync('sw.js', sw, 'utf8');
    console.log("Bumped sw.js version to v" + newVersion);
} else {
    console.log("Cache name not found in sw.js");
}
