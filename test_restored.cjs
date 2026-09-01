const fs = require('fs');
const text = fs.readFileSync('restored_chunk.html', 'utf8');
console.log(text.substring(0, 300));
