const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /static async renderRecordDetailsModal\(record, workers, readOnly = false\) \{([\s\S]*?)modal\.classList\.remove\('hidden'\);\s*\}/;
const match = html.match(regex);
if (match) {
    fs.writeFileSync('temp_modal_logic.js', match[0], 'utf8');
    console.log("Logic extracted to temp_modal_logic.js");
} else {
    console.log("Not found");
}
