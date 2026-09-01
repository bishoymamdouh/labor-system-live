const fs = require('fs');
const text = fs.readFileSync('restored_chunk.html', 'utf8');
const jsStart = text.indexOf('// API Wrapper for Deno Backend');
console.log(text.substring(jsStart - 200, jsStart));
