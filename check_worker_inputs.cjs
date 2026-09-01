const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/id="\$\{view\}-card-type-\$\{w\.id\}"/);
if (match) console.log("Prefix matches inside worker table!"); else console.log("Prefix mismatch in worker table");
