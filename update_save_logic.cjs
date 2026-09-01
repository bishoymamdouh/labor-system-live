const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regexSave = /if \(status === 'approved'\) \{(\s*let newTotalAmount = 0;\s*\/\/\s*Fetch actual workers)/;

const newSave = `if (status === 'approved' || status === 'pending') {$1`;

if (html.match(regexSave)) {
    html = html.replace(regexSave, newSave);
    console.log("save workers logic updated for pending status!");
    fs.writeFileSync('index.html', html, 'utf8');
} else {
    console.log("save logic not found");
}
