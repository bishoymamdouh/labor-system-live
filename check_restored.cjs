const fs = require('fs');
const html = fs.readFileSync('restored_chunk.html', 'utf8');
console.log(html.substring(0, 200));
