const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
lines.forEach((line, i) => {
    if (line.includes('let prefix = window.currentCardPrefix')) {
        console.log(`Line ${i + 1}: ${line}`);
    }
});
