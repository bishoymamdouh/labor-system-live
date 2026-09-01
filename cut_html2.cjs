const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const cutIndex = html.indexOf('<div class="record-summary">');
if (cutIndex !== -1) {
    console.log('Found cut index at ' + cutIndex);
    fs.writeFileSync('index_rebuilt.html', html.substring(0, cutIndex));
} else {
    console.log('Not found!');
}
