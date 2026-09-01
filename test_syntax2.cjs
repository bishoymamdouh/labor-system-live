const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const scriptMatch = html.match(/<script>\s*\n\/\/ API Wrapper[\s\S]*?<\/script>/);
if (scriptMatch) {
    fs.writeFileSync('temp_test.js', scriptMatch[0].replace(/<\/?script>/g, ''), 'utf8');
    const { execSync } = require('child_process');
    try {
        execSync('node -c temp_test.js');
        console.log("Syntax OK");
    } catch(e) {
        console.log("Syntax Error:", e.stderr.toString());
    }
} else {
    console.log("Script not found");
}
