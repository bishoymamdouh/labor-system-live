const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /static generateRecordCardHTML\([\s\S]*?<\/div>\s*`;\s*return html;/;
const match = html.match(regex);
if (match) {
    fs.writeFileSync('temp_card.js', match[0], 'utf8');
    console.log("Card HTML extracted");
} else {
    console.log("Not found");
}
