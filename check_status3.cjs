const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/record\.status = status;[\s\S]*?await db\.update\('records', recordId, record\);/);
if (match) console.log(match[0]);
