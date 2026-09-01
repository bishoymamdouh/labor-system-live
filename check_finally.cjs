const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/alert\(\`تم \$\{status === 'approved'[\s\S]*?\}\s*finally/);
if (match) console.log(match[0]);
