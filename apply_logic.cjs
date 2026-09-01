const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
let js = fs.readFileSync('temp_modal_logic.js', 'utf8');

const regex = /static async renderRecordDetailsModal\(record, workers, readOnly = false\) \{([\s\S]*?)modal\.classList\.remove\('hidden'\);\s*\}/;

if (html.match(regex)) {
    html = html.replace(regex, js);
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("index.html updated successfully!");
} else {
    console.log("Regex did not match in index.html");
}
