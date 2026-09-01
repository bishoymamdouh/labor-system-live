const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const target = html.match(/\}\r?\n\s*\/\/\s*---\s*Reports Functions\s*---/);
if (target) {
    html = html.replace(target[0], '}\n    }\n    // --- Reports Functions ---');
    fs.writeFileSync('index.html', html);
    console.log("Fixed missing closing brace");
} else {
    console.log("Could not find the target");
}
