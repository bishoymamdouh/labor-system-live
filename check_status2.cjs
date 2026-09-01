const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/async updateRecordStatus\([\s\S]*?try \{/);
if (match) console.log(match[0]);
