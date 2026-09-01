const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/generateRecordCardHTML\([\s\S]*?<\/div>\s*`;\s*\}/);
if (match) {
    fs.writeFileSync('temp_card.js', match[0], 'utf8');
}
