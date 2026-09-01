const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetMethodRegex = /    async submitRecord\(\) \{[\s\S]*?        document\.getElementById\('workers-list'\)\.innerHTML = '';/g;
const match = targetMethodRegex.exec(html);

if (match) {
    let block = match[0];
    
    // 1. Fix date and engineer logic
    block = block.replace(/        if \(role === 'engineer' \|\| role === 'admin'\) \{\r?\n            engineerId = auth\.currentUser\.id;\r?\n        \} else if \(!engineerId\) \{/,
        `        if (role === 'engineer') {
            engineerId = auth.currentUser.id;
        } else if (!engineerId) {`);
        
    // 2. Set auto-approved for admin
    block = block.replace(/            status: 'pending',/,
        `            status: role === 'admin' ? 'approved' : 'pending',`);
        
    html = html.replace(match[0], block);
    fs.writeFileSync('index.html', html);
    console.log("Updated submitRecord logic successfully");
} else {
    console.log("Could not match submitRecord");
}
