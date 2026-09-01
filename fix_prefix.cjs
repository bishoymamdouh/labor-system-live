const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regexStatus = /if \(status === 'approved' \|\| status === 'pending'\) \{/;

const newStatus = `let prefix = window.currentCardPrefix || 'card';
                if (status === 'approved' || status === 'pending') {`;

if (html.match(regexStatus)) {
    html = html.replace(regexStatus, newStatus);
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("prefix definition added back!");
} else {
    console.log("Could not find status condition");
}
