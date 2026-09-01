const fs = require('fs');
const js = fs.readFileSync('script3.js', 'utf8');

const strings = js.match(/[\u0080-\uFFFF]+/g);
if (strings) {
    const unique = [...new Set(strings)];
    fs.writeFileSync('mojibake.txt', unique.join('\n'));
}
