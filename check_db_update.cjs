const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/async update\([\s\S]*?\}/);
if (match) console.log(match[0]);
