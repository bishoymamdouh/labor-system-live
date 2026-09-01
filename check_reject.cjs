const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regexStatus = /async updateRecordStatus\(recordId, status, btn = null\) \{([\s\S]*?)try \{[\s\S]*?if \(status === 'approved'\) \{/;

if (html.match(regexStatus)) {
    console.log(html.match(regexStatus)[0]);
}
