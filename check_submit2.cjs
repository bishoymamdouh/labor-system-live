const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/async submitReport\([\s\S]*?catch \(/);
if (match) console.log(match[0]);
