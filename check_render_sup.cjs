const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/static renderSupervisorRecords\([\s\S]*?\}\s*static/);
if (match) console.log(match[0]);
