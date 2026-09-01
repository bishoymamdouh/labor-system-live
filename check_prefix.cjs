const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/let prefix = window.currentCardPrefix \|\| 'card';/);
if (match) console.log(match[0]); else console.log("Prefix not found");
