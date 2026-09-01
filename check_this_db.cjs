const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const matches = html.match(/this\.db/g);
console.log("Remaining this.db count:", matches ? matches.length : 0);
