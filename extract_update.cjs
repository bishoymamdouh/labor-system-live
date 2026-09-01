const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /updateRecordStatus\([\s\S]*?\}/;
const match = html.match(regex);
if (match) {
    fs.writeFileSync('temp_update.js', match[0], 'utf8');
    console.log("Logic extracted to temp_update.js");
} else {
    console.log("Not found");
}
