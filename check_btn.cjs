const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
lines.forEach((l, i) => {
    if (l.includes('btn.disabled = false')) console.log(`Line ${i}: ${l}`);
});
