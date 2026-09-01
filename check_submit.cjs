const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/async submitReport\([\s\S]*?fetch\('\/api\/broadcast'[\s\S]*?\}\)/);
if (match) console.log(match[0]);
