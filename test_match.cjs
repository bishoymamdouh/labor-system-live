const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /<div class="modal-footer" id="record-modal-footer">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/section>/;
const match = html.match(regex);
if (match) {
    console.log("Found:", match[0]);
} else {
    console.log("Not found");
}
