const fs = require('fs');

const text = fs.readFileSync('script3.js', 'utf8');

const bytes = new Uint8Array(text.length);
for(let i=0; i<text.length; i++) {
    bytes[i] = text.charCodeAt(i) & 0xff;
}

const fixed = new TextDecoder('windows-1256').decode(bytes);
fs.writeFileSync('script3_fixed.js', fixed);
