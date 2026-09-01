const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/async updateRecordStatus\([\s\S]*?alert\(\`تم/);
if (match) console.log(match[0]);
