const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/async loadEngineerData\([\s\S]*?catch/);
if (match) console.log(match[0]);
