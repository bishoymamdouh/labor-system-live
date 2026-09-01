const fs = require('fs');
const buffer = fs.readFileSync('script3.js');
// If script3.js is UTF-8 encoded with mojibake, we need to convert it back to bytes.
// Actually, let's see how Deno reads it.
const text = fs.readFileSync('script3.js', 'utf8');

// Let's try to convert the mojibake back.
const bytes = new Uint8Array(text.length);
for(let i=0; i<text.length; i++) {
    bytes[i] = text.charCodeAt(i) & 0xff;
}

const fixed = new TextDecoder('utf-8').decode(bytes);

fs.writeFileSync('script3_fixed.js', fixed);
