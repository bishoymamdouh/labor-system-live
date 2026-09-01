const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/async forwardRecord\([\s\S]*?\} finally \{[\s\S]*?\}/);
if (match) console.log(match[0]);
