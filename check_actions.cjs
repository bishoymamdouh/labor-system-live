const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/let actionsHtml = ([\s\S]*?)<\/button>\s*\`;\s*\}/);
if (match) console.log(match[0]);
