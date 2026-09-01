const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// The corruption happened around line 988. Let's find the exact cut point.
const cutIndex = html.indexOf('<span>?????? ??????:</span>');
if (cutIndex !== -1) {
    console.log('Found cut index at ' + cutIndex);
    fs.writeFileSync('index_rebuilt.html', html.substring(0, cutIndex));
} else {
    console.log('Not found!');
}
