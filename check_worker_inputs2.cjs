const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/<td data-label="النوع">[\s\S]*?id="\$\{view\}-card-type-\$\{w\.id\}"[\s\S]*?<\/select>/);
if (match) console.log(match[0]);
