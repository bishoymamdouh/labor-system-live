const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/id=".*?type-\$\{w\.id\}"/);
if (match) console.log(match[0]);
